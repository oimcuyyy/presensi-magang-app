import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  MapPin,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldCheck,
  History,
  Barcode,
  Search,
  Check,
  X
} from 'lucide-react';
import api from '../services/api';

// Web Audio API pure tone generator
const playSound = (type = 'success') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio synthesis fallback
  }
};

const ScanAttendance = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Results
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const html5QrCodeRef = useRef(null);
  const isCooldownRef = useRef(false);

  useEffect(() => {
    fetchLocations();
    return () => {
      stopCameraScanner();
    };
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      const locList = res.data.data || [];
      setLocations(locList);
      if (locList.length > 0) {
        setSelectedLocation(locList[0].id);
      }
    } catch (e) {
      console.error('Failed to load locations:', e);
    }
  };

  const startCameraScanner = async () => {
    if (isScanning) return;
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setScanStatus('error');
      setStatusMessage('Gagal menyalakan sensor kamera. Pastikan izin akses kamera diberikan.');
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    setIsScanning(false);
  };

  const handleCodeDetected = async (rawCode) => {
    if (isCooldownRef.current || isProcessing) return;
    isCooldownRef.current = true;
    setIsProcessing(true);

    try {
      await processScan(rawCode);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isCooldownRef.current = false;
      }, 2000);
    }
  };

  const processScan = async (codeString) => {
    try {
      const res = await api.post('/attendances/scan', {
        qr_token: codeString,
        location_id: selectedLocation
      });

      const data = res.data;
      if (soundEnabled) playSound('success');

      setScanStatus('success');
      setStatusMessage(data.message);
      setLastScanResult({
        student: data.student,
        type: data.type,
        status: data.status,
        time: data.time || new Date().toLocaleTimeString('id-ID'),
        timestamp: new Date()
      });

      setRecentScans((prev) => [
        {
          id: Date.now(),
          student: data.student,
          type: data.type,
          status: data.status,
          time: data.time || new Date().toLocaleTimeString('id-ID'),
        },
        ...prev.slice(0, 11)
      ]);

      setManualInput('');
    } catch (err) {
      if (soundEnabled) playSound('error');
      setScanStatus('error');
      const errorMsg = err.response?.data?.message || 'Kode barcode tidak dikenali atau tidak terdaftar.';
      setStatusMessage(errorMsg);
      if (err.response?.data?.student) {
        setLastScanResult({
          student: err.response.data.student,
          type: 'error',
          errorMsg
        });
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processScan(manualInput.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Terminal Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
              SMK Negeri 20 Jakarta &bull; Pos Piket Presensi
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-blue-600" />
              Stasiun Pemindai Barcode & QR Siswa
            </h1>
            <p className="text-xs text-slate-500">
              Gerbang pemindaian kartu identitas kehadiran siswa di pos sekolah atau kantor PKL.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? 'Matikan nada konfirmasi' : 'Nyalakan nada konfirmasi'}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
              title={soundEnabled ? 'Audio konfirmasi aktif' : 'Audio konfirmasi nonaktif'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Location Selector */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer pr-2 font-semibold"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scanner Viewport (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Sensor Pemindai Kamera
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={isScanning ? stopCameraScanner : startCameraScanner}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isScanning
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isScanning ? 'Hentikan Kamera' : 'Nyalakan Kamera'}
                </button>
              </div>

              {/* Viewport Frame */}
              <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[320px] flex items-center justify-center border border-slate-800">
                <div id="qr-reader" className="w-full h-full" />

                {!isScanning && (
                  <div className="text-center p-8 text-slate-400 space-y-3 z-10">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <Barcode className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Kamera Belum Aktif</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                        Aktifkan kamera ponsel / webcam untuk memindai kartu pelajar siswa secara otomatis.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startCameraScanner}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Buka Kamera Sekarang
                    </button>
                  </div>
                )}

                {isScanning && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-full text-[10px] font-mono text-slate-200 flex items-center gap-2 pointer-events-none z-20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    SENSOR AKTIF &bull; ARAHKAN KE BARCODE
                  </div>
                )}
              </div>
            </div>

            {/* USB Laser Gun / Keyboard NISN Input */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Input Barcode Gun USB &bull; Nomor NISN
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Arahkan laser scanner USB ke kartu siswa atau ketik NISN siswa lalu tekan Enter.
              </p>

              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan barcode laser atau ketik NISN siswa..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualInput.trim()}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-40"
                >
                  Proses
                </button>
              </form>
            </div>
          </div>

          {/* Verification Result Card & Recent History Ledger (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Verification Result Box */}
            <div
              className={`p-5 rounded-2xl border transition-colors ${
                scanStatus === 'success'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : scanStatus === 'error'
                  ? 'bg-red-50/60 border-red-200'
                  : 'bg-white border-slate-200/90'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-700" />
                  Hasil Verifikasi
                </span>

                {scanStatus && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      scanStatus === 'success' ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                    }`}
                  >
                    {scanStatus === 'success' ? 'Terverifikasi' : 'Ditolak'}
                  </span>
                )}
              </div>

              {lastScanResult?.student ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden shrink-0">
                      {lastScanResult.student.photo ? (
                        <img
                          src={
                            lastScanResult.student.photo.startsWith('http')
                              ? lastScanResult.student.photo
                              : `${import.meta.env.VITE_BACKEND_URL || ''}${lastScanResult.student.photo}`
                          }
                          alt={lastScanResult.student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-700 text-sm">
                          {lastScanResult.student.name?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {lastScanResult.student.name}
                      </h4>
                      <p className="font-mono text-xs font-semibold text-blue-700">
                        NISN: {lastScanResult.student.nisn || '-'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {lastScanResult.student.kelas} &bull; {lastScanResult.student.jurusan}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <span className="text-[9px] font-bold uppercase text-slate-500">Kategori</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {lastScanResult.type === 'checkin' ? 'Masuk (Check-In)' : 'Pulang (Check-Out)'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <span className="text-[9px] font-bold uppercase text-slate-500">Waktu Tercatat</span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">{lastScanResult.time}</p>
                    </div>
                  </div>

                  <p
                    className={`text-xs font-semibold flex items-center gap-1.5 pt-1 ${
                      scanStatus === 'success' ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {scanStatus === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{statusMessage}</span>
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <ScanLine className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Menunggu data pemindaian berikutnya...</p>
                </div>
              )}
            </div>

            {/* Scan Log History */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-600" />
                  Log Pemindaian Hari Ini ({recentScans.length})
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
                {recentScans.length > 0 ? (
                  recentScans.map((scan) => (
                    <div key={scan.id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-900 truncate">
                          {scan.student?.name}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500">
                          NISN: {scan.student?.nisn || '-'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            scan.type === 'checkin'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {scan.type}
                        </span>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5">{scan.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Belum ada rekaman pemindaian pada sesi ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanAttendance;

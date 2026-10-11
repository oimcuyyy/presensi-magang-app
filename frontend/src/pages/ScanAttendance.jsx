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
  History,
  Barcode,
  Search,
  Check,
  X
} from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

// Web Audio API tone feedback
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

  // Hasil Scan
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const html5QrCodeRef = useRef(null);
  const isCooldownRef = useRef(false);

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    fetchLocations();
    const handleVisibility = () => {
      if (document.hidden) {
        stopCameraScanner();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopCameraScanner();
    };
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      const locList = res.data?.data || [];
      setLocations(locList);
      if (locList.length > 0) {
        setSelectedLocation(locList[0].id);
      }
    } catch (e) {
      console.error('Gagal memuat lokasi PKL');
    }
  };

  const startCameraScanner = async () => {
    if (isScanning) return;
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
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
      setScanStatus(null);
      setStatusMessage('');
    } catch (err) {
      console.error('Camera start error:', err);
      setScanStatus('error');
      setStatusMessage('Gagal menyalakan kamera. Pastikan izin akses kamera diberikan.');
    }
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
          time: data.time || new Date().toLocaleTimeString('id-ID')
        },
        ...prev.slice(0, 9)
      ]);

      setManualInput('');
    } catch (err) {
      if (soundEnabled) playSound('error');
      setScanStatus('error');
      const errorMsg = err.response?.data?.message || 'Kode barcode tidak dikenali atau belum terdaftar.';
      setStatusMessage(errorMsg);
      setLastScanResult(null);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processScan(manualInput.trim());
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Scan Kartu Siswa"
        description="Pindai QR Code atau Barcode pada kartu pelajar siswa untuk mencatat kehadiran secara langsung."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Suara aktif' : 'Suara dimatikan'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Suara Aktif' : 'Senyap'}</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Kamera Scanner & Input Manual */}
        <div className="lg:col-span-7 space-y-5">
          {/* Pilihan Titik Pos Lokasi */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label htmlFor="pos-select" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pos Lokasi Pemindaian
              </label>
              <p className="text-[11px] text-slate-500">Pilih titik gerbang / pos tempat scanner ini berada.</p>
            </div>
            <select
              id="pos-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-[#0c2340] outline-none max-w-xs truncate"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Viewfinder Kamera */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kamera Pemindai
              </span>
              <Button
                variant={isScanning ? 'danger' : 'primary'}
                size="sm"
                leftIcon={Camera}
                onClick={isScanning ? stopCameraScanner : startCameraScanner}
              >
                {isScanning ? 'Matikan Kamera' : 'Nyalakan Kamera'}
              </Button>
            </div>

            {/* Kotak Scanner (Terpusat & Rapi Tanpa Geser) */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-w-md mx-auto flex items-center justify-center border border-slate-800 shadow-inner">
              <div id="qr-reader" className="w-full h-full" />

              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3 z-10 bg-slate-950/95">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                    <ScanLine className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Kamera Belum Aktif</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Tekan tombol "Nyalakan Kamera" untuk mulai memindai kartu pelajar siswa.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={startCameraScanner}
                    className="mt-2"
                  >
                    Nyalakan Kamera
                  </Button>
                </div>
              )}

              {/* Overlay Bidik Kamera saat Aktif */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <div className="w-56 h-56 border-2 border-white/70 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                    {/* Retikel Sudut */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-[#d97706]" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-[#d97706]" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-[#d97706]" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-[#d97706]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Manual NISN / Barcode */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Input Manual NISN (Bila Barcode Rusak)
            </span>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Ketik NISN siswa, mis. 1234567890..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
              />
              <Button type="submit" variant="primary" size="sm" leftIcon={Search}>
                Cari
              </Button>
            </form>
          </div>
        </div>

        {/* Kolom Kanan: Panel Hasil Scan yang Menonjol */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Hasil Scan</h2>
              {scanStatus && (
                <Badge
                  status={scanStatus === 'success' ? 'hadir' : 'ditolak'}
                  size="sm"
                >
                  {scanStatus === 'success' ? 'Berhasil' : 'Gagal'}
                </Badge>
              )}
            </div>

            {scanStatus === 'success' && lastScanResult?.student ? (
              <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-3 animate-scaleIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {lastScanResult.student.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    NISN: {lastScanResult.student.nisn || '-'} • Kelas: {lastScanResult.student.kelas || '-'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2">
                  <Badge status="hadir" size="md">
                    {lastScanResult.type === 'checkout' ? 'Absen Pulang' : 'Absen Masuk'}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {lastScanResult.time} WIB
                  </span>
                </div>
              </div>
            ) : scanStatus === 'error' ? (
              <div className="p-5 bg-red-50/70 border border-red-200 rounded-2xl text-center space-y-2 animate-scaleIn">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-red-900">Pemindaian Gagal</h3>
                <p className="text-xs text-red-700 leading-relaxed max-w-xs mx-auto">
                  {statusMessage || 'Barcode tidak valid atau belum terdaftar di sistem.'}
                </p>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <ScanLine className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-semibold">Menunggu hasil pemindaian kartu...</p>
              </div>
            )}
          </div>

          {/* Riwayat Scan Hari Ini */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Scan Hari Ini ({recentScans.length})
            </h3>

            {recentScans.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Belum ada yang discan.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {recentScans.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.student?.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {item.student?.nisn} • {item.time} WIB
                      </p>
                    </div>
                    <Badge size="sm" status={item.status === 'terlambat' ? 'terlambat' : 'hadir'}>
                      {item.type === 'checkout' ? 'Pulang' : 'Masuk'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanAttendance;

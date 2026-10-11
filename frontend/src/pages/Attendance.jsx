import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Check,
  X,
  Navigation,
  Signal,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import WebcamCapture from '../components/WebcamCapture';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

// Haversine formula untuk perhitungan jarak GPS akurat (dalam meter)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('hadir'); // 'hadir' | 'izin'

  // Geolocation & Server State
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [history, setHistory] = useState([]);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Input State
  const [photoUrl, setPhotoUrl] = useState(null);
  const [leaveType, setLeaveType] = useState('izin');
  const [leaveNotes, setLeaveNotes] = useState('');
  const [leavePhoto, setLeavePhoto] = useState(null);

  // History Filter
  const [filterDate, setFilterDate] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLocations();
    fetchHistory();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let watchId;

    if (activeTab === 'hadir') {
      if (!navigator.geolocation) {
        setError('Perangkat tidak mendukung geolokasi GPS.');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationAccuracy(Math.round(position.coords.accuracy));
        },
        (err) => {
          let errorMsg = 'Gagal mengakses GPS.';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Akses GPS ditolak. Mohon aktifkan izin lokasi di browser Anda.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Sinyal lokasi GPS tidak terdeteksi. Pastikan GPS HP aktif.';
              break;
            case err.TIMEOUT:
              errorMsg = 'Waktu pencarian GPS habis. Muat ulang halaman.';
              break;
            default:
              errorMsg = 'Terjadi kesalahan saat membaca lokasi GPS.';
          }
          setError(errorMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000
        }
      );
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [activeTab]);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      const locList = res.data?.data || [];
      setLocations(locList);
      if (locList.length > 0) {
        setSelectedLocation(locList[0].id);
      }
    } catch (e) {
      console.error('Gagal memuat daftar lokasi PKL');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/attendances/history');
      setHistory(res.data?.data || []);
    } catch (e) {
      console.error('Gagal memuat riwayat presensi');
    }
  };

  const activeLocObj = locations.find((l) => l.id === Number(selectedLocation));

  const distanceToLoc =
    currentCoords && activeLocObj
      ? calculateDistance(
          currentCoords.latitude,
          currentCoords.longitude,
          activeLocObj.latitude,
          activeLocObj.longitude
        )
      : null;

  const isWithinRadius =
    distanceToLoc !== null && activeLocObj && distanceToLoc <= activeLocObj.radius;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = history.find((h) => h.date && h.date.startsWith(todayStr));

  const handleAttendance = async (type) => {
    if (!currentCoords) {
      setError('Lokasi GPS belum terkunci. Tunggu beberapa detik.');
      return;
    }
    if (!photoUrl) {
      setError('Ambil foto selfie di lokasi terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        location_id: selectedLocation,
        photo_url: photoUrl
      };

      const endpoint = type === 'in' ? '/attendances/checkin' : '/attendances/checkout';
      const response = await api.post(endpoint, payload);

      setMessage(response.data.message);
      setPhotoUrl(null);
      fetchHistory();

      // Haptic feedback getar pada HP
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      if (err.response?.data) {
        let errorMsg = err.response.data.message;
        if (err.response.data.distance) {
          errorMsg += ` (Jarak Anda: ${err.response.data.distance} m, Batas: ${err.response.data.allowed_radius} m)`;
        }
        setError(errorMsg);
      } else {
        setError('Gagal memproses absensi. Pastikan koneksi server aktif.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveNotes || !leavePhoto) {
      setError('Keterangan alasan dan foto bukti surat dokter/izin wajib disertakan.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api.post('/attendances/leave', {
        type: leaveType,
        notes: leaveNotes,
        photo_url: leavePhoto
      });

      setMessage(response.data.message);
      setLeaveNotes('');
      setLeavePhoto(null);
      fetchHistory();

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim pengajuan izin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLeavePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredHistory = filterDate
    ? history.filter((h) => h.date && h.date.startsWith(filterDate))
    : history;

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Absen"
        description="Pencatatan kehadiran harian magang dengan verifikasi lokasi GPS dan foto selfie di tempat kerja."
        actions={
          <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('hadir')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'hadir'
                  ? 'bg-white text-[#0c2340] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absen Hadir
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('izin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'izin'
                  ? 'bg-white text-[#0c2340] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengajuan Izin / Sakit
            </button>
          </div>
        }
      />

      {/* Pesan Sukses / Error Banner */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── TAB 1: ABSEN HADIR (GPS & FOTO SELFIE) ──────────────── */}
      {activeTab === 'hadir' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Form & Status Lokasi */}
          <div className="lg:col-span-7 space-y-5">
            {/* Kartu Jam & Pilihan Lokasi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0c2340]" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Jam Sekarang
                  </span>
                </div>
                <span className="font-mono text-base font-extrabold text-[#0c2340]">
                  {formattedTime} WIB
                </span>
              </div>

              {/* Pilihan Lokasi PKL (Lebar Penuh Tanpa Terpotong) */}
              <div>
                <label
                  htmlFor="location-select"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Pilih Titik Lokasi Magang
                </label>
                <div className="relative">
                  <select
                    id="location-select"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10 outline-none transition-all truncate pr-8"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} (Radius: {loc.radius} meter)
                      </option>
                    ))}
                  </select>
                </div>
                {activeLocObj && (
                  <p className="mt-1.5 text-[11px] text-slate-500 truncate">
                    Alamat: {activeLocObj.address || '-'}
                  </p>
                )}
              </div>

              {/* Visual Jarak & Geofence Status (Indikator Grafis Bersih) */}
              <div className={`p-4 rounded-xl border transition-all ${
                isWithinRadius
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Navigation className={`w-4 h-4 ${isWithinRadius ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <span className="text-xs font-bold">
                      {isWithinRadius ? 'Di Dalam Area Absen' : 'Di Luar Area Absen'}
                    </span>
                  </div>
                  {locationAccuracy && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/70 border border-current">
                      GPS &plusmn;{locationAccuracy}m
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline justify-between text-xs font-medium">
                  <span>
                    Jarak saat ini:{' '}
                    <strong className="font-mono font-bold text-sm">
                      {distanceToLoc !== null ? `${distanceToLoc} m` : 'Mencari...'}
                    </strong>
                  </span>
                  <span>
                    Batas radius: <strong className="font-mono">{activeLocObj?.radius || 0} m</strong>
                  </span>
                </div>

                {/* Progress Bar Jarak */}
                <div className="w-full bg-slate-200/80 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isWithinRadius ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{
                      width: activeLocObj && distanceToLoc !== null
                        ? `${Math.min(100, Math.max(5, (activeLocObj.radius / Math.max(distanceToLoc, 1)) * 100))}%`
                        : '0%'
                    }}
                  />
                </div>

                {!isWithinRadius && distanceToLoc !== null && activeLocObj && (
                  <p className="mt-2 text-[11px] leading-relaxed text-amber-800">
                    Kamu berjarak {distanceToLoc} meter dari lokasi. Dekati lokasi hingga di bawah {activeLocObj.radius} meter untuk bisa menekan tombol absen.
                  </p>
                )}
              </div>
            </div>

            {/* Tombol Aksi Check-in & Check-out */}
            <div className="space-y-3">
              {!todayRecord ? (
                <div>
                  <Button
                    variant="primary"
                    size="thumb"
                    disabled={!isWithinRadius || !photoUrl || isLoading}
                    isLoading={isLoading}
                    onClick={() => handleAttendance('in')}
                  >
                    Absen Masuk
                  </Button>
                  {(!isWithinRadius || !photoUrl) && (
                    <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                      {!photoUrl
                        ? 'Wajib mengambil foto selfie di kamera terlebih dahulu'
                        : 'Tombol nonaktif karena kamu belum berada di dalam area lokasi'}
                    </p>
                  )}
                </div>
              ) : !todayRecord.check_out_time ? (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <span>Sudah absen masuk jam <strong>{todayRecord.check_in_time}</strong></span>
                    <Badge size="sm" status="hadir">Masuk</Badge>
                  </div>
                  <div>
                    <Button
                      variant="accent"
                      size="thumb"
                      disabled={!isWithinRadius || !photoUrl || isLoading}
                      isLoading={isLoading}
                      onClick={() => handleAttendance('out')}
                    >
                      Absen Pulang
                    </Button>
                    {(!isWithinRadius || !photoUrl) && (
                      <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                        {!photoUrl
                          ? 'Ambil foto selfie sebelum menekan absen pulang'
                          : 'Tombol nonaktif karena berada di luar area lokasi'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-center space-y-1">
                  <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-900">Presensi Hari Ini Selesai</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Masuk: {todayRecord.check_in_time} • Pulang: {todayRecord.check_out_time}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Kamera Selfie */}
          <div className="lg:col-span-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 self-start">
                Bukti Foto Selfie
              </span>
              <WebcamCapture onCapture={(img) => setPhotoUrl(img)} />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PENGAJUAN IZIN / SAKIT ───────────────────────── */}
      {activeTab === 'izin' && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="leave-type-select"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Jenis Pengajuan
              </label>
              <select
                id="leave-type-select"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-[#0c2340] outline-none"
              >
                <option value="izin">Izin Tidak Masuk</option>
                <option value="sakit">Sakit (Dengan Surat Dokter)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="leave-notes-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Keterangan / Alasan
              </label>
              <textarea
                id="leave-notes-input"
                rows={4}
                required
                value={leaveNotes}
                onChange={(e) => setLeaveNotes(e.target.value)}
                placeholder="Tuliskan alasan lengkap tidak dapat hadir PKL..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-[#0c2340] outline-none resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="leave-photo-upload"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Unggah Bukti Surat Dokter / Foto Izin
              </label>
              <input
                id="leave-photo-upload"
                type="file"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0c2340] file:text-white hover:file:bg-[#132e58]"
              />
              {leavePhoto && (
                <div className="mt-3 w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                  <img src={leavePhoto} alt="Bukti izin" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
              >
                Kirim Pengajuan Izin
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ─── RIWAYAT PRESENSI (RESPONSIF MOBILE DENGAN CARD LIST) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">
            Riwayat Absen
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs font-semibold">Belum ada data absen di tanggal ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 font-mono font-bold text-slate-800 flex flex-col items-center justify-center text-xs shrink-0 leading-tight">
                    <span>{item.date ? new Date(item.date).getDate() : '-'}</span>
                    <span className="text-[9px] text-slate-400">
                      {item.date ? new Date(item.date).toLocaleDateString('id-ID', { month: 'short' }) : ''}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {item.location_name || 'Lokasi PKL'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Masuk: {item.check_in_time || '-'} • Pulang: {item.check_out_time || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge
                    size="sm"
                    status={item.status === 'terlambat' ? 'terlambat' : item.status === 'izin' ? 'izin' : 'hadir'}
                  >
                    {item.status === 'terlambat' ? 'Terlambat' : item.status === 'izin' ? 'Izin' : 'Tepat Waktu'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;

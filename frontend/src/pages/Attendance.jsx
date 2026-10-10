import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  QrCode,
  Calendar,
  ChevronRight,
  Radio,
  Check,
  X,
  Compass,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import WebcamCapture from '../components/WebcamCapture';

// Haversine formula for exact geofence distance calculation in meters
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
  const navigate = useNavigate();
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

      setCurrentCoords(null);
      setError(null);

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationAccuracy(Math.round(position.coords.accuracy));
          setError(null);
        },
        (err) => {
          let errorMsg = 'Gagal mengakses GPS.';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Akses GPS ditolak. Harap izinkan izin lokasi pada peramban Anda.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Sinyal satelit GPS tidak terdeteksi. Aktifkan setelan lokasi HP.';
              break;
            case err.TIMEOUT:
              errorMsg = 'Waktu pencarian sinyal GPS habis. Coba di area terbuka.';
              break;
            default:
              errorMsg = `GPS Error: ${err.message}`;
              break;
          }
          setError(errorMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeTab]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      const list = response.data.data || [];
      setLocations(list);
      if (list.length > 0) {
        setSelectedLocation(list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch locations');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/attendances/history');
      setHistory(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  // Distance computation
  const activeLocObj = locations.find((l) => l.id == selectedLocation);
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

  const handleAttendance = async (type) => {
    if (!currentCoords) {
      setError('Titik koordinat belum terkunci. Tunggu sinyal GPS.');
      return;
    }
    if (!photoUrl) {
      setError('Wajib mengambil foto bukti selfie kehadiran.');
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
    } catch (err) {
      if (err.response?.data) {
        let errorMsg = err.response.data.message;
        if (err.response.data.distance) {
          errorMsg += ` (Jarak Anda: ${err.response.data.distance}m, Batas: ${err.response.data.allowed_radius}m)`;
        }
        setError(errorMsg);
      } else {
        setError('Terjadi kendala pada server saat memproses presensi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveNotes || !leavePhoto) {
      setError('Keterangan alasan dan foto bukti surat dokter/izin wajib diisi.');
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
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kendala saat mengirimkan pengajuan izin.');
      }
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

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quick Nav Header Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              Presensi Mandiri PKL
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Pencatatan Kehadiran Siswa
            </h1>
            <p className="text-xs text-slate-500">
              Verifikasi titik koordinat satelit geofence dan swafoto di tempat kerja.
            </p>
          </div>

          <Link
            to="/card"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            Kartu Barcode Siswa
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex space-x-1 rounded-xl bg-slate-200/80 p-1 max-w-xs">
          <button
            onClick={() => {
              setActiveTab('hadir');
              setError(null);
              setMessage(null);
            }}
            className={`w-full rounded-lg py-1.5 text-xs font-bold transition-all ${
              activeTab === 'hadir' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Presensi Hadir
          </button>
          <button
            onClick={() => {
              setActiveTab('izin');
              setError(null);
              setMessage(null);
            }}
            className={`w-full rounded-lg py-1.5 text-xs font-bold transition-all ${
              activeTab === 'izin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Izin / Sakit
          </button>
        </div>

        {/* Main Operational Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {activeTab === 'hadir' ? (
            /* Hadir Form (8 Cols) */
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Verifikasi Lokasi & Swafoto
                </h2>

                {currentCoords ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Radio className="w-3 h-3 text-emerald-600" />
                    GPS Terkunci (&plusmn;{locationAccuracy}m)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                    Mencari Sinyal GPS...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Selection & Proximity Feedback */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pilih Titik Lokasi PKL / Sekolah
                    </label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} (Batas: {loc.radius}m)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Geofence Radar Card */}
                  {distanceToLoc !== null && activeLocObj && (
                    <div
                      className={`p-4 rounded-xl border space-y-2 ${
                        isWithinRadius
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          {isWithinRadius ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          )}
                          Status Geofence
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isWithinRadius
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {isWithinRadius ? 'Dalam Radius' : 'Di Luar Radius'}
                        </span>
                      </div>

                      <p className="text-xs">
                        Jarak Anda ke lokasi: <strong className="font-mono text-sm">{distanceToLoc} meter</strong> (Batas maksimal {activeLocObj.radius} meter).
                      </p>

                      {!isWithinRadius && (
                        <p className="text-[11px] text-amber-800 leading-normal">
                          Harap mendekat ke area tempat magang sebelum menekan tombol check-in.
                        </p>
                      )}
                    </div>
                  )}

                  {currentCoords && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Latitude:</span>
                        <span className="font-bold text-slate-900">{currentCoords.latitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Longitude:</span>
                        <span className="font-bold text-slate-900">{currentCoords.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selfie Webcam */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bukti Swafoto di Tempat Kerja
                  </label>
                  <WebcamCapture onCapture={(imgStr) => setPhotoUrl(imgStr)} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAttendance('in')}
                  disabled={isLoading || !currentCoords || !photoUrl}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4 rotate-180" />
                  Presensi Masuk (Check-In)
                </button>
                <button
                  type="button"
                  onClick={() => handleAttendance('out')}
                  disabled={isLoading || !currentCoords || !photoUrl}
                  className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4" />
                  Presensi Pulang (Check-Out)
                </button>
              </div>
            </div>
          ) : (
            /* Izin / Sakit Form (8 Cols) */
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
                Formulir Ketidakhadiran Resmi
              </h2>

              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jenis Keterangan
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="izin">Izin Resmi</option>
                    <option value="sakit">Sakit dengan Surat Keterangan Dokter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Alasan / Keterangan Lengkap
                  </label>
                  <textarea
                    rows={3}
                    value={leaveNotes}
                    onChange={(e) => setLeaveNotes(e.target.value)}
                    placeholder="Tuliskan alasan rinci permohonan izin..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Unggah Berkas Surat Bukti (JPG / PNG)
                  </label>
                  <div
                    onClick={() => document.getElementById('leave-file-input').click()}
                    className="p-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-center transition-colors"
                  >
                    {leavePhoto ? (
                      <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Berkas foto surat berhasil dipilih
                      </p>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                        <p className="text-xs font-bold text-slate-800">Pilih berkas dari perangkat</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Surat Keterangan Dokter atau Surat Izin Orang Tua</p>
                      </>
                    )}
                    <input
                      id="leave-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  Kirimkan Permohonan Izin
                </button>
              </form>
            </div>
          )}

          {/* Right Column: Clock Telemetry Card (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Waktu Sinkronisasi Server</span>
              </div>
              <p className="text-3xl font-black font-mono tracking-tight text-white pt-2">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-xs text-slate-400">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Batas Presensi Masuk:</span>
                <span className="font-mono font-bold text-white">08:00 WIB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Kategori Waktu:</span>
                <span className={`font-bold ${currentTime.toTimeString().split(' ')[0] > '08:00:00' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentTime.toTimeString().split(' ')[0] > '08:00:00' ? 'Terlambat' : 'Tepat Waktu'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 leading-normal">
              Presensi yang tercatat setelah pukul 08:00 WIB otomatis diklasifikasikan sebagai <em>Terlambat</em> pada rekapitulasi sekolah.
            </div>
          </div>
        </div>

        {/* History Table Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Buku Riwayat Presensi</h2>
              <p className="text-xs text-slate-500">Log kehadiran siswa yang tersimpan pada pangkalan data</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="text-xs text-blue-600 font-bold hover:underline">
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 pl-6 pr-3 text-left font-bold text-slate-600 uppercase tracking-wider">Tanggal</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Lokasi / Keterangan</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Masuk</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Pulang</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-6 pr-3 font-semibold text-slate-900 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-3.5 text-slate-700 max-w-[240px] truncate">
                        {item.location_name || item.notes || '-'}
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-600 whitespace-nowrap">{item.check_in_time || '-'}</td>
                      <td className="px-3 py-3.5 font-mono text-slate-600 whitespace-nowrap">{item.check_out_time || '-'}</td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'hadir'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'terlambat'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'ditolak'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400">
                      Tidak ada catatan presensi pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Attendance;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, LogOut, Navigation, CheckCircle2, AlertCircle, FileImage } from 'lucide-react';
import api from '../services/api';
import WebcamCapture from '../components/WebcamCapture';

const Attendance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hadir'); // 'hadir', 'izin'
  
  // Data State
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
  const [leavePhoto, setLeavePhoto] = useState(null); // base64 string

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
        setError('Geolocation tidak didukung oleh browser Anda.');
        return;
      }
      
      setCurrentCoords(null);
      setError(null);
      
      // Menggunakan watchPosition agar GPS terus mencari sinyal yang lebih akurat
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
          let errorMsg = 'Gagal mendapatkan lokasi Anda.';
          switch(err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = "Izin lokasi ditolak. Pastikan Anda mengizinkan akses lokasi untuk situs ini.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = "Sinyal GPS tidak tersedia. Pastikan fitur 'Lokasi/GPS' di HP Anda menyala.";
              break;
            case err.TIMEOUT:
              errorMsg = "Pencarian lokasi terlalu lama (Timeout). Coba lagi di tempat terbuka.";
              break;
            default:
              errorMsg = `Error GPS: ${err.message}`;
              break;
          }
          setError(errorMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
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
      setLocations(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedLocation(response.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch locations');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/attendances/history');
      setHistory(response.data.data);
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const handleAttendance = async (type) => {
    if (!currentCoords) {
      setError('Lokasi belum ditemukan, harap tunggu atau perbarui lokasi.');
      return;
    }
    if (!photoUrl) {
      setError('Anda harus mengambil foto bukti presensi terlebih dahulu.');
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
      setPhotoUrl(null); // Reset foto setelah berhasil
      fetchHistory(); // Refresh table
    } catch (err) {
      if (err.response && err.response.data) {
        let errorMsg = err.response.data.message;
        if (err.response.data.distance) {
           errorMsg += ` (Jarak Anda: ${err.response.data.distance}m, Batas: ${err.response.data.allowed_radius}m)`;
        }
        setError(errorMsg);
      } else {
        setError('Terjadi kesalahan pada server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveNotes || !leavePhoto) {
      setError('Alasan dan foto surat bukti wajib diisi.');
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
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan pada server.');
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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Absensi Kehadiran
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Catat kehadiran dengan validasi lokasi GPS dan Verifikasi Wajah (Selfie).
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {message}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex space-x-1 rounded-xl bg-gray-200/50 p-1 mb-8 max-w-sm">
          <button
            onClick={() => { setActiveTab('hadir'); setError(null); setMessage(null); }}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
              ${activeTab === 'hadir' 
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              }`}
          >
            Presensi (Hadir)
          </button>
          <button
            onClick={() => { setActiveTab('izin'); setError(null); setMessage(null); }}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
              ${activeTab === 'izin' 
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              }`}
          >
            Pengajuan Izin/Sakit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6 mb-10">
          {activeTab === 'hadir' ? (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight mb-4 border-b border-gray-100 pb-4">
                Verifikasi Data
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bagian Lokasi */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Pilih Titik Geofence</label>
                    {currentCoords ? (
                       <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                         GPS AKTIF (Akurasi: {locationAccuracy}m)
                       </span>
                    ) : (
                       <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">MENCARI GPS...</span>
                    )}
                  </div>
                  <select 
                    value={selectedLocation} 
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-gray-900 sm:text-sm bg-gray-50 mb-4"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name} (Radius: {loc.radius}m)</option>
                    ))}
                  </select>

                  {locationAccuracy > 100 && (
                    <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-200 mb-4">
                       <p className="text-xs text-amber-800 flex gap-2">
                         <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                         Akurasi GPS rendah ({locationAccuracy} meter). Sistem sedang mencoba mencari sinyal yang lebih baik. Harap berjalan ke area terbuka/dekat jendela.
                       </p>
                    </div>
                  )}

                  <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 mb-6">
                     <p className="text-xs text-blue-800 flex gap-2">
                       <MapPin className="w-4 h-4 shrink-0 text-blue-600" />
                       Sistem akan mengukur jarak antara koordinat HP Anda dengan titik geofence yang dipilih. Anda harus berada di radius yang ditentukan.
                     </p>
                  </div>
                </div>

                {/* Bagian Kamera */}
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium text-gray-700 w-full mb-2">Foto Bukti (Selfie)</label>
                  <WebcamCapture onCapture={(imgStr) => setPhotoUrl(imgStr)} />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAttendance('in')}
                  disabled={isLoading || !currentCoords || !photoUrl}
                  className="flex w-full justify-center items-center gap-2 rounded-md bg-gray-900 px-3 py-3 text-sm font-bold text-white shadow hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <LogOut className="w-4 h-4 rotate-180" /> CHECK IN
                </button>
                <button 
                  onClick={() => handleAttendance('out')}
                  disabled={isLoading || !currentCoords || !photoUrl}
                  className="flex w-full justify-center items-center gap-2 rounded-md bg-white px-3 py-3 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <LogOut className="w-4 h-4" /> CHECK OUT
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
               <h3 className="text-lg font-semibold text-gray-900 tracking-tight mb-4 border-b border-gray-100 pb-4">
                Formulir Pengajuan
              </h3>
              <form onSubmit={handleLeaveSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pengajuan</label>
                  <select 
                    value={leaveType} 
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-gray-900 sm:text-sm bg-white"
                  >
                    <option value="izin">Izin</option>
                    <option value="sakit">Sakit</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alasan</label>
                  <textarea 
                    value={leaveNotes}
                    onChange={(e) => setLeaveNotes(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan alasan lengkap Anda di sini..."
                    className="block w-full rounded-md border-0 py-2 pl-3 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-gray-900 sm:text-sm bg-white"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Bukti (Surat Dokter/Dll)</label>
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => document.getElementById('file-upload').click()}>
                    <div className="text-center">
                      {leavePhoto ? (
                        <div className="text-emerald-600 font-medium text-sm flex items-center justify-center gap-2">
                           <CheckCircle2 className="w-5 h-5" /> File berhasil dipilih
                        </div>
                      ) : (
                        <>
                          <FileImage className="mx-auto h-8 w-8 text-gray-300" aria-hidden="true" />
                          <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                            <span className="relative cursor-pointer rounded-md font-semibold text-gray-900 focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-900 focus-within:ring-offset-2 hover:text-gray-700">
                              <span>Pilih gambar dari perangkat</span>
                            </span>
                          </div>
                          <p className="text-xs leading-5 text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                        </>
                      )}
                      <input id="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center items-center gap-2 rounded-md bg-gray-900 px-3 py-3 text-sm font-bold text-white shadow hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Kirim Pengajuan
                </button>
              </form>
            </div>
          )}

          {/* Kolom Waktu Sidebar */}
          <div className="bg-gray-900 rounded-lg p-6 shadow-md border border-gray-800 flex flex-col justify-center items-center text-center relative overflow-hidden h-fit">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
            
            <div className="w-16 h-16 bg-gray-800/50 border border-gray-700/50 rounded-2xl flex items-center justify-center mb-6 z-10">
              <Clock className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-widest z-10">Waktu Server</h3>
            <p className="text-4xl lg:text-5xl font-mono text-white font-bold tracking-tighter z-10">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-gray-400 mt-4 text-sm font-medium z-10">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Tabel Riwayat */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-white">
            <h3 className="text-base font-semibold text-gray-900">Riwayat Kehadiran Anda</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi / Keterangan</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Masuk</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Keluar</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {history.length > 0 ? (
                  history.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                        {record.location_name ? (
                          <div className="flex items-center gap-1.5 text-gray-900">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" /> 
                            {record.location_name}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">{record.notes || '-'}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">{record.check_in_time || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">{record.check_out_time || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset
                          ${record.status === 'hadir' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                            record.status === 'terlambat' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' : 
                            record.status === 'ditolak' ? 'bg-red-50 text-red-700 ring-red-600/20' : 
                            'bg-blue-50 text-blue-700 ring-blue-600/20'}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <p className="text-sm font-medium text-gray-900">Belum ada riwayat</p>
                      <p className="text-sm text-gray-500 mt-1">Anda belum pernah melakukan absen atau pengajuan izin.</p>
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

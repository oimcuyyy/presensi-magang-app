import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Download,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  CreditCard,
  User,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

const AdminAttendance = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Photo Modal State
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/attendances/history');
      setHistory(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch global history');
      setError('Gagal memuat rekap absensi global.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (window.confirm(`Anda yakin ingin mengubah status menjadi ${status.toUpperCase()}?`)) {
      try {
        await api.put(`/attendances/${id}/status`, { status });
        setSuccess(`Status berhasil diubah menjadi ${status}`);
        fetchHistory();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Gagal mengubah status presensi');
      }
    }
  };

  const openGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const openPhotoModal = (url) => {
    const fullUrl = url.startsWith('http')
      ? url
      : `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
    setSelectedPhoto(fullUrl);
    setIsPhotoModalOpen(true);
  };

  const handleExport = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Nama Siswa,Tanggal,Lokasi/Keterangan,Jam Masuk,Jam Keluar,Status\n';

    filteredHistory.forEach((row) => {
      const date = new Date(row.date).toLocaleDateString('id-ID');
      const locationText = row.location_name ? row.location_name : row.notes || '-';
      csvContent += `"${row.student_name || row.user_id}",${date},"${locationText}",${row.check_in_time || '-'},${row.check_out_time || '-'},${row.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_absensi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredHistory = history.filter((item) => {
    const nameMatch =
      item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const dateMatch = !filterDate || (item.date && item.date.startsWith(filterDate));
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;
    return nameMatch && dateMatch && statusMatch;
  });

  // Calculate quick stats
  const statsHadir = history.filter((h) => h.status === 'hadir').length;
  const statsTerlambat = history.filter((h) => h.status === 'terlambat').length;
  const statsIzin = history.filter((h) => ['izin', 'sakit'].includes(h.status)).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Laporan Kehadiran Global
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Rekap & Validasi Presensi
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Pantau bukti foto selfie, keakuratan GPS di peta, dan ubah status kehadiran siswa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              <CreditCard className="w-4 h-4" /> Buka Scanner Absensi
            </Link>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Rekaman</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{history.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Hadir Tepat Waktu</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{statsHadir}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Terlambat</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{statsTerlambat}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Izin / Sakit</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{statsIzin}</p>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <XCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" /> {success}
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa, catatan, tempat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 px-3 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="all">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="terlambat">Terlambat</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="ditolak">Ditolak</option>
            </select>

            {(searchTerm || filterDate || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDate('');
                  setFilterStatus('all');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Global Attendance Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 text-left font-bold text-gray-600 uppercase tracking-wider">
                    Siswa / ID Card
                  </th>
                  <th className="px-3 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider">
                    Tanggal & Lokasi
                  </th>
                  <th className="px-3 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider">
                    Jam Absen
                  </th>
                  <th className="px-3 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider">
                    Bukti & Maps
                  </th>
                  <th className="px-3 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3.5 text-right font-bold text-gray-600 uppercase tracking-wider pr-6">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Siswa info & ID Card shortcut */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {item.student_name ? item.student_name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{item.student_name || `User #${item.user_id}`}</p>
                            <Link
                              to={`/card?user_id=${item.user_id}`}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 mt-0.5"
                              title="Lihat / Cetak Kartu Siswa Ini"
                            >
                              <CreditCard className="w-3 h-3" /> Lihat Kartu Siswa
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Tanggal & Lokasi */}
                      <td className="px-3 py-3.5 text-gray-700">
                        <p className="font-semibold text-gray-900">
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                          {item.location_name || item.notes || '-'}
                        </p>
                      </td>

                      {/* Jam Masuk & Pulang */}
                      <td className="px-3 py-3.5 font-mono text-gray-700">
                        <p className="font-bold text-emerald-700">
                          IN: {item.check_in_time || '-'}
                        </p>
                        <p className="text-gray-500">
                          OUT: {item.check_out_time || '-'}
                        </p>
                      </td>

                      {/* Bukti Foto & Maps Link */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          {item.photo_url ? (
                            <button
                              onClick={() => openPhotoModal(item.photo_url)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              <ImageIcon className="w-3 h-3 text-blue-600" /> Foto
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No Photo</span>
                          )}

                          {item.check_in_latitude && item.check_in_longitude ? (
                            <button
                              onClick={() =>
                                openGoogleMaps(item.check_in_latitude, item.check_in_longitude)
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition-colors"
                              title="Buka titik koordinat di Google Maps"
                            >
                              <MapPin className="w-3 h-3" /> Peta
                            </button>
                          ) : null}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
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

                      {/* Actions */}
                      <td className="px-3 py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'hadir')}
                            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            title="Set Hadir"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'ditolak')}
                            className="p-1 rounded-lg text-red-600 hover:bg-red-50"
                            title="Tolak Presensi"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      Tidak ada catatan presensi yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Photo Modal */}
      {isPhotoModalOpen && selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-lg w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
              <h4 className="font-bold text-gray-900 text-sm">Bukti Foto Presensi Siswa</h4>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-gray-100 max-h-[70vh] flex items-center justify-center">
              <img
                src={selectedPhoto}
                alt="Bukti Presensi"
                className="w-full h-full object-contain max-h-[65vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;

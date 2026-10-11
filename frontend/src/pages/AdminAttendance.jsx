import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  CreditCard,
  User,
  Clock,
  MapPin,
  AlertCircle,
  Check
} from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const AdminAttendance = () => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Photo Modal State
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Status Confirm Modal State
  const [confirmStatusData, setConfirmStatusData] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/attendances/history');
      setHistory(response.data?.data || []);
    } catch (err) {
      setError('Gagal memuat rekap presensi.');
    }
  };

  const executeUpdateStatus = async () => {
    if (!confirmStatusData) return;
    try {
      await api.put(`/attendances/${confirmStatusData.id}/status`, {
        status: confirmStatusData.newStatus
      });
      setSuccess(`Status kehadiran berhasil diubah menjadi ${confirmStatusData.newStatus}.`);
      setConfirmStatusData(null);
      fetchHistory();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Gagal memperbarui status presensi.');
      setConfirmStatusData(null);
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
  };

  const handleExport = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Nama Siswa,Tanggal,Lokasi/Alasan,Jam Masuk,Jam Pulang,Status\n';

    filteredHistory.forEach((row) => {
      const date = row.date ? new Date(row.date).toLocaleDateString('id-ID') : '-';
      const locationText = row.location_name || row.notes || '-';
      csvContent += `"${row.student_name || row.user_id}",${date},"${locationText}",${row.check_in_time || '-'},${row.check_out_time || '-'},${row.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_presensi_smkn20_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredHistory = history.filter((item) => {
    const nameMatch =
      item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const dateMatch = !filterDate || (item.date && item.date.startsWith(filterDate));
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;
    return nameMatch && dateMatch && statusMatch;
  });

  // Metrik Penghitungan Eksak (Menjumlah dengan Benar)
  const stats = {
    total: filteredHistory.length,
    hadir: filteredHistory.filter((i) => i.status === 'hadir').length,
    terlambat: filteredHistory.filter((i) => i.status === 'terlambat').length,
    izin: filteredHistory.filter((i) => i.status === 'izin' || i.status === 'sakit').length,
    ditolak: filteredHistory.filter((i) => i.status === 'ditolak' || i.status === 'alpa').length
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Rekap Absen"
        description="Cek foto bukti selfie, koordinat lokasi GPS siswa di peta, dan kelola status presensi."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={Download}
            onClick={handleExport}
            disabled={filteredHistory.length === 0}
          >
            Ekspor CSV
          </Button>
        }
      />

      {/* Banner Notifikasi */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ringkasan Angka Status yang Menjumlah Rapi */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rekaman</span>
          <p className="text-2xl font-mono font-extrabold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Tepat Waktu</span>
          <p className="text-2xl font-mono font-extrabold text-emerald-700">{stats.hadir}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Terlambat</span>
          <p className="text-2xl font-mono font-extrabold text-amber-700">{stats.terlambat}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Izin / Sakit</span>
          <p className="text-2xl font-mono font-extrabold text-blue-700">{stats.izin}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Ditolak / Alpa</span>
          <p className="text-2xl font-mono font-extrabold text-red-700">{stats.ditolak}</p>
        </div>
      </div>

      {/* Bilah Filter Pencarian & Tanggal */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa atau lokasi..."
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="hadir">Tepat Waktu</option>
            <option value="terlambat">Terlambat</option>
            <option value="izin">Izin</option>
            <option value="sakit">Sakit</option>
            <option value="ditolak">Ditolak</option>
          </select>

          {(searchTerm || filterDate || filterStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterDate('');
                setFilterStatus('all');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Surface Tabel / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-semibold">Tidak ada rekaman presensi yang sesuai filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Siswa</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Lokasi PKL</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Bukti Foto</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {row.student_name || `Siswa #${row.user_id}`}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {row.date ? new Date(row.date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate">
                          <span className="font-semibold">{row.location_name || '-'}</span>
                          {row.notes && <p className="text-[10px] text-slate-500 truncate">{row.notes}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap text-[11px]">
                        {row.check_in_time || '-'} {row.check_out_time ? `• ${row.check_out_time}` : ''}
                      </td>
                      <td className="py-3 px-4">
                        {row.check_in_photo_url ? (
                          <button
                            type="button"
                            onClick={() => openPhotoModal(row.check_in_photo_url)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 transition"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-[#0c2340]" />
                            <span>Lihat</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          size="sm"
                          status={
                            row.status === 'terlambat'
                              ? 'terlambat'
                              : row.status === 'izin' || row.status === 'sakit'
                              ? 'izin'
                              : row.status === 'ditolak'
                              ? 'ditolak'
                              : 'hadir'
                          }
                        >
                          {row.status === 'terlambat'
                            ? 'Terlambat'
                            : row.status === 'izin'
                            ? 'Izin'
                            : row.status === 'sakit'
                            ? 'Sakit'
                            : row.status === 'ditolak'
                            ? 'Ditolak'
                            : 'Tepat Waktu'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {row.status !== 'hadir' && (
                            <button
                              type="button"
                              onClick={() => setConfirmStatusData({ id: row.id, newStatus: 'hadir' })}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Setujui sebagai Hadir"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {row.status !== 'ditolak' && (
                            <button
                              type="button"
                              onClick={() => setConfirmStatusData({ id: row.id, newStatus: 'ditolak' })}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Tolak Presensi"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {row.check_in_latitude && row.check_in_longitude && (
                            <button
                              type="button"
                              onClick={() => openGoogleMaps(row.check_in_latitude, row.check_in_longitude)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Buka lokasi di Google Maps"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredHistory.map((row) => (
                <div key={row.id} className="p-3.5 bg-slate-50/70 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{row.student_name || `Siswa #${row.user_id}`}</p>
                      <p className="text-[11px] text-slate-500">
                        {row.date ? new Date(row.date).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                    <Badge
                      size="sm"
                      status={
                        row.status === 'terlambat'
                          ? 'terlambat'
                          : row.status === 'izin' || row.status === 'sakit'
                          ? 'izin'
                          : row.status === 'ditolak'
                          ? 'ditolak'
                          : 'hadir'
                      }
                    >
                      {row.status === 'terlambat'
                        ? 'Terlambat'
                        : row.status === 'izin'
                        ? 'Izin'
                        : row.status === 'ditolak'
                        ? 'Ditolak'
                        : 'Hadir'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <p className="truncate">Lokasi: <strong>{row.location_name || '-'}</strong></p>
                    <p className="font-mono">
                      Jam: {row.check_in_time || '-'} {row.check_out_time ? `• Pulang: ${row.check_out_time}` : ''}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    {row.check_in_photo_url ? (
                      <button
                        type="button"
                        onClick={() => openPhotoModal(row.check_in_photo_url)}
                        className="text-xs font-semibold text-[#0c2340] hover:underline flex items-center gap-1"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Lihat Foto
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Tidak ada foto</span>
                    )}

                    <div className="flex items-center gap-1">
                      {row.status !== 'hadir' && (
                        <button
                          type="button"
                          onClick={() => setConfirmStatusData({ id: row.id, newStatus: 'hadir' })}
                          className="px-2 py-1 text-emerald-700 bg-emerald-50 rounded-lg font-semibold text-[11px]"
                        >
                          Validasi
                        </button>
                      )}
                      {row.status !== 'ditolak' && (
                        <button
                          type="button"
                          onClick={() => setConfirmStatusData({ id: row.id, newStatus: 'ditolak' })}
                          className="px-2 py-1 text-red-700 bg-red-50 rounded-lg font-semibold text-[11px]"
                        >
                          Tolak
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── MODAL LIHAT FOTO SELFIE ─────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        title="Bukti Foto Selfie"
        description="Verifikasi keberadaan fisik siswa di tempat magang."
      >
        {selectedPhoto && (
          <div className="rounded-xl overflow-hidden bg-slate-900 max-h-96 flex items-center justify-center">
            <img src={selectedPhoto} alt="Bukti Selfie" className="w-full h-auto object-contain" />
          </div>
        )}
      </Modal>

      {/* ─── MODAL KONFIRMASI STATUS ─────────────────────────────── */}
      <Modal
        isOpen={Boolean(confirmStatusData)}
        onClose={() => setConfirmStatusData(null)}
        title="Ubah Status Kehadiran?"
        description={`Apakah Anda yakin ingin mengubah status presensi ini menjadi "${confirmStatusData?.newStatus}"?`}
      >
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="secondary" size="md" onClick={() => setConfirmStatusData(null)}>
            Batal
          </Button>
          <Button variant="primary" size="md" onClick={executeUpdateStatus}>
            Ubah Status
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAttendance;

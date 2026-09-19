import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Download, ExternalLink, Image as ImageIcon, XCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';

const AdminAttendance = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal State
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/attendances/history');
      setHistory(response.data.data);
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
    setSelectedPhoto(url.startsWith('http') ? url : url);
    setIsPhotoModalOpen(true);
  };

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Siswa,Tanggal,Lokasi/Keterangan,Jam Masuk,Jam Keluar,Status\n";
    
    history.forEach(row => {
      const date = new Date(row.date).toLocaleDateString('id-ID');
      const locationText = row.location_name ? row.location_name : (row.notes || '-');
      csvContent += `${row.student_name},${date},"${locationText}",${row.check_in_time || '-'},${row.check_out_time || '-'},${row.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "rekap_absensi_magang.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Rekap Absensi Global & Validasi
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pantau kehadiran, verifikasi foto di tempat, dan validasi koordinat GPS.
            </p>
          </div>
          <button 
            onClick={handleExport}
            className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        )}
        
        {success && (
          <div className="mb-6 rounded-md bg-emerald-50 p-4 border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-medium text-emerald-800">{success}</h3>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nama</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tanggal</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Lokasi / GPS</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Waktu</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Bukti</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-center">Aksi (Validasi)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {history.length > 0 ? (
                  history.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900 sm:pl-6">{record.student_name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(record.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {record.location_name ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-900">{record.location_name}</span>
                            {(record.check_in_latitude && record.check_in_longitude) && (
                              <button 
                                onClick={() => openGoogleMaps(record.check_in_latitude, record.check_in_longitude)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit"
                              >
                                <ExternalLink className="w-3 h-3" /> Cek GPS Maps
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="italic text-gray-500 max-w-[150px] truncate" title={record.notes}>
                            {record.notes || '-'}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                        <div><span className="text-green-600">IN:</span> {record.check_in_time || '-'}</div>
                        <div><span className="text-red-600">OUT:</span> {record.check_out_time || '-'}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 flex gap-2">
                        {record.check_in_photo_url && (
                          <button 
                            onClick={() => openPhotoModal(record.check_in_photo_url)}
                            className="bg-gray-100 p-2 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                            title="Lihat Bukti Foto"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {!record.check_in_photo_url && '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase ring-1 ring-inset
                          ${record.status === 'hadir' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                            record.status === 'terlambat' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' : 
                            record.status === 'ditolak' ? 'bg-red-50 text-red-700 ring-red-600/20' : 
                            'bg-blue-50 text-blue-700 ring-blue-600/20'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        {record.status !== 'ditolak' && (
                           <button
                             onClick={() => handleUpdateStatus(record.id, 'ditolak')}
                             className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded flex items-center gap-1 mx-auto transition-colors"
                             title="Tolak presensi jika memalsukan data/foto"
                           >
                             <XCircle className="w-4 h-4" /> Tolak
                           </button>
                        )}
                        {record.status === 'ditolak' && (
                           <button
                             onClick={() => handleUpdateStatus(record.id, 'hadir')}
                             className="text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 p-2 rounded flex items-center gap-1 mx-auto transition-colors"
                             title="Setujui presensi"
                           >
                             <CheckCircle className="w-4 h-4" /> Setujui
                           </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">Belum ada data absensi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsPhotoModalOpen(false)}>
          <div className="bg-white p-2 rounded-xl shadow-2xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Bukti Foto / Surat</h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-gray-500 hover:text-gray-900">Tutup</button>
            </div>
            <div className="p-4 flex justify-center bg-gray-100 rounded-b-xl overflow-hidden min-h-[300px]">
              <img src={selectedPhoto} alt="Bukti Absensi" className="max-h-[70vh] object-contain rounded shadow" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Mail,
  User
} from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'siswa',
    nisn: '',
    kelas: '',
    jurusan: '',
    nama_instansi: ''
  });

  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data?.data || []);
    } catch (err) {
      setError('Gagal memuat data pengguna.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/users', formData);
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'siswa',
        nisn: '',
        kelas: '',
        jurusan: '',
        nama_instansi: ''
      });
      setSuccess('Pengguna baru berhasil ditambahkan.');
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUserId) return;
    try {
      await api.delete(`/users/${deleteUserId}`);
      setSuccess('Pengguna berhasil dihapus.');
      setDeleteUserId(null);
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus pengguna.');
      setDeleteUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nisn?.includes(searchTerm);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Pengguna"
        description="Kelola akun siswa magang, guru pembimbing, dan petugas sekolah."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={UserPlus}
            onClick={() => setShowModal(true)}
          >
            Tambah Pengguna
          </Button>
        }
      />

      {/* Banner Pesan */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bilah Pencarian & Filter Peran */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, email, atau NISN..."
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
          >
            <option value="all">Semua Peran ({users.length})</option>
            <option value="siswa">Siswa PKL</option>
            <option value="guru_pembimbing">Guru Pembimbing</option>
            <option value="admin">Administrator TU</option>
          </select>
        </div>
      </div>

      {/* Surface Tabel Pengguna */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-semibold">Tidak ada pengguna yang cocok.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4">NISN / Kelas</th>
                    <th className="py-3 px-4">Lokasi PKL</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {u.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          u.role === 'admin'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : u.role === 'guru_pembimbing'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {u.role === 'admin' ? 'Admin TU' : u.role === 'guru_pembimbing' ? 'Guru' : 'Siswa PKL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {u.nisn ? `${u.nisn} (${u.kelas || '-'})` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {u.nama_instansi || '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {u.role === 'siswa' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/id-card?user_id=${u.id}`)}
                              className="p-1.5 text-slate-600 hover:text-[#0c2340] hover:bg-slate-100 rounded-lg transition"
                              title="Lihat Kartu Siswa"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteUserId(u.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredUsers.map((u) => (
                <div key={u.id} className="p-3.5 bg-slate-50/70 rounded-xl space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</p>
                    </div>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                      u.role === 'admin'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : u.role === 'guru_pembimbing'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'guru_pembimbing' ? 'Guru' : 'Siswa'}
                    </span>
                  </div>

                  {u.role === 'siswa' && (
                    <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                      <p>NISN: {u.nisn || '-'} • Kelas: {u.kelas || '-'}</p>
                      <p className="font-sans truncate">Tempat PKL: {u.nama_instansi || '-'}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    {u.role === 'siswa' ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/id-card?user_id=${u.id}`)}
                        className="text-xs font-semibold text-[#0c2340] hover:underline flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Lihat Kartu
                      </button>
                    ) : <span />}

                    <button
                      type="button"
                      onClick={() => setDeleteUserId(u.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── MODAL TAMBAH PENGGUNA ───────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Pengguna Baru"
        description="Buat akun untuk siswa magang, guru pembimbing, atau admin sekolah."
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="user-name" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              id="user-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
            />
          </div>

          <div>
            <label htmlFor="user-email" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
            />
          </div>

          <div>
            <label htmlFor="user-pass" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="user-pass"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
            />
          </div>

          <div>
            <label htmlFor="user-role" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Peran Akun <span className="text-red-500">*</span>
            </label>
            <select
              id="user-role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
            >
              <option value="siswa">Siswa PKL</option>
              <option value="guru_pembimbing">Guru Pembimbing</option>
              <option value="admin">Administrator TU</option>
            </select>
          </div>

          {formData.role === 'siswa' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-nisn" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    NISN
                  </label>
                  <input
                    id="user-nisn"
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
                  />
                </div>
                <div>
                  <label htmlFor="user-kelas" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kelas
                  </label>
                  <input
                    id="user-kelas"
                    type="text"
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    placeholder="XII RPL 1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user-instansi" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nama Tempat PKL
                </label>
                <input
                  id="user-instansi"
                  type="text"
                  value={formData.nama_instansi}
                  onChange={(e) => setFormData({ ...formData, nama_instansi: e.target.value })}
                  placeholder="PT Telekomunikasi Indonesia"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button variant="secondary" size="md" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isLoading}>
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL KONFIRMASI HAPUS PENGGUNA ─────────────────────── */}
      <Modal
        isOpen={Boolean(deleteUserId)}
        onClose={() => setDeleteUserId(null)}
        title="Hapus Pengguna?"
        description="Akun ini beserta seluruh data presensi dan riwayatnya akan dihapus permanen dari sistem."
      >
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="secondary" size="md" onClick={() => setDeleteUserId(null)}>
            Batal
          </Button>
          <Button variant="danger" size="md" onClick={confirmDelete}>
            Hapus Pengguna
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Trash2, ShieldCheck, X } from 'lucide-react';
import api from '../services/api';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'siswa', nisn: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch users');
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
      setFormData({ name: '', email: '', password: '', role: 'siswa', nisn: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus pengguna ini? Semua data presensi dan jurnalnya mungkin akan ikut terhapus atau menyebabkan error.')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus pengguna.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Kelola Data Pengguna
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manajemen akun siswa, guru pembimbing, dan admin.
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 items-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" /> 
            Tambah Pengguna
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4" role="alert">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nama Lengkap</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">NISN</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase border border-blue-100">
                        {user.name.charAt(0)}
                      </div>
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize
                        ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' : 
                          user.role === 'guru_pembimbing' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-green-50 text-green-700 ring-green-600/20'}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.nisn || '-'}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        title="Hapus Pengguna"
                        aria-label={`Hapus pengguna ${user.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Tambah User */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-[100] p-4 sm:p-0 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">Tambah Pengguna Baru</h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateUser} className="px-4 py-5 sm:p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Nama Lengkap</label>
                <div className="mt-2">
                  <input id="name" type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
                <div className="mt-2">
                  <input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">Password</label>
                <div className="mt-2">
                  <input id="password" type="password" required minLength="6" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900">Role</label>
                  <div className="mt-2">
                    <select id="role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6">
                      <option value="siswa">Siswa</option>
                      <option value="guru_pembimbing">Guru Pembimbing</option>
                      <option value="admin">Admin / TU</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="nisn" className="block text-sm font-medium leading-6 text-gray-900">NISN (Siswa)</label>
                  <div className="mt-2">
                    <input id="nisn" type="text" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} placeholder="Opsional" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 mt-5 -mx-4 -mb-5 sm:-mx-6 sm:-mb-6 rounded-b-lg border-t border-gray-200">
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

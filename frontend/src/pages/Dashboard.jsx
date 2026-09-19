import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Users, CheckCircle, MapPin, BookOpen, Settings, FileText } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import LiveTrackerToggle from '../components/LiveTrackerToggle';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalSiswa: 0,
    hadirHariIni: 0,
    totalLokasi: 0,
    jurnalMenunggu: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (parsedUser.role === 'admin' || parsedUser.role === 'guru_pembimbing') {
        fetchStats();
      }
    }
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats');
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (socket && (user?.role === 'admin' || user?.role === 'guru_pembimbing')) {
      socket.on('dashboard_update', fetchStats);
      return () => {
        socket.off('dashboard_update', fetchStats);
      };
    }
  }, [socket, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Halo, {user.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Selamat datang di dashboard {user.role.replace('_', ' ')}. Pilih menu navigasi untuk memulai aktivitas Anda hari ini.
          </p>
        </div>

        {(user.role === 'siswa' || user.role === 'guru_pembimbing') && (
          <LiveTrackerToggle user={user} />
        )}
        
        {(user.role === 'admin' || user.role === 'guru_pembimbing') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white px-4 py-5 border border-gray-200 rounded-lg shadow-sm sm:p-6 flex items-center">
              <div className="flex-shrink-0 bg-blue-50 rounded-md p-3">
                <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Siswa</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.totalSiswa}</div>
                </dd>
              </div>
            </div>
            <div className="bg-white px-4 py-5 border border-gray-200 rounded-lg shadow-sm sm:p-6 flex items-center">
              <div className="flex-shrink-0 bg-green-50 rounded-md p-3">
                <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Hadir Hari Ini</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.hadirHariIni}</div>
                </dd>
              </div>
            </div>
            <div className="bg-white px-4 py-5 border border-gray-200 rounded-lg shadow-sm sm:p-6 flex items-center">
              <div className="flex-shrink-0 bg-purple-50 rounded-md p-3">
                <MapPin className="h-6 w-6 text-purple-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Titik Lokasi</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.totalLokasi}</div>
                </dd>
              </div>
            </div>
            <div className="bg-white px-4 py-5 border border-gray-200 rounded-lg shadow-sm sm:p-6 flex items-center">
              <div className="flex-shrink-0 bg-yellow-50 rounded-md p-3">
                <BookOpen className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Jurnal Menunggu</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.jurnalMenunggu}</div>
                </dd>
              </div>
            </div>
          </div>
        )}

        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Menu Utama</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* MENU ADMIN */}
          {user.role === 'admin' && (
            <>
              <button 
                onClick={() => navigate('/admin/users')} 
                className="relative group bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all text-left flex items-start gap-4"
              >
                <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                  <Users className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Kelola Data Pengguna</h4>
                  <p className="mt-1 text-sm text-gray-500">Pendaftaran akun siswa dan guru pembimbing.</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/admin/attendance')} 
                className="relative group bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all text-left flex items-start gap-4"
              >
                <div className="p-2 bg-indigo-50 rounded-md text-indigo-600">
                  <FileText className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Laporan Absensi</h4>
                  <p className="mt-1 text-sm text-gray-500">Pantau kehadiran seluruh siswa yang sedang magang.</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/admin/locations')} 
                className="relative group bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all text-left flex items-start gap-4"
              >
                <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
                  <MapPin className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Master Lokasi</h4>
                  <p className="mt-1 text-sm text-gray-500">Atur titik geofencing untuk lokasi presensi sekolah.</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/live-tracking')} 
                className="relative group bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:border-purple-500 hover:ring-1 hover:ring-purple-500 transition-all text-left flex items-start gap-4"
              >
                <div className="p-2 bg-purple-50 rounded-md text-purple-600">
                  <MapPin className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Peta Live Tracking</h4>
                  <p className="mt-1 text-sm text-gray-500">Lihat pergerakan lokasi guru dan siswa secara real-time.</p>
                </div>
              </button>
            </>
          )}

          {/* MENU GURU PEMBIMBING DAN SISWA */}
          {(user.role === 'guru_pembimbing' || user.role === 'siswa') && (
            <>
              <button 
                onClick={() => navigate('/attendance')} 
                className="relative group bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all text-left flex items-start gap-4"
              >
                <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                  <MapPin className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Presensi</h4>
                  <p className="mt-1 text-sm text-gray-500">Catat kehadiran harian Anda menggunakan lokasi GPS.</p>
                </div>
              </button>
              
              {user.role === 'siswa' && (
                <button 
                  onClick={() => navigate('/journal')} 
                  className="relative group bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all text-left flex items-start gap-4"
                >
                  <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
                    <FileText className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Jurnal Harian</h4>
                    <p className="mt-1 text-sm text-gray-500">Isi laporan aktivitas magang Anda setiap hari.</p>
                  </div>
                </button>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;

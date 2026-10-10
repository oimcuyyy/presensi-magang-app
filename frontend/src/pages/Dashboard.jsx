import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  MapPin,
  BookOpen,
  FileSpreadsheet,
  CreditCard,
  ScanLine,
  Radio,
  ArrowUpRight,
  ShieldCheck,
  Building,
  School,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
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
      setStats(response.data.data || { totalSiswa: 0, hadirHariIni: 0, totalLokasi: 0, jurnalMenunggu: 0 });
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-800">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Institutional Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                SMK Negeri 20 Jakarta
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-600 font-semibold">Tahun Ajaran 2026/2027</span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Selamat datang, {user.name}
            </h1>

            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              {user.role === 'siswa' ? (
                <>
                  Siswa Praktik Kerja Lapangan (PKL) terdaftar di{' '}
                  <strong className="text-slate-900">{user.nama_instansi || 'Unit Industri Mitra'}</strong>.
                  Pastikan melakukan presensi harian tepat waktu.
                </>
              ) : (
                'Panel pemantauan presensi, live telemetri geolokasi, dan validasi jurnal harian siswa magang.'
              )}
            </p>
          </div>

          {/* Quick Action Trigger */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user.role === 'siswa' && (
              <button
                onClick={() => navigate('/card')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Kartu Barcode Siswa
              </button>
            )}
            {(user.role === 'admin' || user.role === 'guru_pembimbing') && (
              <button
                onClick={() => navigate('/scan')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <ScanLine className="w-4 h-4 text-emerald-400" />
                Buka Pemindai Barcode
              </button>
            )}
          </div>
        </div>

        {/* Live Location Telemetry Widget for Student & Teacher */}
        {(user.role === 'siswa' || user.role === 'guru_pembimbing') && (
          <LiveTrackerToggle user={user} />
        )}

        {/* High-Density Admin/Teacher Metrics Row */}
        {(user.role === 'admin' || user.role === 'guru_pembimbing') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Siswa PKL</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {stats.totalSiswa}
              </p>
              <p className="text-[11px] text-slate-500">Terdaftar aktif</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Hadir Hari Ini</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono tracking-tight">
                {stats.hadirHariIni}
              </p>
              <p className="text-[11px] text-slate-500">Presensi masuk terverifikasi</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Titik Geofence</span>
                <MapPin className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {stats.totalLokasi}
              </p>
              <p className="text-[11px] text-slate-500">Sekolah & industri mitra</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Jurnal Menunggu</span>
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-amber-600 font-mono tracking-tight">
                {stats.jurnalMenunggu}
              </p>
              <p className="text-[11px] text-slate-500">Perlu review guru</p>
            </div>
          </div>
        )}

        {/* Operational Modules Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Modul Operasional
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Siswa Features */}
            {user.role === 'siswa' && (
              <>
                <button
                  onClick={() => navigate('/attendance')}
                  className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Presensi Mandiri GPS
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Lakukan check-in dan check-out dengan validasi jarak geofence dan bukti foto selfie.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/card')}
                  className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      Kartu Pelajar & Barcode
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Tunjukkan kartu digital bertanda tangan kriptografi untuk dipindai oleh petugas pos sekolah.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/journal')}
                  className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Jurnal Kegiatan PKL
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Laporkan aktivitas kerja harian dan baca umpan balik tertulis dari guru pembimbing.
                    </p>
                  </div>
                </button>
              </>
            )}

            {/* Admin & Guru Features */}
            {(user.role === 'admin' || user.role === 'guru_pembimbing') && (
              <>
                <button
                  onClick={() => navigate('/scan')}
                  className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <ScanLine className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Pemindai Absensi Siswa
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pindai QR code kartu siswa dengan kamera atau input barcode gun USB pada gerbang sekolah.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/live-tracking')}
                  className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                      <Radio className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Peta Telemetri GPS Siswa
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pantau posisi dan radius toleransi akurasi GPS siswa yang sedang berada di lokasi magang.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/attendance')}
                  className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Rekap & Validasi Presensi
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Audit bukti foto selfie di lokasi, cek koordinat satelit, dan ekspor data ke format CSV.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/journal')}
                  className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      Review & Umpan Balik Jurnal
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Evaluasi laporan teknis harian siswa dan kirimkan bimbingan evaluasi tertulis.
                    </p>
                  </div>
                </button>
              </>
            )}

            {/* Admin Master Data Modules */}
            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-800 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      <Users className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 transition-colors">
                      Manajemen Pengguna
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pendaftaran akun siswa PKL, guru pembimbing, dan penetapan hak otorisasi role.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/locations')}
                  className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-800 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 transition-colors">
                      Master Lokasi Geofence
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Konfigurasi titik lintang/bujur dan batas radius presensi sekolah serta instansi mitra.
                    </p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

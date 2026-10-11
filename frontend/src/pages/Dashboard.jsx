import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  MapPin,
  BookOpen,
  CreditCard,
  ScanLine,
  Clock,
  ArrowRight,
  AlertCircle,
  Calendar,
  Building,
  Check
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import LiveTrackerToggle from '../components/LiveTrackerToggle';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalSiswa: 0,
    hadirHariIni: 0,
    totalLokasi: 0,
    jurnalMenunggu: 0
  });

  // Data khusus siswa
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [todayJournal, setTodayJournal] = useState(null);
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [isLoadingSiswa, setIsLoadingSiswa] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (parsedUser.role === 'admin' || parsedUser.role === 'guru_pembimbing') {
        fetchAdminStats();
      } else if (parsedUser.role === 'siswa') {
        fetchSiswaDashboard();
      }
    }
  }, [navigate]);

  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        if (user?.role === 'siswa') {
          fetchSiswaDashboard();
        } else {
          fetchAdminStats();
        }
      };
      socket.on('dashboard_update', handleUpdate);
      return () => {
        socket.off('dashboard_update', handleUpdate);
      };
    }
  }, [socket, user]);

  const fetchAdminStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data || { totalSiswa: 0, hadirHariIni: 0, totalLokasi: 0, jurnalMenunggu: 0 });
    } catch (e) {
      console.error('Gagal memuat statistik dashboard');
    }
  };

  const fetchSiswaDashboard = async () => {
    setIsLoadingSiswa(true);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // 1. Ambil riwayat presensi siswa
      const attRes = await api.get('/attendances/history');
      const attList = attRes.data?.data || [];
      setRecentAttendances(attList.slice(0, 5));

      const todayAtt = attList.find(a => a.date && a.date.startsWith(todayStr));
      setTodayAttendance(todayAtt || null);

      // 2. Ambil status jurnal siswa
      const jrnRes = await api.get('/journals');
      const jrnList = jrnRes.data?.data || [];
      const todayJrn = jrnList.find(j => j.date && j.date.startsWith(todayStr));
      setTodayJournal(todayJrn || null);
    } catch (e) {
      console.error('Gagal memuat data siswa');
    } finally {
      setIsLoadingSiswa(false);
    }
  };

  if (!user) return null;

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ─── Sapaan Singkat Bersih (Sesuai Aturan: 1 Baris) ─────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Halo, {user.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {formattedDate} • <span className="font-mono text-slate-700 font-semibold">{formattedTime} WIB</span>
          </p>
        </div>

        {user.role === 'siswa' && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={CreditCard}
              onClick={() => navigate('/id-card')}
            >
              Kartu Siswa
            </Button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ─── DASHBOARD SISWA (Mobile-First Focus) ───────────────── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {user.role === 'siswa' && (
        <div className="space-y-5">
          {/* KARTU UTAMA 1: STATUS PRESENSI HARI INI */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Status Absen Hari Ini
                </span>

                {todayAttendance ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge status={todayAttendance.status === 'terlambat' ? 'terlambat' : 'hadir'}>
                      {todayAttendance.status === 'terlambat' ? 'Terlambat Masuk' : 'Hadir Tepat Waktu'}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      Pukul {todayAttendance.check_in_time} WIB
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge status="ditolak">Belum Absen Masuk</Badge>
                    <span className="text-xs text-slate-500">
                      Batas masuk: <strong className="text-slate-800 font-mono">08:00 WIB</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Status Tempat PKL Nyata */}
              <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                <Building className="w-4 h-4 text-[#0c2340] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold leading-none">Lokasi PKL</p>
                  <p className="font-bold text-slate-900 truncate mt-0.5">
                    {user.nama_instansi || 'Belum diisi (Lengkapi di profil)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Cepat Jempol (Thumb Size) */}
            <div className="pt-5">
              {!todayAttendance ? (
                <Button
                  variant="primary"
                  size="thumb"
                  onClick={() => navigate('/attendance')}
                  className="bg-[#0c2340] hover:bg-[#132e58] text-white shadow-md text-base"
                >
                  Absen Masuk Sekarang
                </Button>
              ) : !todayAttendance.check_out_time ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <span>Sudah absen masuk jam <strong>{todayAttendance.check_in_time}</strong></span>
                    <span className="font-semibold text-emerald-900">Aktif</span>
                  </div>
                  <Button
                    variant="accent"
                    size="thumb"
                    onClick={() => navigate('/attendance')}
                    className="bg-[#d97706] hover:bg-[#b45309] text-white shadow-md text-base"
                  >
                    Absen Pulang Sekarang
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <div className="inline-flex p-2 bg-emerald-100 text-emerald-700 rounded-full mb-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Kehadiran Hari Ini Selesai</p>
                  <p className="text-xs text-slate-500 font-mono">
                    Masuk: {todayAttendance.check_in_time} • Pulang: {todayAttendance.check_out_time}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* KARTU 2: STATUS JURNAL HARI INI */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${todayJournal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Jurnal Kegiatan Hari Ini
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {todayJournal
                    ? `Sudah diisi: "${todayJournal.activity?.substring(0, 45)}..."`
                    : 'Belum mengisi catatan pekerjaan hari ini. Wajib diisi setiap hari magang.'}
                </p>
              </div>
            </div>

            <Button
              variant={todayJournal ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => navigate('/journal')}
              className="shrink-0"
            >
              {todayJournal ? 'Lihat Jurnal' : 'Tulis Jurnal Hari Ini'}
            </Button>
          </div>

          {/* KARTU 3: BAGIKAN LOKASI KE GURU (Privasi Bersih) */}
          <LiveTrackerToggle user={user} />

          {/* KARTU 4: RIWAYAT 5 HARI TERAKHIR (Strip Kalender Mini) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Riwayat 5 Hari Terakhir
              </h2>
              <button
                type="button"
                onClick={() => navigate('/attendance')}
                className="text-xs font-semibold text-[#0c2340] hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            {recentAttendances.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada rekaman absen.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAttendances.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 font-mono font-bold text-slate-700 flex flex-col items-center justify-center text-[10px] shrink-0 leading-none">
                        <span>{item.date ? new Date(item.date).getDate() : '-'}</span>
                        <span className="text-[8px] text-slate-400">
                          {item.date ? new Date(item.date).toLocaleDateString('id-ID', { month: 'short' }) : ''}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {item.location_name || 'Lokasi Magang'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {item.check_in_time} {item.check_out_time ? `- ${item.check_out_time}` : ''}
                        </p>
                      </div>
                    </div>

                    <Badge size="sm" status={item.status === 'terlambat' ? 'terlambat' : item.status === 'izin' ? 'izin' : 'hadir'}>
                      {item.status === 'terlambat' ? 'Terlambat' : item.status === 'izin' ? 'Izin' : 'Tepat Waktu'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ─── DASHBOARD GURU PEMBIMBING ──────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {user.role === 'guru_pembimbing' && (
        <div className="space-y-6">
          {/* Ringkasan Metrik Guru */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Siswa Binaan
              </span>
              <p className="text-3xl font-extrabold text-slate-900 font-mono">
                {stats.totalSiswa}
              </p>
              <p className="text-xs text-slate-500">Siswa aktif magang</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Hadir Hari Ini
              </span>
              <p className="text-3xl font-extrabold text-emerald-700 font-mono">
                {stats.hadirHariIni}
              </p>
              <p className="text-xs text-emerald-700 font-medium">Tercatat masuk</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1 col-span-2 md:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Jurnal Perlu Review
              </span>
              <p className="text-3xl font-extrabold text-amber-600 font-mono">
                {stats.jurnalMenunggu}
              </p>
              <p className="text-xs text-amber-700 font-medium">Menunggu evaluasi</p>
            </div>
          </div>

          {/* Modul Aksi Cepat Guru */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Review Jurnal Siswa</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Beri bimbingan dan tanggapan tertulis pada kegiatan harian siswa.
                </p>
              </div>
              <Button
                variant="accent"
                size="sm"
                onClick={() => navigate('/journal')}
                className="w-full"
              >
                Buka Jurnal ({stats.jurnalMenunggu})
              </Button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Peta Siswa PKL</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pantau posisi real-time siswa binaan yang sedang berbagi lokasi di tempat magang.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/live-tracking')}
                className="w-full"
              >
                Buka Peta Siswa
              </Button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center mb-3">
                  <ScanLine className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Scan Kartu Siswa</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pindai QR atau Barcode kartu pelajar siswa saat monitoring kunjungan lapangan.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/scan')}
                className="w-full"
              >
                Buka Scanner
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ─── DASHBOARD ADMINISTRATOR TU ─────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {user.role === 'admin' && (
        <div className="space-y-6">
          {/* Metrik Operasional Admin (4 Kolom Teratur) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Siswa
              </span>
              <p className="text-3xl font-extrabold text-slate-900 font-mono">
                {stats.totalSiswa}
              </p>
              <p className="text-xs text-slate-500">Terdaftar di sistem</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Hadir Hari Ini
              </span>
              <p className="text-3xl font-extrabold text-emerald-700 font-mono">
                {stats.hadirHariIni}
              </p>
              <p className="text-xs text-emerald-700 font-medium">Presensi terverifikasi</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lokasi PKL
              </span>
              <p className="text-3xl font-extrabold text-slate-900 font-mono">
                {stats.totalLokasi}
              </p>
              <p className="text-xs text-slate-500">Titik geofence aktif</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Jurnal Belum Direview
              </span>
              <p className="text-3xl font-extrabold text-amber-600 font-mono">
                {stats.jurnalMenunggu}
              </p>
              <p className="text-xs text-amber-700 font-medium">Menunggu guru</p>
            </div>
          </div>

          {/* Menu Akses Cepat Operasional */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Aksi Operasional Cepat
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => navigate('/scan')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#0c2340] hover:text-white transition-all text-left group"
              >
                <ScanLine className="w-5 h-5 text-[#0c2340] group-hover:text-amber-400 mb-2" />
                <p className="text-xs font-bold leading-tight">Scan Kartu</p>
                <p className="text-[11px] text-slate-500 group-hover:text-slate-300 mt-0.5">Pemindai di pos</p>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/attendance')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#0c2340] hover:text-white transition-all text-left group"
              >
                <Calendar className="w-5 h-5 text-[#0c2340] group-hover:text-amber-400 mb-2" />
                <p className="text-xs font-bold leading-tight">Rekap Absen</p>
                <p className="text-[11px] text-slate-500 group-hover:text-slate-300 mt-0.5">Cek bukti & ekspor</p>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#0c2340] hover:text-white transition-all text-left group"
              >
                <Users className="w-5 h-5 text-[#0c2340] group-hover:text-amber-400 mb-2" />
                <p className="text-xs font-bold leading-tight">Pengguna</p>
                <p className="text-[11px] text-slate-500 group-hover:text-slate-300 mt-0.5">Kelola siswa & guru</p>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/locations')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#0c2340] hover:text-white transition-all text-left group"
              >
                <MapPin className="w-5 h-5 text-[#0c2340] group-hover:text-amber-400 mb-2" />
                <p className="text-xs font-bold leading-tight">Lokasi PKL</p>
                <p className="text-[11px] text-slate-500 group-hover:text-slate-300 mt-0.5">Atur titik geofence</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

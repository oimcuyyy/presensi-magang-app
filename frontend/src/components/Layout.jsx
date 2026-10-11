import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  MapPin,
  LogOut,
  User,
  Menu,
  X,
  Radio,
  CreditCard,
  ScanLine,
  BookOpen,
  Wifi,
  WifiOff
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import BottomNav from './common/BottomNav';
import { useSocket } from '../context/SocketContext';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { connectionStatus } = useSocket() || {};

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const isSiswa = user.role === 'siswa';

  // Daftar menu yang konsisten sesuai Glosarium Resmi
  const getNavLinks = () => {
    const links = [
      { path: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
    ];

    if (user.role === 'admin') {
      links.push({ path: '/scan', label: 'Scan Kartu', icon: ScanLine });
      links.push({ path: '/admin/attendance', label: 'Rekap Absen', icon: FileSpreadsheet });
      links.push({ path: '/live-tracking', label: 'Peta Siswa', icon: Radio });
      links.push({ path: '/journal', label: 'Jurnal Siswa', icon: BookOpen });
      links.push({ path: '/admin/locations', label: 'Lokasi PKL', icon: MapPin });
      links.push({ path: '/admin/users', label: 'Pengguna', icon: Users });
      links.push({ path: '/profile', label: 'Profil', icon: User });
    } else if (user.role === 'guru_pembimbing') {
      links.push({ path: '/scan', label: 'Scan Kartu', icon: ScanLine });
      links.push({ path: '/attendance', label: 'Absen Mandiri', icon: MapPin });
      links.push({ path: '/live-tracking', label: 'Peta Siswa', icon: Radio });
      links.push({ path: '/journal', label: 'Jurnal Siswa', icon: BookOpen });
      links.push({ path: '/profile', label: 'Profil', icon: User });
    } else if (isSiswa) {
      links.push({ path: '/attendance', label: 'Absen', icon: MapPin });
      links.push({ path: '/id-card', label: 'Kartu Siswa', icon: CreditCard });
      links.push({ path: '/journal', label: 'Jurnal', icon: BookOpen });
      links.push({ path: '/profile', label: 'Profil', icon: User });
    }

    return links;
  };

  const navLinks = getNavLinks();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin TU', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'guru_pembimbing':
        return { label: 'Guru Pembimbing', bg: 'bg-amber-50 text-amber-900 border-amber-200' };
      default:
        return { label: 'Siswa PKL', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
  };

  const badge = getRoleBadge(user.role);

  // Cari judul halaman aktif untuk Topbar context
  const activeLink = navLinks.find(link => link.path === location.pathname);
  const pageTitle = activeLink ? activeLink.label : 'Beranda';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased">
      {/* ─── Desktop Sidebar ────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0c2340] text-white min-h-screen fixed top-0 left-0 bottom-0 z-40 border-r border-[#132e58] shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <BrandLogo variant="compact" theme="dark" markSize={34} />
        </div>

        {/* Profil Mini Pengguna */}
        <div className="p-3 mx-3 mt-3 mb-1 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5 ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigasi Utama (Tanpa chevron redundant) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-[#0c2340] shadow-sm font-bold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Header (Khusus Guru / Admin yang butuh drawer) ─ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#0c2340] text-white h-14 flex items-center justify-between px-4 border-b border-white/10">
        <BrandLogo variant="compact" theme="dark" markSize={28} />
        {!isSiswa && (
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            aria-label={isMobileDrawerOpen ? 'Tutup navigasi' : 'Buka navigasi'}
            className="p-1.5 rounded-lg bg-white/10 text-white border border-white/15 active:scale-95 transition-transform"
          >
            {isMobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </header>

      {/* ─── Mobile Drawer Slide-in (Untuk Guru/Admin) ─────────────── */}
      {!isSiswa && isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fadeIn">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[80vw] bg-[#0c2340] text-white h-full flex flex-col p-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <BrandLogo variant="compact" theme="dark" markSize={28} />
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Tutup navigasi"
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 my-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5 ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
            </div>

            <nav className="space-y-1 flex-1 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-white text-[#0c2340] font-bold' : 'text-slate-200 hover:bg-white/10'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-red-300 bg-red-500/10"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Pane ───────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Desktop Topbar: Context "Aku di mana" + Connection Indicator */}
        <header className="hidden md:flex h-14 bg-white border-b border-slate-200/80 px-6 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">{pageTitle}</span>
            <span>•</span>
            <span>SMK Negeri 20 Jakarta</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Koneksi Realtime */}
            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Wifi className="w-3 h-3 text-emerald-600" /> Realtime
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                <WifiOff className="w-3 h-3 text-slate-500" /> Mode Berkala
              </span>
            )}

            <div className="h-4 w-px bg-slate-200" />

            <div className="text-xs font-semibold text-slate-700">
              Halo, <span className="text-[#0c2340] font-bold">{user.name.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto ${isSiswa ? 'pt-18 md:pt-6 pb-24 md:pb-8' : 'pt-18 md:pt-6 pb-8'}`}>
          <Outlet />
        </main>

        {/* Bottom Navigation Khusus Siswa di Layar HP */}
        {isSiswa && <BottomNav />}
      </div>
    </div>
  );
};

export default Layout;

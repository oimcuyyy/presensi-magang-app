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
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import BrandLogo from './BrandLogo';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const getNavLinks = () => {
    const links = [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ];

    if (user.role === 'admin') {
      links.push({ path: '/scan', label: 'Pemindai Absensi', icon: <ScanLine className="w-4 h-4" /> });
      links.push({ path: '/admin/attendance', label: 'Rekap Presensi', icon: <FileSpreadsheet className="w-4 h-4" /> });
      links.push({ path: '/live-tracking', label: 'Peta Telemetri GPS', icon: <Radio className="w-4 h-4" /> });
      links.push({ path: '/journal', label: 'Jurnal Kegiatan', icon: <BookOpen className="w-4 h-4" /> });
      links.push({ path: '/admin/locations', label: 'Master Lokasi PKL', icon: <MapPin className="w-4 h-4" /> });
      links.push({ path: '/admin/users', label: 'Kelola Pengguna', icon: <Users className="w-4 h-4" /> });
      links.push({ path: '/profile', label: 'Pengaturan Akun', icon: <User className="w-4 h-4" /> });
    } else if (user.role === 'guru_pembimbing') {
      links.push({ path: '/scan', label: 'Pemindai Absensi', icon: <ScanLine className="w-4 h-4" /> });
      links.push({ path: '/attendance', label: 'Presensi Mandiri', icon: <MapPin className="w-4 h-4" /> });
      links.push({ path: '/live-tracking', label: 'Peta Siswa PKL', icon: <Radio className="w-4 h-4" /> });
      links.push({ path: '/journal', label: 'Review Jurnal Siswa', icon: <BookOpen className="w-4 h-4" /> });
      links.push({ path: '/profile', label: 'Pengaturan Akun', icon: <User className="w-4 h-4" /> });
    } else if (user.role === 'siswa') {
      links.push({ path: '/attendance', label: 'Presensi Mandiri GPS', icon: <MapPin className="w-4 h-4" /> });
      links.push({ path: '/card', label: 'Kartu Pelajar & Barcode', icon: <CreditCard className="w-4 h-4" /> });
      links.push({ path: '/journal', label: 'Jurnal Harian PKL', icon: <BookOpen className="w-4 h-4" /> });
      links.push({ path: '/profile', label: 'Profil Siswa', icon: <User className="w-4 h-4" /> });
    }

    return links;
  };

  const navLinks = getNavLinks();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'guru_pembimbing':
        return { label: 'Guru Pembimbing', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      default:
        return { label: 'Siswa PKL', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-slate-200 min-h-screen fixed top-0 left-0 bottom-0 z-40 border-r border-slate-800/80">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-850">
          <BrandLogo variant="compact" theme="dark" markSize={32} />
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3 mt-3 mb-1 rounded-xl bg-slate-900 border border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-700/80">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border mt-0.5 ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Menu Navigasi
          </p>
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                {link.icon}
                <span>{link.label}</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-30" />
            </NavLink>
          ))}
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-850">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-950 text-white fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <BrandLogo variant="compact" theme="dark" markSize={28} />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          className="p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] bg-slate-950 z-40 flex flex-col p-4 border-t border-slate-800 overflow-y-auto">
          <div className="p-3 mb-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{user.name}</p>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5 ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                    isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`
                }
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-850 mt-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-semibold text-red-400 bg-red-950/20"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

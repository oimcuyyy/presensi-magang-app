import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, MapPin, LogOut, User, Menu, X, ShieldCheck, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';

const Layout = () => {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  // Mendefinisikan menu berdasarkan role
  const getNavLinks = () => {
    const links = [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    ];

    if (user.role === 'admin') {
      links.push({ path: '/admin/users', label: 'Kelola Pengguna', icon: <Users className="w-5 h-5" /> });
      links.push({ path: '/admin/attendance', label: 'Laporan Absensi', icon: <FileText className="w-5 h-5" /> });
      links.push({ path: '/admin/locations', label: 'Master Lokasi', icon: <MapPin className="w-5 h-5" /> });
      links.push({ path: '/live-tracking', label: 'Live Map', icon: <Navigation className="w-5 h-5" /> });
    } else if (user.role === 'guru_pembimbing') {
      links.push({ path: '/attendance', label: 'Presensi', icon: <MapPin className="w-5 h-5" /> });
      links.push({ path: '/live-tracking', label: 'Live Map', icon: <Navigation className="w-5 h-5" /> });
    } else if (user.role === 'siswa') {
      links.push({ path: '/attendance', label: 'Presensi', icon: <MapPin className="w-5 h-5" /> });
      links.push({ path: '/journal', label: 'Jurnal Harian', icon: <FileText className="w-5 h-5" /> });
      links.push({ path: '/profile', label: 'Profil Saya', icon: <User className="w-5 h-5" /> });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white min-h-screen fixed top-0 left-0 bottom-0 shadow-xl z-40">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              {user.role === 'admin' ? (
                 <ShieldCheck className="w-5 h-5 text-white" />
              ) : (
                 <span className="text-white font-bold text-sm">P</span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight">Presensi<span className={user.role === 'admin' ? "text-gray-400" : "text-blue-500"}>{user.role === 'admin' ? "Admin" : "Magang"}</span></h1>
          </div>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3 px-2">
            <div className="bg-gray-800 p-2 rounded-full">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold truncate max-w-[150px]">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Navbar Mobile */}
      <div className="md:hidden bg-gray-900 text-white fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            {user.role === 'admin' ? (
                <ShieldCheck className="w-5 h-5 text-white" />
            ) : (
                <span className="text-white font-bold text-sm">P</span>
            )}
          </div>
          <h1 className="text-lg font-bold">Presensi<span className={user.role === 'admin' ? "text-gray-400" : "text-blue-500"}>{user.role === 'admin' ? "Admin" : "Magang"}</span></h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-800 rounded text-gray-300">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-gray-900 text-white shadow-xl z-40 border-t border-gray-800 flex flex-col max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 flex items-center gap-3 border-b border-gray-800">
            <div className="bg-gray-800 p-2 rounded-full">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="p-3 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`
                }
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="p-4 border-t border-gray-800 mt-auto">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" /> Keluar
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

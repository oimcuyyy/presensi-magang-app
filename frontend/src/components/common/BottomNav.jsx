import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarCheck, BookOpen, CreditCard, User } from 'lucide-react';

/**
 * BottomNav - Navigasi bawah khusus siswa di layar mobile (< 768px)
 * Menempatkan tombol "Absen" menonjol di tengah, ramah jangkauan jempol,
 * dan mendukung safe-area-inset-bottom pada perangkat mobile.
 */
const BottomNav = () => {
  const navItems = [
    { to: '/dashboard', label: 'Beranda', icon: Home },
    { to: '/journal', label: 'Jurnal', icon: BookOpen },
    { to: '/attendance', label: 'Absen', icon: CalendarCheck, isPrimary: true },
    { to: '/id-card', label: 'Kartu', icon: CreditCard },
    { to: '/profile', label: 'Profil', icon: User }
  ];

  return (
    <nav
      aria-label="Navigasi bawah siswa"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  relative flex flex-col items-center justify-center -top-3 group
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className={`
                      w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95
                      ${isActive
                        ? 'bg-[#d97706] text-white ring-4 ring-[#d97706]/20'
                        : 'bg-[#0c2340] text-white ring-4 ring-white hover:bg-[#132e58]'}
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-[#d97706]' : 'text-slate-700'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center h-full py-1 text-center transition-colors active:scale-95
                ${isActive ? 'text-[#0c2340] font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'}
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[10px] mt-1 tracking-tight leading-none">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#0c2340] mt-1" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

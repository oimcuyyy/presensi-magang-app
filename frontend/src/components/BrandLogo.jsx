import React from 'react';
import logoImg from '../assets/logo-smkn20.png';

/**
 * BrandLogo - Lambang Resmi SMK NEGERI 20 JAKARTA
 * Didesain presisi, rapi, proporsional, dan zero emoji.
 */
export const BrandMark = ({ size = 38, className = '' }) => (
  <img
    src={logoImg}
    alt="SMK Negeri 20 Jakarta"
    className={`shrink-0 object-contain drop-shadow-sm select-none ${className}`}
    style={{ height: `${size}px`, width: 'auto' }}
  />
);

const BrandLogo = ({
  variant = 'full', // 'full' | 'compact' | 'icon'
  theme = 'dark',   // 'dark' | 'light'
  className = '',
  markSize = 38
}) => {
  const isDark = theme === 'dark';

  if (variant === 'icon') {
    return <BrandMark size={markSize} className={className} />;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Transparent Emblem */}
      <div className="shrink-0 flex items-center justify-center">
        <BrandMark size={markSize} />
      </div>

      {/* Structured Clean Typography (No Wrapping Glitches) */}
      <div className="flex flex-col min-w-0 justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`text-[14px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
            SMKN 20
          </span>
          <span className="text-[14px] font-black tracking-tight text-amber-400">
            JAKARTA
          </span>
        </div>

        <div className="flex items-center gap-1 mt-1.5 leading-none">
          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
            PRESENSI & PKL
          </span>
        </div>

        {variant === 'full' && (
          <span className={`text-[10px] font-medium tracking-normal mt-1.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Dinas Pendidikan DKI Jakarta
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button - Komponen tombol terstandarisasi SMKN 20 Jakarta
 * Memiliki state lengkap: default, hover, active (scale 0.98), disabled, dan loading.
 * Memenuhi minimum target sentuh 44-52px di perangkat mobile.
 */
const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline'
  size = 'md',        // 'sm' | 'md' | 'lg' | 'thumb'
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-base px-5 py-3 gap-2.5 min-h-[48px]',
    thumb: 'text-base px-6 py-4 gap-3 min-h-[54px] w-full shadow-lg rounded-2xl font-bold tracking-wide' // Khusus tombol utama presensi di HP
  };

  const variantStyles = {
    primary: 'bg-[#0c2340] hover:bg-[#132e58] text-white shadow-sm focus-visible:outline-[#0c2340] disabled:bg-slate-200 disabled:text-slate-400',
    secondary: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm focus-visible:outline-slate-400 disabled:bg-slate-100 disabled:text-slate-400',
    accent: 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-sm focus-visible:outline-[#d97706] disabled:bg-amber-200 disabled:text-amber-700/60',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus-visible:outline-red-600 disabled:bg-red-200 disabled:text-red-400',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus-visible:outline-slate-400 disabled:text-slate-300',
    outline: 'bg-transparent hover:bg-[#0c2340]/5 text-[#0c2340] border border-[#0c2340]/25 focus-visible:outline-[#0c2340] disabled:border-slate-200 disabled:text-slate-400'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />}
          {children}
          {RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;

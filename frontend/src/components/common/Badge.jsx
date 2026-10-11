import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, FileText, HelpCircle } from 'lucide-react';

/**
 * Badge - Label status semantik SMKN 20 Jakarta
 * Wajib memadukan Ikon + Teks (bukan warna saja), dengan kontras tinggi sesuai WCAG AA.
 */
const Badge = ({
  status = 'default', // 'hadir' | 'terlambat' | 'ditolak' | 'izin' | 'menunggu' | 'default'
  children,
  className = '',
  size = 'md' // 'sm' | 'md'
}) => {
  const configs = {
    hadir: {
      label: 'Hadir Tepat Waktu',
      icon: CheckCircle2,
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    terlambat: {
      label: 'Terlambat',
      icon: Clock,
      style: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    ditolak: {
      label: 'Di Luar Radius / Ditolak',
      icon: XCircle,
      style: 'bg-red-50 text-red-800 border-red-200'
    },
    izin: {
      label: 'Izin / Sakit',
      icon: FileText,
      style: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    menunggu: {
      label: 'Menunggu Guru',
      icon: Clock,
      style: 'bg-slate-100 text-slate-800 border-slate-200'
    },
    warning: {
      label: 'Peringatan',
      icon: AlertTriangle,
      style: 'bg-amber-50 text-amber-900 border-amber-300'
    },
    default: {
      label: 'Informasi',
      icon: HelpCircle,
      style: 'bg-slate-50 text-slate-700 border-slate-200'
    }
  };

  const current = configs[status] || configs.default;
  const Icon = current.icon;
  const displayText = children || current.label;

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-semibold rounded-md',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold rounded-lg'
  };

  return (
    <span className={`inline-flex items-center border select-none leading-none ${sizeStyles[size]} ${current.style} ${className}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{displayText}</span>
    </span>
  );
};

export default Badge;

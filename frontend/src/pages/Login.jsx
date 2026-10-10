import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, ShieldCheck, User, Radio, KeyRound, ArrowRight } from 'lucide-react';
import api from '../services/api';
import BrandLogo from '../components/BrandLogo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kendala autentikasi. Pastikan koneksi server aktif.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (targetEmail, targetPass) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError('');
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Left Column: High-End Institutional Brand Section (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 relative border-r border-slate-800/90 bg-slate-950">
        {/* Subtle Architectural Dot Matrix Grid */}
        <div
          className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <BrandLogo variant="full" theme="dark" markSize={36} />
        </div>

        <div className="relative z-10 max-w-lg my-auto space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-amber-400 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              SMK Negeri 20 Jakarta • Portal Resmi PKL
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-snug">
              Presensi Siswa, Monitoring Magang, & Kartu Identitas Digital.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Platform administrasi magang terpadu SMK Negeri 20 Jakarta untuk siswa, guru pembimbing, dan petugas piket sekolah dengan geofencing presisi dan pemindai barcode kartu pelajar.
            </p>
          </div>

          {/* Core Feature Matrix */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-1">
              <p className="font-semibold text-white">Geofence SMKN 20 & DUDI</p>
              <p className="text-[11px] text-slate-400 leading-normal">
                Validasi radius lokasi presensi di kampus SMKN 20 Cilandak dan mitra industri.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-1">
              <p className="font-semibold text-white">Kartu Pelajar Barcode NISN</p>
              <p className="text-[11px] text-slate-400 leading-normal">
                Format CR80 ISO dengan QR Code HMAC dan barcode 1D Code128 untuk pemindaian cepat petugas.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>SMK Negeri 20 Jakarta • Dinas Pendidikan Provinsi DKI Jakarta</span>
          <span className="font-mono text-[11px] text-slate-400">v2.4.0-smkn20</span>
        </div>
      </div>

      {/* Right Column: Clean Institutional Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-16 xl:px-20 relative bg-slate-950">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Brand Header */}
          <div className="lg:hidden mb-8">
            <BrandLogo variant="full" theme="dark" markSize={32} />
          </div>

          <div className="mb-8 space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Masuk ke Portal
            </h2>
            <p className="text-xs text-slate-400">
              Gunakan kredensial akun terdaftar untuk mengakses sistem.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-medium flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk Sekarang
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-slate-900">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Akun Uji Coba Cepat
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@sekolah.com', 'password123')}
                className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 border border-slate-800/90 rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-bold text-white">Admin</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">admin@sekolah.com</p>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('budi@guru.com', 'password123')}
                className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 border border-slate-800/90 rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-bold text-white">Guru</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">budi@guru.com</p>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('andi@siswa.com', 'password123')}
                className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 border border-slate-800/90 rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-white">Siswa</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">andi@siswa.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

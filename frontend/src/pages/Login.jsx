import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import BrandLogo from '../components/BrandLogo';
import Button from '../components/common/Button';

// Flag untuk menampilkan tombol akun demo (mudah dinonaktifkan saat production penuh)
const SHOW_DEMO_ACCOUNTS = true;

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
        setError('Gagal masuk. Pastikan email dan password benar, serta server aktif.');
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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 font-sans text-slate-800">
      {/* Container Login Kartu Terstruktur */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden animate-scaleIn">
        {/* Header Kartu: Navy SMKN 20 */}
        <div className="bg-[#0c2340] px-6 py-8 text-white text-center relative">
          <div className="flex justify-center mb-4">
            <BrandLogo variant="icon" markSize={54} className="drop-shadow-md" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            SMK Negeri 20 Jakarta
          </h1>
          <p className="mt-1 text-xs text-slate-300 font-medium">
            Sistem Presensi & Jurnal PKL Digital
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div
              role="alert"
              className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email Sekolah
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@smkn20.sch.id"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
                rightIcon={ArrowRight}
              >
                Masuk
              </Button>
            </div>
          </form>

          {/* Akun Demo Cepat */}
          {SHOW_DEMO_ACCOUNTS && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
                Akun Demo
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('andi@siswa.com', 'password123')}
                  className="px-2.5 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#0c2340] hover:text-white hover:border-[#0c2340] text-slate-700 transition-all text-center"
                >
                  Siswa
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('budi@guru.com', 'password123')}
                  className="px-2.5 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#0c2340] hover:text-white hover:border-[#0c2340] text-slate-700 transition-all text-center"
                >
                  Guru
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@sekolah.com', 'password123')}
                  className="px-2.5 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#0c2340] hover:text-white hover:border-[#0c2340] text-slate-700 transition-all text-center"
                >
                  Admin
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Identitas */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
          Dinas Pendidikan Provinsi DKI Jakarta
        </div>
      </div>
    </div>
  );
};

export default Login;

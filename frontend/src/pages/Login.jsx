import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan pada server. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left side: Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-tighter">P</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Presensi<span className="text-gray-500 font-medium">Magang</span></h1>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Masuk ke akun Anda
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Selamat datang kembali di sistem presensi harian.
          </p>

          <div className="mt-10">
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                  Email
                </label>
                <div className="mt-2 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6 transition-all"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-label="Loading"></span>
                  ) : (
                    'Masuk Sekarang'
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-12 text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Presensi Magang App. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side: Decorative Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:flex-1 relative w-0 bg-gray-900 items-center justify-center overflow-hidden">
        {/* Subtle background patterns */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>
        
        <div className="relative z-10 max-w-lg px-8 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-gray-700">
            <LogIn className="w-8 h-8 text-gray-300" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl mb-4">
            Mulai hari Anda dengan tepat.
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Catat kehadiran, kelola jurnal harian, dan pantau aktivitas magang Anda dalam satu platform yang terintegrasi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

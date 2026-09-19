import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${backendUrl}/api`, // Gunakan URL dari .env jika ada (untuk produksi), atau gunakan relative (untuk local proxy)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

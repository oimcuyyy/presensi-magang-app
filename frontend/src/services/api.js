import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Menggunakan path relatif agar Vite Proxy meneruskannya ke backend
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

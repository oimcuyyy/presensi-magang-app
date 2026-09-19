import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Plus, Trash2, Crosshair, AlertCircle } from 'lucide-react';
import api from '../services/api';

const AdminLocations = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dalam skenario asli, ini akan tersambung ke backend POST/DELETE /locations
  // Untuk sesi ini, kita buat UI-nya dulu.
  
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data.data);
    } catch (err) {
      console.error('Failed to fetch locations');
      setError('Gagal memuat data lokasi.');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus master data lokasi ini? Jika dihapus, siswa tidak bisa presensi di sini.')) {
      // Dummy logic
      setLocations(locations.filter(l => l.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Master Data Lokasi (Geofencing)
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Atur titik kordinat pusat absensi dan radius toleransi kehadiran.
            </p>
          </div>
          <button 
            className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 opacity-50 cursor-not-allowed items-center gap-2 whitespace-nowrap"
            title="Sistem API untuk menambah lokasi belum diimplementasikan di sesi ini"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> 
            Tambah Lokasi
          </button>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map(loc => (
            <div key={loc.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-gray-300 transition-colors relative overflow-hidden group flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
                <Crosshair className="w-16 h-16 text-gray-900" aria-hidden="true" />
              </div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 text-gray-600 rounded-md border border-gray-200">
                    <MapPin className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{loc.name}</h3>
                </div>
                <button 
                  onClick={() => handleDelete(loc.id)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Hapus lokasi ${loc.name}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              
              <div className="space-y-3 relative z-10 flex-grow">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Latitude</span>
                  <span className="font-mono text-gray-900">{loc.latitude}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Longitude</span>
                  <span className="font-mono text-gray-900">{loc.longitude}</span>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-gray-200 flex justify-between items-center text-sm relative z-10">
                <span className="font-medium text-gray-700">Radius Toleransi</span>
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {loc.radius} Meter
                </span>
              </div>
            </div>
          ))}
          
          <button className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-h-[200px]">
            <Plus className="w-8 h-8 text-gray-400 mb-2" aria-hidden="true" />
            <span className="font-medium text-gray-900">Tambah Titik Baru</span>
            <span className="text-sm text-gray-500 mt-1">Gunakan GPS atau Peta</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminLocations;

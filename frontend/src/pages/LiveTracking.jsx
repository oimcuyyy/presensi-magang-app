import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation } from 'lucide-react';

// Fix untuk ikon marker Leaflet di React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LiveTracking = () => {
  const { socket } = useSocket();
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('live_locations', (users) => {
      setActiveUsers(users);
    });

    return () => {
      socket.off('live_locations');
    };
  }, [socket]);

  // Default center Jakarta
  const defaultCenter = [-6.200000, 106.816666];
  
  // Ambil lokasi user pertama untuk memusatkan peta jika ada
  const mapCenter = activeUsers.length > 0 
    ? [activeUsers[0].latitude, activeUsers[0].longitude] 
    : defaultCenter;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center z-10 relative shadow-sm">
          <div>
            <h2 className="text-xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              Live Tracking
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Memantau pergerakan siswa dan guru secara real-time.
            </p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            {activeUsers.length} Aktif
          </div>
        </div>

        <div className="flex-1 relative z-0">
          <MapContainer 
            center={mapCenter} 
            zoom={15} 
            style={{ height: '100%', width: '100%', position: 'absolute', top: 0, bottom: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {activeUsers.map((user) => {
              
              // Custom Icon Logic
              let customIcon;
              if (user.photo) {
                const photoUrl = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}${user.photo}` : user.photo;
                customIcon = L.divIcon({
                  className: 'custom-avatar-icon',
                  html: `<div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${user.role === 'siswa' ? '#3b82f6' : '#10b981'}; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); background-color: white;">
                           <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random'"/>
                         </div>`,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20]
                });
              } else {
                const bgColor = user.role === 'siswa' ? '3b82f6' : '10b981';
                customIcon = L.divIcon({
                  className: 'custom-avatar-icon',
                  html: `<div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid #${bgColor}; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background-color: white; display: flex; align-items: center; justify-content: center;">
                           <span style="font-weight: bold; color: #${bgColor}; font-size: 16px;">${user.name.charAt(0).toUpperCase()}</span>
                         </div>`,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20]
                });
              }

              return (
                <Marker 
                  key={user.socketId} 
                  position={[user.latitude, user.longitude]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="text-sm min-w-[200px]">
                      {user.photo && (
                        <div className="mb-3 flex justify-center">
                          <img src={import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}${user.photo}` : user.photo} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                        </div>
                      )}
                      <p className="font-bold text-gray-900 text-center">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize mb-1 text-center">{user.role.replace('_', ' ')}</p>
                      
                      {user.role === 'siswa' && (
                        <div className="my-2 p-2 bg-gray-50 rounded border border-gray-100">
                          <p className="text-[10px] text-gray-700"><strong>Kelas:</strong> {user.kelas || '-'}</p>
                          <p className="text-[10px] text-gray-700"><strong>Jurusan:</strong> {user.jurusan || '-'}</p>
                          <p className="text-[10px] text-gray-700 mt-1"><strong>Instansi:</strong> {user.nama_instansi || '-'}</p>
                          <p className="text-[10px] text-gray-700"><strong>Pembimbing:</strong> {user.pembimbing_instansi || '-'}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-2 text-center">Update: {new Date(user.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </Popup>
                  {/* Tambahkan efek lingkaran berdenyut disekitar marker */}
                  <Circle 
                    center={[user.latitude, user.longitude]} 
                    radius={15} 
                    pathOptions={{ color: user.role === 'siswa' ? '#3b82f6' : '#10b981', fillColor: user.role === 'siswa' ? '#3b82f6' : '#10b981', fillOpacity: 0.15, weight: 1 }} 
                  />
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </main>
    </div>
  );
};

export default LiveTracking;

import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Users, Search, Target, Compass, Signal, Clock, Building, School, ExternalLink, X } from 'lucide-react';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Smooth map panning helper
const MapController = ({ targetCoords, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, zoom || 16, { duration: 1.2 });
    }
  }, [targetCoords, zoom, map]);
  return null;
};

// Auto-frame all active students
const FitAllBounds = ({ users, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (users && users.length > 0) {
      const bounds = L.latLngBounds(users.map(u => [u.latitude, u.longitude]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [trigger, users, map]);
  return null;
};

// SMK Negeri 20 Jakarta Official Benchmark
const SMKN20_COORDS = [-6.284000, 106.793800];

const SchoolIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#ffffff;border:2.5px solid #fbbf24;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);padding:3px;overflow:hidden;"><img src="/logo-smkn20.png" alt="SMKN 20" style="width:100%;height:100%;object-fit:contain;"/></div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21]
});

const LiveTracking = () => {
  const { socket } = useSocket();
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!socket) return;

    socket.on('live_locations', (users) => {
      setActiveUsers(users);
      if (selectedUser) {
        const updated = users.find(u => u.userId === selectedUser.userId);
        if (updated) setSelectedUser(updated);
      }
    });

    return () => {
      socket.off('live_locations');
    };
  }, [socket, selectedUser]);

  const defaultCenter = SMKN20_COORDS; // Kampus SMK Negeri 20 Jakarta
  const mapCenter = activeUsers.length > 0
    ? [activeUsers[0].latitude, activeUsers[0].longitude]
    : defaultCenter;

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFlyTarget([user.latitude, user.longitude]);
  };

  const handleFitAll = () => {
    setFitTrigger(prev => prev + 1);
    setSelectedUser(null);
  };

  const filteredUsers = activeUsers.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nama_instansi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen bg-slate-900 flex flex-col relative overflow-hidden font-sans">
      {/* Top Dispatch Control Header */}
      <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6 flex justify-between items-center z-20 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                Pusat Telemetri Satelit Siswa
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live GPS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pantau koordinat dan batas radius toleransi GPS siswa magang aktif.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Snap to SMKN 20 Jakarta */}
          <button
            onClick={() => {
              setFlyTarget(SMKN20_COORDS);
              setSelectedUser(null);
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Pusatkan peta ke Kampus SMK Negeri 20 Jakarta"
          >
            <School className="w-3.5 h-3.5" />
            <span>SMKN 20 Jakarta</span>
          </button>

          <button
            onClick={handleFitAll}
            disabled={activeUsers.length === 0}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5"
            title="Lihat seluruh siswa di peta"
          >
            <Target className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Semua Siswa</span>
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{activeUsers.length} Aktif</span>
          </button>
        </div>
      </header>

      {/* Main Map Viewport & Drawer */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController targetCoords={flyTarget} />
          <FitAllBounds users={activeUsers} trigger={fitTrigger} />

          {/* Official SMKN 20 Jakarta Campus Landmark */}
          <Marker position={SMKN20_COORDS} icon={SchoolIcon}>
            <Popup className="font-sans">
              <div className="p-1 space-y-1">
                <p className="font-black text-xs text-blue-900">SMK Negeri 20 Jakarta</p>
                <p className="text-[10px] text-slate-600">Jl. Melati No. 24, Cilandak Barat, Jakarta Selatan</p>
                <div className="text-[9px] font-bold text-amber-600 uppercase">Kampus Induk & Geofencing Sekolah</div>
              </div>
            </Popup>
          </Marker>
          <Circle
            center={SMKN20_COORDS}
            radius={200}
            pathOptions={{ color: '#1e3a8a', fillColor: '#3b82f6', fillOpacity: 0.18, weight: 2 }}
          />

          {activeUsers.map((user) => {
            const isSelected = selectedUser?.userId === user.userId;
            const accuracy = user.accuracy ? Math.round(user.accuracy) : 15;
            const photoUrl = user.photo
              ? (import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}${user.photo}` : user.photo)
              : null;

            const customIcon = L.divIcon({
              className: 'custom-avatar-pin',
              html: `
                <div style="position: relative; width: 40px; height: 40px;">
                  <div style="
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 2.5px solid ${user.role === 'siswa' ? '#2563eb' : '#059669'};
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), 0 0 0 2px white;
                    overflow: hidden;
                    background: white;
                    transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
                    transition: transform 0.2s ease;
                  ">
                    ${photoUrl
                      ? `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0f172a&color=fff'"/>`
                      : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #0f172a; font-size: 14px;">${user.name?.charAt(0).toUpperCase() || 'U'}</div>`
                    }
                  </div>
                  <span style="
                    position: absolute;
                    bottom: 0px;
                    right: 0px;
                    width: 11px;
                    height: 11px;
                    background: #10b981;
                    border: 2px solid white;
                    border-radius: 50%;
                  "></span>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -20]
            });

            return (
              <React.Fragment key={user.socketId || user.userId}>
                <Marker
                  position={[user.latitude, user.longitude]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => setSelectedUser(user)
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 min-w-[210px] max-w-[250px] font-sans text-slate-800">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-300"
                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0f172a&color=fff`; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm border border-slate-200">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-xs truncate leading-tight">{user.name}</h4>
                          <span className="inline-block px-1.5 py-0.2 mt-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {user.role?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="py-2 space-y-1 text-xs text-slate-600">
                        {user.kelas && (
                          <p className="text-[11px] truncate">
                            <span className="font-semibold text-slate-700">Kelas:</span> {user.kelas} ({user.jurusan})
                          </p>
                        )}
                        {user.nama_instansi && (
                          <p className="text-[11px] truncate">
                            <span className="font-semibold text-slate-700">Mitra:</span> {user.nama_instansi}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-100">
                          <span className="text-emerald-700 font-bold">
                            Toleransi: &plusmn;{accuracy}m
                          </span>
                          <span className="font-mono">
                            {new Date(user.timestamp).toLocaleTimeString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps?q=${user.latitude},${user.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-center rounded-lg text-xs font-semibold transition-colors mt-1"
                      >
                        Buka di Google Maps
                      </a>
                    </div>
                  </Popup>
                </Marker>

                {/* Real GPS Accuracy Radius Perimeter */}
                <Circle
                  center={[user.latitude, user.longitude]}
                  radius={accuracy}
                  pathOptions={{
                    color: user.role === 'siswa' ? '#2563eb' : '#059669',
                    fillColor: user.role === 'siswa' ? '#3b82f6' : '#10b981',
                    fillOpacity: 0.1,
                    weight: 1.25,
                    dashArray: '4, 6'
                  }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Floating Telemetry Drawer */}
        {isSidebarOpen && (
          <div className="absolute top-4 right-4 z-[1000] w-80 max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col max-h-[calc(100%-2rem)] text-white">
            <div className="p-3.5 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" /> Siswa Aktif ({activeUsers.length})
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-slate-500 hover:text-white p-1 rounded-lg"
                  aria-label="Tutup panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, kelas, tempat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-800 max-h-96">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelected = selectedUser?.userId === user.userId;
                  return (
                    <button
                      key={user.socketId || user.userId}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-blue-600/20 border-l-2 border-blue-500' : 'hover:bg-slate-900'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs overflow-hidden border border-slate-700">
                          {user.photo ? (
                            <img
                              src={import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}${user.photo}` : user.photo}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 border border-slate-950 absolute bottom-0 right-0" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white truncate">{user.name}</p>
                          <span className="font-mono text-[10px] text-slate-500">
                            {new Date(user.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {user.kelas || user.nama_instansi || user.role}
                        </p>
                        <p className="text-[10px] text-emerald-400 font-medium">
                          GPS: &plusmn;{user.accuracy || 15}m
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  {activeUsers.length === 0
                    ? 'Belum ada siswa yang mengaktifkan pelacakan GPS.'
                    : 'Tidak ada siswa yang sesuai pencarian.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;

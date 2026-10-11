import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Navigation,
  Users,
  Search,
  Target,
  Clock,
  Building,
  School,
  X,
  Radio
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import logoSmkn20 from '../assets/logo-smkn20.png';

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

// Fit bounds to show all active students
const FitAllBounds = ({ users, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (users && users.length > 0) {
      const bounds = L.latLngBounds(users.map((u) => [u.latitude, u.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [trigger, users, map]);
  return null;
};

// Titik Koordinat Kampus SMK Negeri 20 Jakarta
const SMKN20_COORDS = [-6.284000, 106.793800];

const SchoolIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#ffffff;border:2.5px solid #d97706;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.25);padding:2px;overflow:hidden;"><img src="${logoSmkn20}" alt="SMKN 20" style="width:100%;height:100%;object-fit:contain;display:block;" onerror="this.onerror=null;this.src='/logo-smkn20.png';"/></div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19]
});

const StudentPinIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#0c2340;border:2px solid #ffffff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 8px rgba(0,0,0,0.25);color:#f59e0b;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
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
        const updated = users.find((u) => u.userId === selectedUser.userId);
        if (updated) setSelectedUser(updated);
      }
    });

    return () => {
      socket.off('live_locations');
    };
  }, [socket, selectedUser]);

  const defaultCenter = SMKN20_COORDS;
  const mapCenter = activeUsers.length > 0
    ? [activeUsers[0].latitude, activeUsers[0].longitude]
    : defaultCenter;

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFlyTarget([user.latitude, user.longitude]);
  };

  const handleFitAll = () => {
    setFitTrigger((prev) => prev + 1);
    setSelectedUser(null);
  };

  const filteredUsers = activeUsers.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nama_instansi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Peta Siswa"
        description="Pantau keberadaan siswa PKL yang sedang membagikan lokasi secara langsung di tempat magang."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={School}
              onClick={() => setFlyTarget(SMKN20_COORDS)}
            >
              Ke SMKN 20
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Target}
              onClick={handleFitAll}
              disabled={activeUsers.length === 0}
            >
              Lihat Semua Siswa ({activeUsers.length})
            </Button>
          </div>
        }
      />

      {/* Surface Peta & Daftar Siswa */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col lg:flex-row h-[620px] relative">
        {/* Kontainer Peta dengan Tile Kalem CARTO Positron */}
        <div className="flex-1 relative h-full">
          <MapContainer
            center={mapCenter}
            zoom={14}
            scrollWheelZoom={true}
            className="h-full w-full z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController targetCoords={flyTarget} />
            <FitAllBounds users={activeUsers} trigger={fitTrigger} />

            {/* Marker SMKN 20 Jakarta */}
            <Marker position={SMKN20_COORDS} icon={SchoolIcon}>
              <Popup>
                <div className="p-1 space-y-1">
                  <p className="font-extrabold text-xs text-[#0c2340]">SMK Negeri 20 Jakarta</p>
                  <p className="text-[11px] text-slate-500">Kampus Pusat • Cilandak</p>
                </div>
              </Popup>
            </Marker>

            {/* Marker Siswa yang Aktif Berbagi Lokasi */}
            {activeUsers.map((u) => (
              <React.Fragment key={u.userId || u.socketId}>
                <Marker
                  position={[u.latitude, u.longitude]}
                  icon={StudentPinIcon}
                  eventHandlers={{
                    click: () => handleSelectUser(u)
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-600">{u.nama_instansi || 'Lokasi Magang'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Akurasi: &plusmn;{u.accuracy || 10} m
                      </p>
                    </div>
                  </Popup>
                </Marker>

                {/* Lingkaran Akurasi GPS */}
                <Circle
                  center={[u.latitude, u.longitude]}
                  radius={u.accuracy || 30}
                  pathOptions={{
                    color: '#0c2340',
                    fillColor: '#d97706',
                    fillOpacity: 0.15,
                    weight: 1.5
                  }}
                />
              </React.Fragment>
            ))}
          </MapContainer>

          {/* Toggle Tombol Panel Siswa di Mobile */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden absolute bottom-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-white shadow-lg border border-slate-200 text-xs font-bold text-slate-900 flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-[#0c2340]" />
            <span>Daftar Siswa ({activeUsers.length})</span>
          </button>
        </div>

        {/* Panel Samping Siswa Aktif */}
        <div
          className={`${
            isSidebarOpen ? 'flex' : 'hidden lg:flex'
          } w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex-col h-72 lg:h-full z-20`}
        >
          {/* Header Panel & Search */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Siswa Aktif ({activeUsers.length})
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live GPS
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#0c2340]"
              />
            </div>
          </div>

          {/* Daftar Siswa */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-semibold">
                  {activeUsers.length === 0
                    ? 'Belum ada siswa yang membagikan lokasi.'
                    : 'Tidak ada siswa yang cocok dengan pencarian.'}
                </p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?.userId === u.userId;
                return (
                  <button
                    key={u.userId || u.socketId}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-[#0c2340] text-white shadow-sm'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate">{u.name}</p>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                        &plusmn;{u.accuracy}m
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                      {u.nama_instansi || 'Lokasi PKL'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;

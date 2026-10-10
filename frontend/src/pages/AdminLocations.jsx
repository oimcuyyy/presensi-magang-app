import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Crosshair,
  AlertCircle,
  Building2,
  School,
  CheckCircle2,
  Compass,
  Navigation,
  ExternalLink,
  Layers,
  X
} from 'lucide-react';
import api from '../services/api';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons with Authentic SMKN 20 Emblem
const SchoolIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#ffffff;border:2.5px solid #fbbf24;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.35);padding:3px;overflow:hidden;"><img src="/logo-smkn20.png" alt="SMKN 20" style="width:100%;height:100%;object-fit:contain;"/></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const PklIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color:#0f766e;border:2px solid #ffffff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 8px rgba(0,0,0,0.25);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="8" y1="6" x2="8.01" y2="6"></line><line x1="16" y1="6" x2="16.01" y2="6"></line><line x1="8" y1="10" x2="8.01" y2="10"></line><line x1="16" y1="10" x2="16.01" y2="10"></line><line x1="8" y1="14" x2="8.01" y2="14"></line><line x1="16" y1="14" x2="16.01" y2="14"></line></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const PickerIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color:#ef4444;border:2.5px solid #ffffff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.35);animation:bounce 1s infinite;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34]
});

// SMK Negeri 20 Jakarta Default Official Benchmark
const SMKN20_COORDS = [-6.284000, 106.793800];

// Map panning controller
const MapFlyTo = ({ targetCoords, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, zoom || 17, { duration: 1.2 });
    }
  }, [targetCoords, zoom, map]);
  return null;
};

// Map click coordinate picker
const MapClickPicker = ({ isPicking, onPick }) => {
  useMapEvents({
    click(e) {
      if (isPicking) {
        onPick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

const AdminLocations = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Map state — Directly initialized to SMK Negeri 20 Jakarta
  const [flyTarget, setFlyTarget] = useState(SMKN20_COORDS);
  const [flyZoom, setFlyZoom] = useState(17);
  const [selectedLoc, setSelectedLoc] = useState(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isPickingOnMap, setIsPickingOnMap] = useState(false);

  const [formData, setFormData] = useState({
    name: 'SMK Negeri 20 Jakarta (Kampus Utama)',
    latitude: -6.284000,
    longitude: 106.793800,
    radius: 200,
    address: 'Jl. Melati No. 24, Cilandak Barat, Cilandak, Jakarta Selatan 12430'
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/locations');
      const locList = response.data.data || [];
      setLocations(locList);

      // Pastikan titik SMKN 20 Jakarta langsung terpilih dan dipusatkan
      const smkLoc = locList.find(l => l.name?.toLowerCase().includes('20') || l.id === 1) || locList[0];
      if (smkLoc) {
        setSelectedLoc(smkLoc);
        setFlyTarget([parseFloat(smkLoc.latitude), parseFloat(smkLoc.longitude)]);
      } else {
        setFlyTarget(SMKN20_COORDS);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setError('Gagal memuat data master lokasi dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCenterSchool = () => {
    setFlyTarget(SMKN20_COORDS);
    setFlyZoom(18);
    const smk = locations.find(l => l.name?.toLowerCase().includes('20') || l.id === 1);
    if (smk) setSelectedLoc(smk);
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      name: '',
      latitude: SMKN20_COORDS[0],
      longitude: SMKN20_COORDS[1],
      radius: 200,
      address: ''
    });
    setIsPickingOnMap(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setIsEditing(true);
    setEditId(loc.id);
    setFormData({
      name: loc.name,
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      radius: loc.radius,
      address: loc.address || ''
    });
    setIsPickingOnMap(false);
    setIsModalOpen(true);
  };

  const handleFillSmknPreset = () => {
    setFormData({
      name: 'SMK Negeri 20 Jakarta (Kampus Utama)',
      latitude: -6.284000,
      longitude: 106.793800,
      radius: 200,
      address: 'Jl. Melati No. 24, Cilandak Barat, Cilandak, Jakarta Selatan 12430'
    });
    setFlyTarget(SMKN20_COORDS);
    setFlyZoom(18);
  };

  const handleMapPick = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(8)),
      longitude: parseFloat(lng.toFixed(8))
    }));
    setIsPickingOnMap(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      if (isEditing) {
        await api.put(`/locations/${editId}`, formData);
        setSuccessMsg(`Lokasi "${formData.name}" berhasil diperbarui.`);
      } else {
        await api.post('/locations', formData);
        setSuccessMsg(`Lokasi "${formData.name}" berhasil didaftarkan.`);
      }
      setIsModalOpen(false);
      await fetchLocations();
    } catch (err) {
      console.error('Save location error:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan data lokasi.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus titik lokasi "${name}"?`)) return;

    setError(null);
    setSuccessMsg(null);
    try {
      await api.delete(`/locations/${id}`);
      setSuccessMsg(`Lokasi "${name}" berhasil dihapus.`);
      await fetchLocations();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Gagal menghapus lokasi.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Institutional Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                SMK Negeri 20 Jakarta
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">Master Geofencing Kehadiran</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <MapPin className="w-6 h-6 text-blue-700" />
              Kelola Titik Lokasi & Radius Geofence
            </h1>

            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Pusat koordinat resmi SMK Negeri 20 Jakarta dan lokasi mitra industri/instansi tempat siswa magang. Siswa wajib berada dalam radius toleransi saat melakukan presensi mandiri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Direct Quick-Center Button to SMKN 20 */}
            <button
              onClick={handleCenterSchool}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all active:scale-[0.98]"
              title="Langsung pusatkan peta ke kampus SMK Negeri 20 Jakarta"
            >
              <School className="w-4 h-4" />
              Pusatkan ke SMKN 20 Jakarta
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Tambah Titik Lokasi
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Interactive Map Surface */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row h-[600px]">
          {/* Main Map Viewport */}
          <div className="flex-1 relative h-full">
            <MapContainer
              center={SMKN20_COORDS}
              zoom={17}
              scrollWheelZoom={true}
              className="h-full w-full z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFlyTo targetCoords={flyTarget} zoom={flyZoom} />
              <MapClickPicker isPicking={isPickingOnMap} onPick={handleMapPick} />

              {/* Render All Database Locations */}
              {locations.map((loc) => {
                const lat = parseFloat(loc.latitude);
                const lng = parseFloat(loc.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;

                const isSchool = loc.name?.toLowerCase().includes('20') || loc.id === 1;

                return (
                  <React.Fragment key={loc.id}>
                    <Marker
                      position={[lat, lng]}
                      icon={isSchool ? SchoolIcon : PklIcon}
                      eventHandlers={{
                        click: () => {
                          setSelectedLoc(loc);
                          setFlyTarget([lat, lng]);
                        }
                      }}
                    >
                      <Popup className="font-sans">
                        <div className="p-1 space-y-1">
                          <p className="font-extrabold text-xs text-slate-900">{loc.name}</p>
                          <p className="text-[10px] text-slate-600">{loc.address || 'Alamat tidak terdata'}</p>
                          <div className="pt-1 flex items-center justify-between text-[9px] font-mono font-bold text-blue-700">
                            <span>Radius: {loc.radius} meter</span>
                            {isSchool && <span className="text-amber-600 font-sans">Kampus Utama</span>}
                          </div>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Geofencing Tolerance Circle */}
                    <Circle
                      center={[lat, lng]}
                      radius={loc.radius || 200}
                      pathOptions={{
                        color: isSchool ? '#1e3a8a' : '#0f766e',
                        fillColor: isSchool ? '#3b82f6' : '#14b8a6',
                        fillOpacity: 0.16,
                        weight: 2,
                        dashArray: isSchool ? undefined : '4, 4'
                      }}
                    />
                  </React.Fragment>
                );
              })}

              {/* Temp Picker Marker when selecting coordinates */}
              {isModalOpen && (
                <Marker
                  position={[formData.latitude, formData.longitude]}
                  icon={PickerIcon}
                >
                  <Popup>
                    <span className="text-[11px] font-bold">Titik Koordinat Baru</span>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Quick Floating Overlays on Map */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
              <button
                onClick={handleCenterSchool}
                className="bg-white/95 backdrop-blur shadow-md px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 hover:bg-slate-50 flex items-center gap-2"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span>Pusat: SMK Negeri 20 Jakarta</span>
              </button>
            </div>

            {isPickingOnMap && (
              <div className="absolute top-4 right-4 z-20 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
                <Crosshair className="w-4 h-4" />
                <span>Klik di area peta untuk menentukan titik koordinat</span>
              </div>
            )}
          </div>

          {/* Locations Side Ledger / Directory */}
          <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-[300px] lg:h-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Daftar Lokasi Terdaftar ({locations.length})
                </h2>
                <p className="text-[11px] text-slate-500">Klik titik untuk zoom otomatis</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {locations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Belum ada master lokasi terdaftar.
                </div>
              ) : (
                locations.map((loc) => {
                  const isSchool = loc.name?.toLowerCase().includes('20') || loc.id === 1;
                  const isSelected = selectedLoc?.id === loc.id;

                  return (
                    <div
                      key={loc.id}
                      onClick={() => {
                        setSelectedLoc(loc);
                        setFlyTarget([parseFloat(loc.latitude), parseFloat(loc.longitude)]);
                        setFlyZoom(17);
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/90 border border-blue-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                            isSchool ? 'bg-blue-800' : 'bg-teal-700'
                          }`}>
                            {isSchool ? <School className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{loc.name}</h3>
                              {isSchool && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-400 text-slate-950">
                                  Utama
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {loc.address || 'Alamat belum diatur'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEdit(loc)}
                            className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-white"
                            title="Edit Lokasi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isSchool && (
                            <button
                              onClick={() => handleDelete(loc.id, loc.name)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white"
                              title="Hapus Lokasi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>{parseFloat(loc.latitude).toFixed(5)}, {parseFloat(loc.longitude).toFixed(5)}</span>
                        <span className="font-bold text-blue-700">Radius: {loc.radius}m</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Add / Edit Location */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {isEditing ? 'Perbarui Titik Lokasi' : 'Tambah Titik Lokasi Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Atur kordinat geofence untuk presensi siswa</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1-Click Preset Shortcut for SMKN 20 */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-950">Gunakan Profil SMKN 20 Jakarta?</p>
                  <p className="text-[10px] text-amber-800">Isi otomatis koordinat resmi kampus SMK Negeri 20</p>
                </div>
                <button
                  type="button"
                  onClick={handleFillSmknPreset}
                  className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shrink-0"
                >
                  Terapkan SMKN 20
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lokasi / Sekolah / Instansi Mitra
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: SMK Negeri 20 Jakarta atau PT Mitra Jaya"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Alamat jalan, kelurahan, kecamatan..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.latitude}
                      onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.longitude}
                      onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Radius Geofence: {formData.radius} Meter
                    </label>
                    <span className="text-[10px] text-slate-500">Jarak toleransi GPS siswa</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={2000}
                    step={10}
                    value={formData.radius}
                    onChange={e => setFormData({ ...formData, radius: parseInt(e.target.value) || 200 })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPickingOnMap(true)}
                    className="px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Crosshair className="w-4 h-4" />
                    Pilih Titik di Peta
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-extrabold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-sm transition-all"
                    >
                      {isEditing ? 'Simpan Perubahan' : 'Daftarkan Lokasi'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminLocations;

import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

import logoSmkn20 from '../assets/logo-smkn20.png';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const SchoolIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#ffffff;border:2.5px solid #d97706;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.25);padding:2px;overflow:hidden;"><img src="${logoSmkn20}" alt="SMKN 20" style="width:100%;height:100%;object-fit:contain;display:block;" onerror="this.onerror=null;this.src='/logo-smkn20.png';"/></div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19]
});

// Marker Tempat PKL / Industri Mitra
const PklIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color:#0c2340;border:2.5px solid #38bdf8;border-radius:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(12,35,64,0.35);color:#ffffff;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

// Helper identifikasi lokasi kampus sekolah vs tempat magang industri
const isSchoolLocation = (loc) => {
  if (!loc) return false;
  return loc.id === 1 || loc.name?.toLowerCase().includes('smk') || loc.name?.toLowerCase().includes('sekolah');
};

const PickerIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color:#dc2626;border:2.5px solid #ffffff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.3);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Titik Koordinat Kampus SMKN 20 Jakarta
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [flyZoom, setFlyZoom] = useState(17);
  const [isPickingOnMap, setIsPickingOnMap] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: -6.284000,
    longitude: 106.793800,
    radius: 100
  });

  // Delete Confirm Modal
  const [deleteId, setDeleteId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data?.data || []);
    } catch (err) {
      setError('Gagal memuat daftar lokasi.');
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      latitude: -6.284000,
      longitude: 106.793800,
      radius: 100
    });
    setIsPickingOnMap(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingId(loc.id);
    setFormData({
      name: loc.name,
      address: loc.address || '',
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      radius: loc.radius || 100
    });
    setIsPickingOnMap(false);
    setIsModalOpen(true);
  };

  const handleMapPick = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6))
    }));
    setIsPickingOnMap(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (editingId) {
        await api.put(`/locations/${editingId}`, formData);
        setSuccessMsg('Lokasi berhasil diperbarui.');
      } else {
        await api.post('/locations', formData);
        setSuccessMsg('Lokasi baru berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      fetchLocations();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data lokasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/locations/${deleteId}`);
      setSuccessMsg('Lokasi berhasil dihapus.');
      setDeleteId(null);
      fetchLocations();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError('Gagal menghapus lokasi.');
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Tempat PKL & Lokasi Magang"
        description="Kelola daftar perusahaan dan instansi mitra (DU/DI) tempat siswa magang serta kampus pusat SMKN 20 Jakarta. Tambahkan tempat PKL baru untuk memperluas jangkauan lokasi siswa."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={School}
              onClick={() => {
                setFlyTarget(SMKN20_COORDS);
                setFlyZoom(17);
              }}
            >
              Fokus SMKN 20
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={handleOpenAdd}
            >
              Tambah Tempat PKL
            </Button>
          </div>
        }
      />

      {/* Banner Pesan */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Surface Map & Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col lg:flex-row h-[620px] relative">
        {/* Kontainer Peta */}
        <div className="flex-1 relative h-full">
          <MapContainer
            center={SMKN20_COORDS}
            zoom={16}
            scrollWheelZoom={true}
            className="h-full w-full z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapFlyTo targetCoords={flyTarget} zoom={flyZoom} />
            <MapClickPicker isPicking={isPickingOnMap} onPick={handleMapPick} />

            {/* Marker SMKN 20 & Seluruh Tempat PKL Mitra */}
            {locations.map((loc) => {
              const lat = parseFloat(loc.latitude);
              const lng = parseFloat(loc.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;

              const isSchool = isSchoolLocation(loc);

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
                    <Popup>
                      <div className="p-1 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            isSchool ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-sky-100 text-sky-900 border border-sky-300'
                          }`}>
                            {isSchool ? 'Kampus Induk' : 'Tempat PKL Mitra'}
                          </span>
                        </div>
                        <p className="font-extrabold text-[#0c2340] leading-tight">{loc.name}</p>
                        <p className="text-[11px] text-slate-600">{loc.address || '-'}</p>
                        <p className="text-[10px] text-amber-700 font-mono font-bold">
                          Radius Absen: {loc.radius} meter
                        </p>
                      </div>
                    </Popup>
                  </Marker>

                  <Circle
                    center={[lat, lng]}
                    radius={loc.radius || 100}
                    pathOptions={{
                      color: isSchool ? '#0c2340' : '#0284c7',
                      fillColor: isSchool ? '#d97706' : '#38bdf8',
                      fillOpacity: isSchool ? 0.12 : 0.18,
                      weight: 2
                    }}
                  />
                </React.Fragment>
              );
            })}

            {/* Marker Sementara saat Menentukan Koordinat */}
            {isModalOpen && (
              <Marker
                position={[formData.latitude, formData.longitude]}
                icon={PickerIcon}
              >
                <Popup>
                  <span className="text-xs font-bold">Titik Baru Dipilih</span>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Indikator Mode Klik Peta */}
          {isPickingOnMap && (
            <div className="absolute top-4 left-14 z-20 bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
              <Crosshair className="w-4 h-4" />
              <span>Klik di peta untuk memilih koordinat tempat PKL</span>
            </div>
          )}
        </div>

        {/* Panel Samping Daftar Tempat PKL */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-72 lg:h-full z-20">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Daftar Lokasi ({locations.length})
              </h3>
              <p className="text-[11px] text-slate-500">Klik item untuk fokus ke koordinat peta.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="p-1.5 rounded-lg bg-[#0c2340] text-white hover:bg-[#132e58] transition-colors"
              title="Tambah Tempat PKL Baru"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {locations.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">Belum ada titik lokasi.</p>
            ) : (
              locations.map((loc) => {
                const isSchool = isSchoolLocation(loc);
                return (
                  <div
                    key={loc.id}
                    className="p-3 rounded-xl hover:bg-slate-50 flex items-start justify-between gap-3 text-xs transition-colors"
                  >
                    <div
                      onClick={() => {
                        setFlyTarget([parseFloat(loc.latitude), parseFloat(loc.longitude)]);
                        setFlyZoom(17);
                        setSelectedLoc(loc);
                      }}
                      className="cursor-pointer min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isSchool
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-sky-50 text-sky-900 border-sky-200'
                        }`}>
                          {isSchool ? (
                            <><School className="w-2.5 h-2.5 text-amber-600" /> Kampus Induk</>
                          ) : (
                            <><Building2 className="w-2.5 h-2.5 text-sky-600" /> Tempat PKL</>
                          )}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 truncate">{loc.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{loc.address || '-'}</p>
                      <span className="inline-block text-[10px] font-mono font-bold text-amber-700 mt-1">
                        Radius: {loc.radius} meter
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(loc)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
                        title="Edit lokasi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isSchool ? (
                        <button
                          type="button"
                          onClick={() => setDeleteId(loc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Hapus lokasi PKL ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          className="p-1.5 text-slate-300 cursor-not-allowed"
                          title="Lokasi induk sekolah tidak dapat dihapus"
                        >
                          <Trash2 className="w-4 h-4 opacity-30" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL FORM TAMBAH / EDIT LOKASI ──────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Tempat PKL' : 'Tambah Tempat PKL Baru'}
        description="Daftarkan perusahaan atau instansi mitra DU/DI tempat siswa melaksanakan praktik kerja lapangan."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="loc-name" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nama Perusahaan / Instansi PKL <span className="text-red-500">*</span>
            </label>
            <input
              id="loc-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: PT Telkom Indonesia / Bank DKI Fatmawati"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
            />
          </div>

          <div>
            <label htmlFor="loc-address" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Alamat Kantor / Tempat Magang
            </label>
            <input
              id="loc-address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Jl. TB Simatupang / Jl. RS Fatmawati..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="loc-lat" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Latitude
              </label>
              <input
                id="loc-lat"
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:bg-white focus:border-[#0c2340]"
              />
            </div>
            <div>
              <label htmlFor="loc-lng" className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Longitude
              </label>
              <input
                id="loc-lng"
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:bg-white focus:border-[#0c2340]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="loc-radius" className="block font-bold uppercase tracking-wider text-slate-700">
                Radius Toleransi Presensi (Meter)
              </label>
              <div className="flex gap-1.5">
                {[50, 100, 200].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, radius: r })}
                    className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-colors ${
                      formData.radius === r
                        ? 'bg-[#0c2340] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>
            </div>
            <input
              id="loc-radius"
              type="number"
              min="10"
              max="5000"
              required
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) || 100 })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:bg-white focus:border-[#0c2340]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Siswa dapat absen jika berada dalam batas radius meter ini dari titik kantor mitra.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsPickingOnMap(true);
                setIsModalOpen(false);
              }}
              className="text-xs font-semibold text-[#0c2340] hover:underline flex items-center gap-1"
            >
              <Crosshair className="w-3.5 h-3.5" /> Pilih dari Peta
            </button>

            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" size="md" type="submit" isLoading={isLoading}>
                Simpan Lokasi
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── DIALOG KONFIRMASI HAPUS (WCAG ACCESSIBLE) ───────────── */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Hapus Titik Lokasi?"
        description="Tindakan ini permanen. Siswa yang terdaftar pada lokasi ini mungkin tidak dapat absen sampai lokasi baru diatur."
      >
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="secondary" size="md" onClick={() => setDeleteId(null)}>
            Batal
          </Button>
          <Button variant="danger" size="md" onClick={confirmDelete}>
            Hapus Lokasi
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLocations;

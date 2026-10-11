import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  MapPin,
  Phone,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  Mail,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';

const Profile = () => {
  const [userRole, setUserRole] = useState('');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    nisn: '',
    kelas: '',
    jurusan: '',
    no_hp: '',
    alamat: '',
    nama_instansi: '',
    pembimbing_instansi: '',
    photo_url: ''
  });

  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUserRole(userData.role);
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/profile');
      const data = response.data?.data || {};
      setProfile({
        name: data.name || '',
        email: data.email || '',
        nisn: data.nisn || '',
        kelas: data.kelas || '',
        jurusan: data.jurusan || '',
        no_hp: data.no_hp || '',
        alamat: data.alamat || '',
        nama_instansi: data.nama_instansi || '',
        pembimbing_instansi: data.pembimbing_instansi || '',
        photo_url: ''
      });
      if (data.photo) {
        setPreviewPhoto(import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}${data.photo}` : data.photo);
      }
    } catch (err) {
      setError('Gagal memuat profil pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === 'no_hp') {
      sanitizedValue = value.replace(/[^0-9]/g, '');
    } else if (name === 'jurusan' || name === 'pembimbing_instansi') {
      sanitizedValue = value.replace(/[^a-zA-Z\s.,'"]/g, '');
    }

    setProfile((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran foto maksimal 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result);
        setProfile((prev) => ({ ...prev, photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api.put('/users/profile', profile);
      setMessage(response.data?.message || 'Profil berhasil diperbarui.');

      // Update cached user name in localStorage
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      userData.name = profile.name;
      if (profile.nama_instansi) userData.nama_instansi = profile.nama_instansi;
      localStorage.setItem('user', JSON.stringify(userData));

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const isSiswa = userRole === 'siswa';

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <PageHeader
        title="Profil"
        description="Kelola informasi akun dan biodata resmi Anda."
      />

      {/* Banner Notifikasi */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kartu Informasi Akun & Pas Foto */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            Foto & Identitas Akun
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Pas Foto Preview */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border-2 border-[#0c2340] shadow-sm flex items-center justify-center">
                {previewPhoto ? (
                  <img src={previewPhoto} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#0c2340] text-white hover:bg-[#132e58] shadow-md cursor-pointer active:scale-95 transition-all"
                title="Ganti foto profil"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-extrabold text-slate-900">{profile.name || 'Pengguna'}</h3>
              <p className="text-xs font-mono text-slate-500">{profile.email}</p>
              <div className="pt-1">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                  userRole === 'admin'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : userRole === 'guru_pembimbing'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {userRole === 'admin' ? 'Administrator TU' : userRole === 'guru_pembimbing' ? 'Guru Pembimbing' : 'Siswa PKL'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label htmlFor="prof-name" className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                id="prof-name"
                name="name"
                type="text"
                required
                value={profile.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
              />
            </div>

            <div>
              <label htmlFor="prof-email" className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Sekolah
              </label>
              <input
                id="prof-email"
                name="email"
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono cursor-not-allowed outline-none"
              />
            </div>
          </div>
        </div>

        {/* ─── FIELD KHUSUS SISWA (BIODATA & TEMPAT MAGANG) ────────── */}
        {isSiswa && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Biodata Siswa & Tempat PKL
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label htmlFor="prof-nisn" className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  NISN
                </label>
                <input
                  id="prof-nisn"
                  name="nisn"
                  type="text"
                  value={profile.nisn}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:bg-white focus:border-[#0c2340]"
                />
              </div>

              <div>
                <label htmlFor="prof-kelas" className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kelas
                </label>
                <input
                  id="prof-kelas"
                  name="kelas"
                  type="text"
                  value={profile.kelas}
                  onChange={handleChange}
                  placeholder="XII RPL 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
                />
              </div>

              <div>
                <label htmlFor="prof-jurusan" className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kompetensi Keahlian
                </label>
                <input
                  id="prof-jurusan"
                  name="jurusan"
                  type="text"
                  value={profile.jurusan}
                  onChange={handleChange}
                  placeholder="Rekayasa Perangkat Lunak"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label htmlFor="prof-instansi" className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Tempat PKL / Industri
                </label>
                <input
                  id="prof-instansi"
                  name="nama_instansi"
                  type="text"
                  value={profile.nama_instansi}
                  onChange={handleChange}
                  placeholder="PT Telekomunikasi Indonesia"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
                />
              </div>

              <div>
                <label htmlFor="prof-pembimbing" className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Pembimbing Industri (DUDI)
                </label>
                <input
                  id="prof-pembimbing"
                  name="pembimbing_instansi"
                  type="text"
                  value={profile.pembimbing_instansi}
                  onChange={handleChange}
                  placeholder="Nama pembimbing di tempat magang"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label htmlFor="prof-phone" className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nomor HP / WhatsApp
                </label>
                <input
                  id="prof-phone"
                  name="no_hp"
                  type="text"
                  value={profile.no_hp}
                  onChange={handleChange}
                  placeholder="08123456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:bg-white focus:border-[#0c2340]"
                />
              </div>

              <div>
                <label htmlFor="prof-address" className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Alamat Tempat Tinggal
                </label>
                <input
                  id="prof-address"
                  name="alamat"
                  type="text"
                  value={profile.alamat}
                  onChange={handleChange}
                  placeholder="Jl. ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#0c2340]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tombol Simpan Perubahan */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={Save}
          >
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

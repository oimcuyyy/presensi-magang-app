import React, { useState, useEffect } from 'react';
import { User, Building2, MapPin, Phone, GraduationCap, Save, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import api from '../services/api';

const Profile = () => {
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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/profile');
      const data = response.data.data;
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
      setError('Gagal memuat profil. Silakan coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // Validasi: Angka hanya untuk angka, huruf hanya untuk huruf
    if (name === 'no_hp') {
      // Hanya izinkan angka 0-9
      sanitizedValue = value.replace(/[^0-9]/g, '');
    } else if (name === 'jurusan' || name === 'pembimbing_instansi') {
      // Hanya izinkan huruf, spasi, dan tanda baca gelar (titik, koma, tanda petik)
      sanitizedValue = value.replace(/[^a-zA-Z\s.,'"]/g, '');
    }
    // Untuk nama_instansi, kelas, dan alamat kita biarkan bebas karena bisa mengandung kombinasi angka & huruf (misal: "PT. Telkom 2", "XII TKJ 1", "Jl. Mawar No 10")

    setProfile(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran foto terlalu besar. Maksimal 2MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result);
        setProfile(prev => ({ ...prev, photo_url: reader.result }));
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
      setMessage(response.data.message);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan saat menyimpan profil.');
      }
    } finally {
      setIsSaving(false);
      // Hapus pesan sukses setelah 3 detik
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Profil Saya
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Lengkapi data diri dan informasi tempat magang Anda.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-2 text-sm font-medium shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center gap-2 text-sm font-medium shadow-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
          
          <div className="px-4 py-6 sm:p-8">
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              
              <div className="sm:col-span-full mb-4 flex flex-col items-center justify-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white shadow-lg relative">
                    {previewPhoto ? (
                      <img src={previewPhoto} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-gray-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    )}
                    <label htmlFor="photo-upload" className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Ubah Foto</span>
                    </label>
                  </div>
                  <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
                <p className="mt-3 text-xs text-gray-500 text-center">Pas Foto / Selfie (Opsional)<br/>Maksimal 2MB, format JPG/PNG</p>
              </div>

              <div className="sm:col-span-4">
                <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-gray-500" /> Informasi Akun
                </h3>
                <p className="text-sm leading-6 text-gray-500 mb-4">Nama dan email akun tidak dapat diubah di sini.</p>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900">Nama Lengkap</label>
                <div className="mt-2">
                  <input type="text" value={profile.name} disabled className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 sm:text-sm sm:leading-6 cursor-not-allowed" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900">Email Address</label>
                <div className="mt-2">
                  <input type="email" value={profile.email} disabled className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 sm:text-sm sm:leading-6 cursor-not-allowed" />
                </div>
              </div>

              <div className="sm:col-span-full border-t border-gray-100 pt-8 mt-2">
                <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center gap-2 mb-1">
                  <GraduationCap className="w-5 h-5 text-gray-500" /> Biodata Siswa
                </h3>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="nisn" className="block text-sm font-medium leading-6 text-gray-900">NIS / NISN</label>
                <div className="mt-2">
                  <input type="text" name="nisn" id="nisn" value={profile.nisn} disabled className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-200 bg-gray-50 sm:text-sm sm:leading-6 cursor-not-allowed" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="kelas" className="block text-sm font-medium leading-6 text-gray-900">Kelas</label>
                <div className="mt-2">
                  <input type="text" name="kelas" id="kelas" value={profile.kelas} onChange={handleChange} placeholder="Contoh: XII TKJ 1" className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="jurusan" className="block text-sm font-medium leading-6 text-gray-900">Jurusan</label>
                <div className="mt-2">
                  <input type="text" name="jurusan" id="jurusan" value={profile.jurusan} onChange={handleChange} placeholder="Contoh: Teknik Komputer" className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="no_hp" className="block text-sm font-medium leading-6 text-gray-900 flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400"/> No. HP / WhatsApp</label>
                <div className="mt-2">
                  <input type="tel" name="no_hp" id="no_hp" value={profile.no_hp} onChange={handleChange} placeholder="08xxxxxxxxxx" className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6" />
                </div>
              </div>

              <div className="sm:col-span-full">
                <label htmlFor="alamat" className="block text-sm font-medium leading-6 text-gray-900 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400"/> Alamat Rumah Lengkap</label>
                <div className="mt-2">
                  <textarea name="alamat" id="alamat" rows={3} value={profile.alamat} onChange={handleChange} placeholder="Masukkan alamat domisili saat ini" className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6" />
                </div>
              </div>

              <div className="sm:col-span-full border-t border-gray-100 pt-8 mt-2">
                <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center gap-2 mb-1">
                  <Building2 className="w-5 h-5 text-gray-500" /> Tempat Magang (Prakerin)
                </h3>
                <p className="text-sm leading-6 text-gray-500 mb-4">Informasi mengenai perusahaan atau instansi tempat Anda melaksanakan PKL.</p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="nama_instansi" className="block text-sm font-medium leading-6 text-gray-900">Nama Perusahaan / Instansi</label>
                <div className="mt-2">
                  <input type="text" name="nama_instansi" id="nama_instansi" value={profile.nama_instansi} onChange={handleChange} placeholder="Contoh: PT. Telekomunikasi Indonesia" className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="pembimbing_instansi" className="block text-sm font-medium leading-6 text-gray-900">Nama Pembimbing Perusahaan</label>
                <div className="mt-2">
                  <input type="text" name="pembimbing_instansi" id="pembimbing_instansi" value={profile.pembimbing_instansi} onChange={handleChange} placeholder="Bpk/Ibu pembimbing lapangan" className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6" />
                </div>
              </div>

            </div>
          </div>
          
          <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8 bg-gray-50">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4"/> Simpan Profil</>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
};

export default Profile;

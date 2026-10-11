import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  Maximize2,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  Building,
  User,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { BrandMark } from '../components/BrandLogo';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';

// 1D Barcode NISN Component (Vector SVG presisi)
const Barcode1D = ({ value = '1234567890', height = 34 }) => {
  const bars = [];
  const chars = value.split('');
  for (let i = 0; i < 46; i++) {
    const charCode = (chars[i % chars.length]?.charCodeAt(0) || 50) + i;
    const isThick = charCode % 3 === 0;
    const isSpace = charCode % 5 === 0 && i > 2 && i < 43;
    bars.push({ isSpace, width: isThick ? 2.4 : 1.2 });
  }

  return (
    <div className="flex flex-col items-center">
      <svg height={height} className="w-full max-w-[190px]" viewBox="0 0 100 28" preserveAspectRatio="none">
        <rect width="100" height="28" fill="white" />
        {bars.map((bar, idx) => {
          if (bar.isSpace) return null;
          const x = idx * 2.2;
          return <rect key={idx} x={x} y="0" width={bar.width} height="28" fill="#0c2340" />;
        })}
      </svg>
      <span className="font-mono text-[9px] tracking-[0.2em] text-slate-800 font-bold mt-0.5">
        *{value}*
      </span>
    </div>
  );
};

const StudentCard = () => {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('user_id');

  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    fetchCardData();
  }, [userIdParam]);

  const fetchCardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = userIdParam ? `/attendances/card-data?user_id=${userIdParam}` : '/attendances/card-data';
      const res = await api.get(url);
      setStudent(res.data.data);
    } catch (err) {
      console.error('Failed to fetch card data:', err);
      setError(err.response?.data?.message || 'Gagal memuat kartu siswa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-8 h-8 border-3 border-[#0c2340] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 text-xs font-semibold">Memuat kartu siswa...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-sm text-center space-y-4">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Kartu Tidak Ditemukan</h2>
            <p className="text-xs text-slate-500 mt-1">{error || 'Data siswa belum terdaftar.'}</p>
          </div>
          <Button variant="primary" size="sm" onClick={fetchCardData} className="w-full">
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }

  const photoUrl = student.photo
    ? (student.photo.startsWith('http') ? student.photo : `${import.meta.env.VITE_BACKEND_URL || ''}${student.photo}`)
    : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Halaman (Disembunyikan saat cetak) */}
      <div className="print:hidden">
        <PageHeader
          title="Kartu Siswa"
          description="Tunjukkan kartu ini kepada guru atau petugas piket untuk dipindai saat presensi."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={QrCode}
                onClick={() => setIsZoomModalOpen(true)}
              >
                Perbesar Barcode
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Printer}
                onClick={handlePrint}
              >
                Cetak Kartu
              </Button>
            </div>
          }
        />
      </div>

      {/* Kontrol Sisi Kartu (Depan / Belakang) */}
      <div className="flex justify-center print:hidden">
        <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1">
          <button
            type="button"
            onClick={() => setIsFlipped(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isFlipped ? 'bg-white text-[#0c2340] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Depan
          </button>
          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isFlipped ? 'bg-white text-[#0c2340] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Belakang
          </button>
        </div>
      </div>

      {/* Kartu Siswa 3D Flip Container (CR80 Aspect Ratio) */}
      <div className="max-w-md mx-auto perspective-1000 print:max-w-none">
        <div
          className={`relative w-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ minHeight: '480px' }}
        >
          {/* ─── SISI DEPAN (IDENTITAS SISWA) ────────────────────────── */}
          <div
            className={`w-full bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-300 overflow-hidden p-6 flex flex-col justify-between backface-hidden print:shadow-none print:border-slate-500 print:rounded-xl`}
            style={{ minHeight: '480px' }}
          >
            {/* Header Resmi Kartu */}
            <div className="border-b-2 border-[#0c2340] pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BrandMark size={38} />
                  <div className="leading-tight">
                    <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">
                      DINAS PENDIDIKAN PROVINSI DKI JAKARTA
                    </p>
                    <h2 className="text-xs font-black tracking-tight text-[#0c2340]">
                      SMK NEGERI 20 JAKARTA
                    </h2>
                    <p className="text-[9px] font-extrabold text-[#d97706] uppercase tracking-tight">
                      KARTU IDENTITAS SISWA PKL
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                  Aktif PKL
                </span>
              </div>
            </div>

            {/* Foto dan Biodata Siswa */}
            <div className="my-4 grid grid-cols-[100px_1fr] gap-4 items-center">
              {/* Foto Siswa */}
              <div className="relative">
                <div className="w-[100px] h-[130px] rounded-xl overflow-hidden bg-slate-100 border-2 border-[#0c2340] shadow-sm flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0c2340&color=fff&size=256`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                      <User className="w-8 h-8 mb-1" />
                      <span className="text-[9px] font-bold uppercase">Pas Foto</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 bg-[#0c2340] text-amber-400 rounded-full p-1 shadow border border-white">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Detail Identitas */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Nama Siswa
                  </span>
                  <p className="font-extrabold text-slate-900 leading-tight">
                    {student.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      NISN
                    </span>
                    <p className="font-mono font-bold text-slate-800">
                      {student.nisn || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Kelas
                    </span>
                    <p className="font-bold text-slate-800">
                      {student.kelas || '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Jurusan / Kompetensi
                  </span>
                  <p className="font-semibold text-slate-700 leading-snug">
                    {student.jurusan || '-'}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Tempat PKL
                  </span>
                  <p className="font-bold text-slate-900 leading-snug">
                    {student.nama_instansi || 'Belum Ditentukan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian Barcode & QR Code Pemindaian Cepat */}
            <div className="pt-3 border-t border-slate-200 grid grid-cols-[1fr_84px] gap-3 items-center">
              <div>
                <Barcode1D value={student.nisn || '1234567890'} height={32} />
              </div>
              <div className="flex flex-col items-center">
                <div className="p-1.5 bg-white border border-slate-300 rounded-lg shadow-xs">
                  <QRCodeSVG
                    value={student.qr_token || `PRESENSI:${student.id}:${student.nisn}`}
                    size={68}
                    level="M"
                  />
                </div>
                <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Scan QR</span>
              </div>
            </div>
          </div>

          {/* ─── SISI BELAKANG (KETENTUAN PENGGUNAAN) ─────────────────── */}
          <div
            className={`w-full bg-[#0c2340] text-white rounded-2xl shadow-xl border border-slate-700 p-6 flex flex-col justify-between backface-hidden rotate-y-180 absolute inset-0 print:hidden`}
            style={{ minHeight: '480px' }}
          >
            <div>
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <BrandMark size={32} />
                <span className="text-[10px] font-mono text-slate-400">SMKN 20 JAKARTA</span>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-200">
                <h3 className="font-bold text-amber-400 uppercase text-[11px] tracking-wider">
                  Ketentuan Kartu PKL
                </h3>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                  <li>Kartu ini adalah identitas resmi siswa selama menjalani Praktik Kerja Lapangan.</li>
                  <li>Wajib dibawa setiap hari dan ditunjukkan kepada guru pembimbing saat kunjungan.</li>
                  <li>Barcode dan QR Code digunakan untuk pencatatan presensi di pos sekolah/industri mitra.</li>
                  <li>Bila kartu hilang atau rusak, segera hubungi wali kelas atau admin PKL.</li>
                </ol>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-center text-[10px] text-slate-400">
              <p className="font-semibold text-slate-300">SMK Negeri 20 Jakarta</p>
              <p className="mt-0.5">Jl. Melati No. 24, Cilandak, Jakarta Selatan</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL PERBESAR BARCODE (LAYAR PENUH BRIGHTNESS TINGGI) ──── */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 animate-fadeIn">
          {/* Tombol Tutup */}
          <button
            type="button"
            onClick={() => setIsZoomModalOpen(false)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95"
            aria-label="Tutup barcode layar penuh"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center text-white mb-6">
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="font-mono text-sm text-slate-400 mt-1">NISN: {student.nisn}</p>
          </div>

          {/* QR Code Sangat Besar & Kontras Maksimal */}
          <div className="p-6 bg-white rounded-3xl shadow-2xl flex flex-col items-center max-w-xs w-full">
            <QRCodeSVG
              value={student.qr_token || `PRESENSI:${student.id}:${student.nisn}`}
              size={240}
              level="H"
            />
            <div className="mt-6 w-full">
              <Barcode1D value={student.nisn || '1234567890'} height={42} />
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-6 text-center max-w-xs">
            Arahkan layar ini ke kamera scanner guru atau petugas piket.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentCard;

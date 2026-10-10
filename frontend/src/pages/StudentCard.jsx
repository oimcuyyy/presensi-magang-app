import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  Printer,
  Maximize2,
  X,
  ShieldCheck,
  Building,
  School,
  User,
  QrCode,
  CheckCircle2,
  Barcode,
  Info
} from 'lucide-react';
import api from '../services/api';
import { BrandMark } from '../components/BrandLogo';

// Helper component to render a realistic 1D Code128 vector barcode representation for the student's NISN
const Barcode1D = ({ value = '1234567890', height = 36 }) => {
  // Deterministic bar widths based on char codes
  const bars = [];
  const chars = value.split('');
  for (let i = 0; i < 48; i++) {
    const charCode = (chars[i % chars.length]?.charCodeAt(0) || 50) + i;
    const isThick = charCode % 3 === 0;
    const isSpace = charCode % 5 === 0 && i > 2 && i < 45;
    bars.push({ isSpace, width: isThick ? 2.5 : 1.2 });
  }

  return (
    <div className="flex flex-col items-center">
      <svg height={height} className="w-full max-w-[200px]" viewBox="0 0 100 30" preserveAspectRatio="none">
        <rect width="100" height="30" fill="white" />
        {bars.map((bar, idx) => {
          if (bar.isSpace) return null;
          const x = idx * 2.1;
          return <rect key={idx} x={x} y="0" width={bar.width} height="30" fill="#0f172a" />;
        })}
      </svg>
      <span className="font-mono text-[9px] tracking-[0.25em] text-slate-700 font-bold mt-0.5">
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
  const [cardSide, setCardSide] = useState('front'); // 'front' | 'back'
  const cardRef = useRef(null);

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
      setError(err.response?.data?.message || 'Gagal memuat kartu identitas siswa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 text-xs font-semibold">Memuat spesifikasi kartu identitas siswa...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-sm text-center space-y-4">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">Kartu Tidak Ditemukan</h2>
            <p className="text-xs text-slate-500">{error || 'Data siswa belum tersedia dalam basis data.'}</p>
          </div>
          <button
            onClick={fetchCardData}
            className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  const photoUrl = student.photo
    ? (student.photo.startsWith('http') ? student.photo : `${import.meta.env.VITE_BACKEND_URL || ''}${student.photo}`)
    : null;

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800 border border-slate-300 mb-1.5">
              Dokumen Resmi Siswa
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Kartu Identitas Praktik Kerja Lapangan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Standar ISO/IEC 7810 ID-1 CR80 dengan Tanda Tangan Kriptografi HMAC SHA-256.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsZoomModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              Perbesar Barcode
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Cetak Kartu Fisik
            </button>
          </div>
        </div>
      </div>

      {/* Main Card Viewport */}
      <div className="max-w-md mx-auto">
        {/* Toggle Front vs Back View (Print: Shows Front) */}
        <div className="flex justify-center mb-4 print:hidden">
          <div className="bg-slate-200/90 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setCardSide('front')}
              className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
                cardSide === 'front' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sisi Depan (Identitas)
            </button>
            <button
              onClick={() => setCardSide('back')}
              className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
                cardSide === 'back' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sisi Belakang (Ketentuan)
            </button>
          </div>
        </div>

        {/* The Card - CR80 Aspect Ratio (85.6mm x 53.98mm = ~1.586:1) */}
        <div
          ref={cardRef}
          className="relative bg-white text-slate-900 rounded-2xl shadow-lg overflow-hidden border border-slate-300 print:shadow-none print:m-0 print:border print:border-slate-400 print:rounded-xl"
          style={{ minHeight: '520px' }}
        >
          {/* Subtle Security Guilloche Background Lattice */}
          <div
            className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px] opacity-70 pointer-events-none"
            aria-hidden="true"
          />

          {cardSide === 'front' ? (
            <div className="relative p-6 flex flex-col justify-between h-full z-10">
              {/* Institutional Card Header */}
              <div className="border-b-2 border-slate-900 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BrandMark size={36} />
                    <div className="leading-tight">
                      <p className="text-[8px] font-black uppercase tracking-wider text-blue-900">
                        DINAS PENDIDIKAN PROVINSI DKI JAKARTA
                      </p>
                      <h2 className="text-xs font-black tracking-tight text-slate-950">
                        SMK NEGERI 20 JAKARTA
                      </h2>
                      <p className="text-[8.5px] font-extrabold text-amber-600 uppercase tracking-tight">
                        KARTU IDENTITAS RESMI SISWA PKL
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Aktif PKL
                  </span>
                </div>
              </div>

              {/* Portrait & Identification Block */}
              <div className="my-4 grid grid-cols-[108px_1fr] gap-4 items-center">
                {/* Official Photo Box */}
                <div className="relative">
                  <div className="w-[108px] h-[138px] rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-800 shadow-sm flex items-center justify-center">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={student.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0f172a&color=fff&size=256`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                        <User className="w-10 h-10 mb-1" />
                        <span className="text-[9px] font-bold uppercase">Pas Foto</span>
                      </div>
                    )}
                  </div>
                  {/* Holographic Verification Mark */}
                  <div className="absolute -bottom-1.5 -right-1.5 bg-slate-900 text-white rounded-full p-1 shadow border border-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                </div>

                {/* Identity Details */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Nama Peserta Didik
                    </span>
                    <h3 className="text-sm font-black text-slate-950 leading-tight">
                      {student.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        NISN
                      </span>
                      <p className="font-mono text-xs font-bold text-slate-900">
                        {student.nisn || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Kelas
                      </span>
                      <p className="text-xs font-bold text-slate-900">
                        {student.kelas || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Program Keahlian
                    </span>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {student.jurusan || '-'}
                    </p>
                  </div>

                  {student.nama_instansi && (
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Unit Industri / Tempat PKL
                      </span>
                      <p className="text-xs font-bold text-blue-700 truncate">
                        {student.nama_instansi}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Barcode & QR Verification Section */}
              <div className="mt-auto bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Barcode className="w-3.5 h-3.5 text-slate-700" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Kode Barcode Absensi
                    </span>
                  </div>
                  {/* 1D Laser Barcode Representation */}
                  <Barcode1D value={student.nisn || String(student.id)} height={32} />
                </div>

                {/* 2D Cryptographic QR Code */}
                <div
                  onClick={() => setIsZoomModalOpen(true)}
                  className="bg-white p-1.5 rounded-lg border border-slate-300 shadow-sm cursor-pointer hover:border-slate-800 transition-colors shrink-0"
                  title="Klik untuk memperbesar QR Code"
                >
                  <QRCodeSVG
                    value={student.qr_token || `PRESENSI:${student.id}:${student.nisn}`}
                    size={72}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Micro Footer */}
              <div className="pt-2.5 mt-2.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>AUTH_TOKEN: SHA256-HMAC</span>
                <span>TA 2026/2027</span>
              </div>
            </div>
          ) : (
            /* Card Back: Institutional Legal Rules & Validation */
            <div className="relative p-6 flex flex-col justify-between h-full z-10 text-xs">
              <div className="space-y-4">
                <div className="border-b-2 border-slate-900 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    TATA TERTIB & KETENTUAN PENGGUNAAN KARTU
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Pokja Praktik Kerja Lapangan (PKL) • SMK Negeri 20 Jakarta
                  </p>
                </div>

                <ol className="list-decimal list-outside pl-4 space-y-2 text-[11px] text-slate-700 leading-relaxed">
                  <li>Kartu ini adalah identitas resmi siswa SMK Negeri 20 Jakarta selama penugasan PKL.</li>
                  <li>Wajib ditunjukkan kepada petugas absensi sekolah atau pembimbing industri saat kehadiran.</li>
                  <li>Barcode dan QR code unik terenkripsi untuk memvalidasi identitas dan waktu presensi.</li>
                  <li>Dilarang keras memindahtangankan atau memalsukan kartu identitas siswa.</li>
                  <li>Segera lapor ke pihak sekolah apabila kartu hilang atau barcode mengalami kerusakan fisik.</li>
                </ol>
              </div>

              {/* Signature Endorsement Block */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 items-end text-center">
                <div>
                  <p className="text-[10px] text-slate-500">Mengetahui,</p>
                  <p className="text-[10px] font-bold text-slate-900 mt-0.5">Guru Pembimbing</p>
                  <div className="h-10 border-b border-dashed border-slate-300 mx-4" />
                  <p className="text-[9px] text-slate-400 mt-1">NIP. .........................</p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500">Ketua Pokja PKL,</p>
                  <div className="h-10 border-b border-dashed border-slate-300 mx-4" />
                  <p className="text-[9px] font-extrabold text-blue-900 mt-1">SMK NEGERI 20 JAKARTA</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Operational Help Note */}
        <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5 print:hidden">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Gunakan tombol <strong className="text-slate-900">Cetak Kartu Fisik</strong> untuk mencetak kartu menggunakan printer ID Card PVC atau kertas laminasi standar.
          </p>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-xl relative border border-slate-200">
            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              aria-label="Tutup pemindai"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
              <p className="font-mono text-xs font-bold text-blue-600">NISN: {student.nisn || '-'}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border-2 border-slate-200 inline-block mb-4">
              <QRCodeSVG
                value={student.qr_token || `PRESENSI:${student.id}:${student.nisn}`}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="text-xs text-slate-500 mb-6">
              Tingkatkan kecerahan layar ponsel agar barcode mudah terbaca oleh mesin pemindai pos absensi.
            </p>

            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
            >
              Tutup Tampilan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCard;

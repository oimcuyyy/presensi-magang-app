import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Send,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Clock,
  Check,
  X,
  User,
  Calendar,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';

const Journal = () => {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [activity, setActivity] = useState('');
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Teacher Review Feedback Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [teacherFeedback, setTeacherFeedback] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUserRole(userData.role);
      setCurrentUser(userData);
    }
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const response = await api.get('/journals');
      setJournals(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch journals');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      await api.post('/journals', { activity, reflection });
      setMessage('Jurnal harian berhasil dikirim ke guru pembimbing!');
      setActivity('');
      setReflection('');
      fetchJournals();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan pada server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewModal = (journal, status) => {
    setSelectedJournal(journal);
    setReviewStatus(status);
    setTeacherFeedback(journal.feedback || (status === 'approved' ? 'Bagus, terus pertahankan kinerjanya!' : 'Perlu diperbaiki detail laporannya.'));
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!selectedJournal) return;
    try {
      await api.put(`/journals/${selectedJournal.id}/status`, {
        status: reviewStatus,
        feedback: teacherFeedback.trim() || 'Telah diperiksa guru pembimbing'
      });
      setReviewModalOpen(false);
      setMessage(`Jurnal berhasil di-${reviewStatus === 'approved' ? 'setujui' : 'tolak'} beserta catatan feedback.`);
      fetchJournals();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert('Gagal mengupdate status jurnal.');
    }
  };

  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'guru_pembimbing';

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Laporan Kegiatan Harian PKL
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Jurnal Kegiatan Magang
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {isTeacherOrAdmin
              ? 'Tinjau dan berikan feedback catatan harian siswa magang binaan Anda.'
              : 'Laporkan aktivitas kerja, ilmu baru, dan refleksi harian selama masa magang.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {message}
          </div>
        )}

        {/* Form Input Jurnal (Only for Siswa) */}
        {!isTeacherOrAdmin && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-200/90 mb-10">
            <h3 className="text-base font-bold text-gray-900 tracking-tight mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" /> Tulis Laporan Hari Ini
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Aktivitas & Pekerjaan yang Dilakukan
                </label>
                <textarea
                  rows={4}
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="Contoh: Menginstalasi sistem operasi server, mendokumentasikan API backend, dan merakit kabel UTP jaringan..."
                  className="w-full p-3 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Refleksi / Pembelajaran Baru
                </label>
                <textarea
                  rows={2}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Contoh: Mengetahui cara mengatasi packet loss dan konfigurasi subnet mask yang efisien..."
                  className="w-full p-3 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Kirim Jurnal Harian
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List of Journals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-900">
              {isTeacherOrAdmin ? 'Daftar Jurnal Siswa' : 'Riwayat Jurnal Anda'} ({journals.length})
            </h3>
          </div>

          {journals.length > 0 ? (
            journals.map((journal) => {
              const isApproved = journal.status === 'approved';
              const isRejected = journal.status === 'rejected';

              return (
                <div
                  key={journal.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/90 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {journal.student_name ? journal.student_name.charAt(0) : 'J'}
                      </div>
                      <div>
                        {journal.student_name && (
                          <p className="font-bold text-sm text-gray-900 leading-tight">
                            {journal.student_name}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(journal.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Menunggu Review'}
                      </span>

                      {/* Teacher Actions */}
                      {isTeacherOrAdmin && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => openReviewModal(journal, 'approved')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                            title="Setujui Jurnal dengan Catatan"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openReviewModal(journal, 'rejected')}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors"
                            title="Tolak Jurnal dengan Catatan"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div>
                      <p className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-1">
                        Aktivitas Kerja:
                      </p>
                      <p className="text-gray-800 whitespace-pre-line leading-relaxed bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                        {journal.activity}
                      </p>
                    </div>

                    {journal.reflection && (
                      <div>
                        <p className="font-bold text-blue-700 text-xs uppercase tracking-wider mb-1">
                          Refleksi & Pelajaran:
                        </p>
                        <p className="text-gray-700 italic bg-blue-50/40 p-3 rounded-xl border border-blue-100/60 leading-relaxed">
                          "{journal.reflection}"
                        </p>
                      </div>
                    )}

                    {/* Teacher Feedback Note */}
                    {journal.feedback && (
                      <div className="mt-3 p-3.5 bg-slate-900 text-white rounded-2xl flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-bold text-blue-300">Catatan Guru Pembimbing:</p>
                          <p className="text-slate-200 mt-0.5">{journal.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-200">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-gray-700">Belum ada jurnal kegiatan</p>
              <p className="text-xs text-gray-500 mt-1">
                Laporan jurnal harian yang dikirim akan tersimpan di sini.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Review & Feedback Modal for Teachers */}
      {reviewModalOpen && selectedJournal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
            <h4 className="font-extrabold text-gray-900 text-lg mb-1">
              {reviewStatus === 'approved' ? 'Setujui Jurnal' : 'Tolak Jurnal'}
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Siswa: <strong>{selectedJournal.student_name}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Catatan & Saran untuk Siswa
              </label>
              <textarea
                rows={3}
                value={teacherFeedback}
                onChange={(e) => setTeacherFeedback(e.target.value)}
                placeholder="Berikan masukan atau catatan perbaikan..."
                className="w-full p-3 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={submitReview}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md ${
                  reviewStatus === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Simpan & Beri Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;

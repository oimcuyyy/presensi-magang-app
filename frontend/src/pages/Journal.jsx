import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  X,
  User,
  Calendar,
  MessageSquare,
  Edit3
} from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const Journal = () => {
  const [journals, setJournals] = useState([]);
  const [activity, setActivity] = useState('');
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('');

  // Teacher Review Feedback Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUserRole(userData.role);
    }

    // Muat draft tersimpan untuk siswa
    const savedDraft = localStorage.getItem('journal_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setActivity(parsed.activity || '');
        setReflection(parsed.reflection || '');
      } catch (e) {
        // Abaikan
      }
    }

    fetchJournals();
  }, []);

  // Simpan draft otomatis ke localStorage
  useEffect(() => {
    if (userRole === 'siswa' && (activity || reflection)) {
      localStorage.setItem('journal_draft', JSON.stringify({ activity, reflection }));
    }
  }, [activity, reflection, userRole]);

  const fetchJournals = async () => {
    try {
      const response = await api.get('/journals');
      setJournals(response.data.data || []);
    } catch (err) {
      console.error('Gagal memuat daftar jurnal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activity.trim().length < 10) {
      setError('Catatan aktivitas minimal 10 karakter.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      await api.post('/journals', { activity, reflection });
      setMessage('Jurnal berhasil dikirim ke guru pembimbing!');
      setActivity('');
      setReflection('');
      localStorage.removeItem('journal_draft');
      fetchJournals();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kendala saat mengirimkan jurnal.');
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewModal = (journal, status) => {
    setSelectedJournal(journal);
    setReviewStatus(status);
    setTeacherFeedback(
      journal.feedback ||
      (status === 'approved'
        ? 'Bagus, terus pertahankan kinerjanya!'
        : 'Perlu diperbaiki dan dilengkapi detail laporannya.')
    );
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!selectedJournal) return;
    setIsSubmittingReview(true);
    try {
      await api.put(`/journals/${selectedJournal.id}`, {
        status: reviewStatus,
        feedback: teacherFeedback.trim() || 'Telah diperiksa oleh guru pembimbing'
      });
      setReviewModalOpen(false);
      setMessage(`Jurnal berhasil di-${reviewStatus === 'approved' ? 'setujui' : 'minta revisi'}.`);
      fetchJournals();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert('Gagal mengupdate status jurnal.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'guru_pembimbing';
  const isFormValid = activity.trim().length >= 10;

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={isTeacherOrAdmin ? 'Jurnal Siswa' : 'Jurnal'}
        description={
          isTeacherOrAdmin
            ? 'Evaluasi catatan harian siswa magang dan berikan bimbingan tertulis.'
            : 'Tuliskan aktivitas dan pembelajaran yang kamu peroleh hari ini di tempat magang.'
        }
      />

      {/* Banner Pesan Sukses / Error */}
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

      {/* ─── FORMULIR JURNAL (KHUSUS SISWA) ─────────────────────── */}
      {!isTeacherOrAdmin && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Jurnal Hari Ini
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              Tersimpan otomatis sebagai draft
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="activity-input"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Apa yang kamu kerjakan hari ini? <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {activity.length} karakter (min. 10)
                </span>
              </div>
              <textarea
                id="activity-input"
                rows={4}
                required
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Ceritakan tugas, proyek, atau pekerjaan yang kamu selesaikan hari ini..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10 outline-none resize-none leading-relaxed"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="reflection-input"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Apa ilmu atau keterampilan baru yang kamu pelajari?
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {reflection.length} karakter
                </span>
              </div>
              <textarea
                id="reflection-input"
                rows={3}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Tuliskan wawasan baru, kendala yang dihadapi, atau cara kamu menyelesaikannya..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10 outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={!isFormValid || isLoading}
                leftIcon={Send}
                className="sm:w-auto w-full"
              >
                Kirim Jurnal
              </Button>

              {!isFormValid && (
                <span className="text-[11px] text-slate-500">
                  Isi catatan aktivitas minimal 10 karakter untuk mengirim.
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ─── TIMELINE / DAFTAR RIWAYAT JURNAL ────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          {isTeacherOrAdmin ? 'Daftar Jurnal Siswa' : 'Riwayat Jurnal'}
        </h2>

        {journals.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs font-semibold">Belum ada jurnal yang tercatat.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {journals.map((journal) => {
              const isApproved = journal.status === 'approved';
              const isRejected = journal.status === 'rejected';

              return (
                <div
                  key={journal.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  {/* Header Item */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0c2340] text-white font-mono font-bold flex flex-col items-center justify-center text-[10px] leading-tight shrink-0">
                        <span>{journal.date ? new Date(journal.date).getDate() : '-'}</span>
                        <span className="text-[8px] text-slate-300">
                          {journal.date ? new Date(journal.date).toLocaleDateString('id-ID', { month: 'short' }) : ''}
                        </span>
                      </div>
                      <div>
                        {/* Nama Siswa HANYA ditampilkan di dashboard Guru/Admin */}
                        {isTeacherOrAdmin && journal.student_name && (
                          <p className="font-bold text-slate-900 text-xs">
                            {journal.student_name}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 font-medium">
                          {journal.date
                            ? new Date(journal.date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Badge
                        size="sm"
                        status={isApproved ? 'hadir' : isRejected ? 'ditolak' : 'menunggu'}
                      >
                        {isApproved ? 'Disetujui Guru' : isRejected ? 'Perlu Revisi' : 'Menunggu Guru'}
                      </Badge>
                    </div>
                  </div>

                  {/* Isi Aktivitas & Refleksi */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Aktivitas Pekerjaan
                      </span>
                      <p className="mt-0.5 text-slate-800 leading-relaxed font-medium">
                        {journal.activity}
                      </p>
                    </div>

                    {journal.reflection && (
                      <div className="pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Ilmu / Keterampilan yang Dipelajari
                        </span>
                        <p className="mt-0.5 text-slate-700 leading-relaxed italic">
                          "{journal.reflection}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Catatan / Feedback Guru Pembimbing */}
                  {journal.feedback && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 text-[11px]">
                          Catatan Guru Pembimbing:
                        </span>
                        <p className="mt-0.5 text-slate-600 leading-relaxed">
                          {journal.feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Aksi Guru: Setujui / Revisi */}
                  {isTeacherOrAdmin && (
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/60">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={X}
                        onClick={() => openReviewModal(journal, 'rejected')}
                      >
                        Minta Revisi
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={Check}
                        onClick={() => openReviewModal(journal, 'approved')}
                      >
                        Setujui Jurnal
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL REVIEW GURU ───────────────────────────────────── */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewStatus === 'approved' ? 'Setujui Jurnal Siswa' : 'Minta Revisi Jurnal'}
        description="Berikan bimbingan atau catatan evaluasi untuk siswa bersangkutan."
      >
        <div className="space-y-4 text-xs">
          {selectedJournal && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">{selectedJournal.student_name}</p>
              <p className="text-slate-600 mt-1 line-clamp-3">"{selectedJournal.activity}"</p>
            </div>
          )}

          <div>
            <label
              htmlFor="feedback-textarea"
              className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Catatan Umpan Balik Guru
            </label>
            <textarea
              id="feedback-textarea"
              rows={4}
              value={teacherFeedback}
              onChange={(e) => setTeacherFeedback(e.target.value)}
              placeholder="Tuliskan masukan untuk siswa..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-[#0c2340] outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setReviewModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant={reviewStatus === 'approved' ? 'primary' : 'accent'}
              size="md"
              isLoading={isSubmittingReview}
              onClick={submitReview}
            >
              {reviewStatus === 'approved' ? 'Simpan & Setujui' : 'Kirim Catatan Revisi'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Journal;

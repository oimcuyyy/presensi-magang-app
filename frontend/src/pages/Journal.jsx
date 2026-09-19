import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUserRole(userData.role);
    }
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const response = await api.get('/journals');
      setJournals(response.data.data);
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
      setMessage('Jurnal harian berhasil dikirim!');
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

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/journals/${id}/status`, { status, feedback: 'Telah diperiksa' });
      fetchJournals();
    } catch (err) {
      alert('Gagal mengupdate status jurnal');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Jurnal Harian
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Laporkan aktivitas dan pencapaian harian Anda selama magang.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-md bg-green-50 p-4" role="status">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{message}</h3>
              </div>
            </div>
          </div>
        )}

        {userRole === 'siswa' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-50 text-gray-600 rounded-md border border-gray-200">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Tulis Jurnal Hari Ini</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="activity" className="block text-sm font-medium leading-6 text-gray-900">
                  Aktivitas Utama
                </label>
                <div className="mt-2">
                  <textarea
                    id="activity"
                    name="activity"
                    rows={4}
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    placeholder="Ceritakan apa saja yang Anda kerjakan hari ini..."
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="reflection" className="block text-sm font-medium leading-6 text-gray-900">
                  Refleksi / Catatan Pembelajaran (Opsional)
                </label>
                <div className="mt-2">
                  <textarea
                    id="reflection"
                    name="reflection"
                    rows={3}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Apa yang Anda pelajari hari ini? Apakah ada kendala?"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
                >
                  <Send className="w-4 h-4" aria-hidden="true" /> 
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-lg font-semibold leading-6 text-gray-900 border-b border-gray-200 pb-2">Daftar Jurnal</h3>
          
          {journals.length > 0 ? (
            <div className="grid gap-6">
              {journals.map((journal) => (
                <div key={journal.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                      <div>
                        {userRole !== 'siswa' && <p className="text-sm font-medium text-blue-600 mb-1">{journal.student_name}</p>}
                        <p className="text-xs text-gray-500">{new Date(journal.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset self-start
                        ${journal.status === 'disetujui' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                          journal.status === 'ditolak' ? 'bg-red-50 text-red-700 ring-red-600/10' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'}`}>
                        {journal.status === 'submitted' ? 'Menunggu Review' : journal.status}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Aktivitas:</h4>
                    <p className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">{journal.activity}</p>
                    
                    {journal.reflection && (
                      <>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Refleksi:</h4>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap italic bg-gray-50 p-3 rounded-md border border-gray-200">{journal.reflection}</p>
                      </>
                    )}

                    {journal.feedback && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-xs font-medium text-gray-900 mb-1">Feedback Pembimbing:</p>
                          <p className="text-sm text-gray-700">{journal.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {userRole !== 'siswa' && journal.status === 'submitted' && (
                    <div className="flex sm:flex-row md:flex-col gap-3 shrink-0 md:w-32 justify-center mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-200">
                      <button 
                        onClick={() => handleUpdateStatus(journal.id, 'disetujui')}
                        className="flex-1 md:flex-none justify-center inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Setujui
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(journal.id, 'ditolak')}
                        className="flex-1 md:flex-none justify-center inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Belum ada jurnal</h3>
              <p className="mt-1 text-sm text-gray-500">Belum ada jurnal yang disubmit.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Journal;

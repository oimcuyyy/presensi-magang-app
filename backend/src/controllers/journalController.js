const db = require('../config/db');

// Siswa mensubmit jurnal harian
const createJournal = async (req, res) => {
  const { activity, reflection, attachment_url } = req.body;
  const user_id = req.user.id;
  const date = new Date().toISOString().split('T')[0];

  if (!activity) {
    return res.status(400).json({ message: 'Aktivitas jurnal wajib diisi.' });
  }

  try {
    await db.execute(
      'INSERT INTO daily_journals (user_id, date, activity, reflection, attachment_url, status) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, date, activity, reflection || null, attachment_url || null, 'submitted']
    );
    res.status(201).json({ message: 'Jurnal harian berhasil disubmit.' });
  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// Siswa melihat jurnalnya sendiri, Guru melihat semua jurnal anak didiknya
const getJournals = async (req, res) => {
  const { role, id: user_id } = req.user;

  try {
    let query = `
      SELECT j.*, u.name as student_name 
      FROM daily_journals j 
      JOIN users u ON j.user_id = u.id 
    `;
    let params = [];

    if (role === 'siswa') {
      query += 'WHERE j.user_id = ? ORDER BY j.date DESC';
      params.push(user_id);
    } else {
      // Jika guru_pembimbing, tampilkan semua jurnal (dalam konteks ini)
      query += 'ORDER BY j.date DESC';
    }

    const [journals] = await db.execute(query, params);
    res.json({ data: journals });
  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// Guru memberikan feedback dan mengubah status
const updateJournalStatus = async (req, res) => {
  const { id } = req.params;
  const { status, feedback } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status wajib diisi.' });
  }

  try {
    // Update jurnal
    await db.execute(
      'UPDATE daily_journals SET status = ?, feedback = ? WHERE id = ?',
      [status, feedback || null, id]
    );

    // Ambil user_id si pemilik jurnal untuk notifikasi otomatis
    const [journals] = await db.execute('SELECT user_id FROM daily_journals WHERE id = ?', [id]);
    
    if (journals.length > 0) {
      const studentId = journals[0].user_id;
      // Kirim notifikasi ke siswa
      await db.execute(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [studentId, 'Status Jurnal Diperbarui', `Jurnal harian Anda telah di-${status} oleh guru pembimbing.`]
      );
    }

    res.json({ message: 'Jurnal berhasil diperbarui.' });
  } catch (error) {
    console.error('Update journal error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = { createJournal, getJournals, updateJournalStatus };

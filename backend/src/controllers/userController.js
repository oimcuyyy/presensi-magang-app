const bcrypt = require('bcryptjs');
const db = require('../config/db');
const saveBase64Image = require('../utils/saveBase64Image');

// Get All Users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, name, email, role, nisn, created_at FROM users ORDER BY created_at DESC');
    res.json({ data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// Create a new User (Admin only)
const createUser = async (req, res) => {
  const { name, email, password, role, nisn } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Format email tidak valid.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter.' });
  }

  try {
    // Cek apakah email sudah terdaftar
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert to DB
    await db.execute(
      'INSERT INTO users (name, email, password, role, nisn) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, nisn || null]
    );

    res.status(201).json({ message: 'User berhasil ditambahkan.' });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// Delete a User (Admin only)
const deleteUser = async (req, res) => {
  const { id } = req.params;

  // Mencegah admin menghapus dirinya sendiri
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Anda tidak bisa menghapus akun Anda sendiri.' });
  }

  try {
    // Cek apakah user ada
    const [existing] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User berhasil dihapus.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server. Mungkin user memiliki relasi data (absen/jurnal).' });
  }
};

// Get Profile (Self)
const getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const [users] = await db.execute(
      'SELECT id, name, email, role, nisn, kelas, jurusan, no_hp, alamat, nama_instansi, pembimbing_instansi, photo, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    res.json({ data: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil profil.' });
  }
};

// Update Profile (Self)
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { kelas, jurusan, no_hp, alamat, nama_instansi, pembimbing_instansi, photo_url } = req.body;
  
  try {
    let savedPhotoUrl = null;
    
    // Jika ada photo_url (base64) dikirimkan, simpan sebagai file
    if (photo_url && photo_url.startsWith('data:image')) {
      savedPhotoUrl = saveBase64Image(photo_url);
    }
    
    if (savedPhotoUrl) {
      await db.execute(
        'UPDATE users SET kelas = ?, jurusan = ?, no_hp = ?, alamat = ?, nama_instansi = ?, pembimbing_instansi = ?, photo = ? WHERE id = ?',
        [kelas || null, jurusan || null, no_hp || null, alamat || null, nama_instansi || null, pembimbing_instansi || null, savedPhotoUrl, userId]
      );
    } else {
      await db.execute(
        'UPDATE users SET kelas = ?, jurusan = ?, no_hp = ?, alamat = ?, nama_instansi = ?, pembimbing_instansi = ? WHERE id = ?',
        [kelas || null, jurusan || null, no_hp || null, alamat || null, nama_instansi || null, pembimbing_instansi || null, userId]
      );
    }
    
    // Update active socket cache jika user sedang aktif di Live Tracking
    const activeUsers = req.app.locals.activeUsers;
    if (activeUsers && activeUsers.has(userId)) {
      const userCache = activeUsers.get(userId);
      userCache.kelas = kelas || null;
      userCache.jurusan = jurusan || null;
      userCache.nama_instansi = nama_instansi || null;
      userCache.pembimbing_instansi = pembimbing_instansi || null;
      if (savedPhotoUrl) userCache.photo = savedPhotoUrl;
      activeUsers.set(userId, userCache);
      
      // Beritahu klien live tracking tentang perubahan data profil
      if (req.io) {
        req.io.emit('live_locations', Array.from(activeUsers.values()));
      }
    }
    
    res.json({ message: 'Profil berhasil diperbarui.', photo: savedPhotoUrl });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat menyimpan profil.' });
  }
};

module.exports = { getAllUsers, createUser, deleteUser, getProfile, updateProfile };

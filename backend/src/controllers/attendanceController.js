const db = require('../config/db');
const saveBase64Image = require('../utils/saveBase64Image');

// Fungsi pembantu untuk menghitung jarak menggunakan Haversine Formula (dalam meter)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const checkIn = async (req, res) => {
  const { location_id, latitude, longitude, photo_url } = req.body;
  const user_id = req.user.id;

  if (!location_id || !latitude || !longitude || !photo_url) {
    return res.status(400).json({ message: 'Data lokasi atau foto tidak lengkap.' });
  }

  try {
    // 1. Dapatkan data lokasi dari DB
    const [locations] = await db.execute('SELECT * FROM locations WHERE id = ?', [location_id]);
    if (locations.length === 0) return res.status(404).json({ message: 'Lokasi tidak ditemukan.' });
    
    const location = locations[0];

    // 2. Validasi jarak (Geofencing)
    const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
    if (distance > location.radius) {
      return res.status(403).json({ 
        message: 'Anda berada di luar radius lokasi yang diizinkan.',
        distance: Math.round(distance),
        allowed_radius: location.radius
      });
    }

    // 3. Cek apakah sudah absen hari ini
    const today = new Date().toISOString().split('T')[0];
    const [existing] = await db.execute(
      'SELECT id FROM attendances WHERE user_id = ? AND date = ?', 
      [user_id, today]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Anda sudah melakukan presensi hari ini.' });
    }

    // 4. Simpan foto
    const savedPhotoUrl = saveBase64Image(photo_url);

    // 5. Catat Check-in
    const timeNow = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    const status = timeNow > '08:00:00' ? 'terlambat' : 'hadir';

    await db.execute(
      `INSERT INTO attendances (user_id, location_id, date, check_in_time, check_in_latitude, check_in_longitude, check_in_photo_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, location_id, today, timeNow, latitude, longitude, savedPhotoUrl, status]
    );

    if (req.io) {
      req.io.emit('dashboard_update');
    }

    res.status(201).json({ message: 'Check-in berhasil.', status, time: timeNow });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const checkOut = async (req, res) => {
  const { latitude, longitude, photo_url } = req.body;
  const user_id = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  if (!photo_url) {
    return res.status(400).json({ message: 'Foto checkout wajib disertakan.' });
  }

  try {
    const [attendances] = await db.execute(
      'SELECT id, location_id FROM attendances WHERE user_id = ? AND date = ?', 
      [user_id, today]
    );

    if (attendances.length === 0) {
      return res.status(400).json({ message: 'Anda belum melakukan check-in hari ini.' });
    }

    const attendance = attendances[0];

    const [locations] = await db.execute('SELECT radius, latitude, longitude FROM locations WHERE id = ?', [attendance.location_id]);
    if (locations.length > 0) {
      const location = locations[0];
      const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
      if (distance > location.radius) {
        return res.status(403).json({ 
          message: 'Anda berada di luar radius lokasi untuk melakukan check-out.' 
        });
      }
    }

    const savedPhotoUrl = saveBase64Image(photo_url);
    const timeNow = new Date().toTimeString().split(' ')[0];
    
    await db.execute(
      `UPDATE attendances SET check_out_time = ?, check_out_latitude = ?, check_out_longitude = ?, check_out_photo_url = ? WHERE id = ?`,
      [timeNow, latitude, longitude, savedPhotoUrl, attendance.id]
    );

    if (req.io) {
      req.io.emit('dashboard_update');
    }

    res.json({ message: 'Check-out berhasil.', time: timeNow });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const submitLeave = async (req, res) => {
  const { type, notes, photo_url } = req.body;
  const user_id = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  if (!type || !notes || !photo_url) {
    return res.status(400).json({ message: 'Tipe (izin/sakit), alasan, dan foto bukti wajib disertakan.' });
  }

  if (type !== 'izin' && type !== 'sakit') {
    return res.status(400).json({ message: 'Tipe harus izin atau sakit.' });
  }

  try {
    const [existing] = await db.execute(
      'SELECT id FROM attendances WHERE user_id = ? AND date = ?', 
      [user_id, today]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Anda sudah memiliki catatan kehadiran hari ini.' });
    }

    const savedPhotoUrl = saveBase64Image(photo_url);
    const timeNow = new Date().toTimeString().split(' ')[0];

    await db.execute(
      `INSERT INTO attendances (user_id, date, check_in_time, check_in_photo_url, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, today, timeNow, savedPhotoUrl, type, notes]
    );

    if (req.io) {
      req.io.emit('dashboard_update');
    }

    res.status(201).json({ message: 'Pengajuan berhasil dikirim.', status: type });

  } catch (error) {
    console.error('Submit leave error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const getHistory = async (req, res) => {
  const user_id = req.user.id;
  const role = req.user.role;
  
  try {
    let query = '';
    let params = [];

    if (role === 'siswa' || role === 'guru_pembimbing') {
      // Guru dan siswa hanya lihat riwayatnya sendiri
      query = 'SELECT a.*, l.name as location_name FROM attendances a LEFT JOIN locations l ON a.location_id = l.id WHERE a.user_id = ? ORDER BY a.date DESC';
      params.push(user_id);
    } else {
      query = 'SELECT a.*, l.name as location_name, u.name as student_name FROM attendances a LEFT JOIN locations l ON a.location_id = l.id JOIN users u ON a.user_id = u.id ORDER BY a.date DESC';
    }

    const [history] = await db.execute(query, params);
    res.json({ data: history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status wajib diisi.' });
  }

  try {
    await db.execute('UPDATE attendances SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Status berhasil diubah menjadi ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = { checkIn, checkOut, submitLeave, getHistory, updateStatus };

const db = require('../config/db');
const saveBase64Image = require('../utils/saveBase64Image');
const crypto = require('crypto');

// Haversine Formula — calculate distance in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const checkIn = async (req, res) => {
  const { location_id, latitude, longitude, photo_url } = req.body;
  const user_id = req.user.id;

  if (!location_id || !latitude || !longitude || !photo_url) {
    return res.status(400).json({ message: 'Data lokasi atau foto tidak lengkap.' });
  }

  // Validate coordinate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ message: 'Koordinat GPS tidak valid.' });
  }

  try {
    const [locations] = await db.execute('SELECT * FROM locations WHERE id = ?', [location_id]);
    if (locations.length === 0) return res.status(404).json({ message: 'Lokasi tidak ditemukan.' });

    const location = locations[0];

    // Geofencing validation
    const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
    if (distance > location.radius) {
      return res.status(403).json({
        message: 'Anda berada di luar radius lokasi yang diizinkan.',
        distance: Math.round(distance),
        allowed_radius: location.radius
      });
    }

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const [existing] = await db.execute(
      'SELECT id FROM attendances WHERE user_id = ? AND date = ?',
      [user_id, today]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Anda sudah melakukan presensi hari ini.' });
    }

    // Save photo
    const savedPhotoUrl = saveBase64Image(photo_url);

    // Record Check-in
    const timeNow = new Date().toTimeString().split(' ')[0];
    const status = timeNow > '08:00:00' ? 'terlambat' : 'hadir';

    await db.execute(
      `INSERT INTO attendances (user_id, location_id, date, check_in_time, check_in_latitude, check_in_longitude, check_in_photo_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, location_id, today, timeNow, latitude, longitude, savedPhotoUrl, status]
    );

    if (req.io) req.io.emit('dashboard_update');

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

    if (attendance.location_id) {
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
    }

    const savedPhotoUrl = saveBase64Image(photo_url);
    const timeNow = new Date().toTimeString().split(' ')[0];

    await db.execute(
      `UPDATE attendances SET check_out_time = ?, check_out_latitude = ?, check_out_longitude = ?, check_out_photo_url = ? WHERE id = ?`,
      [timeNow, latitude, longitude, savedPhotoUrl, attendance.id]
    );

    if (req.io) req.io.emit('dashboard_update');

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

  if (notes.length < 5) {
    return res.status(400).json({ message: 'Alasan minimal 5 karakter.' });
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

    // Fixed: location_id is now explicitly NULL for leave submissions
    await db.execute(
      `INSERT INTO attendances (user_id, location_id, date, check_in_time, check_in_photo_url, status, notes)
       VALUES (?, NULL, ?, ?, ?, ?, ?)`,
      [user_id, today, timeNow, savedPhotoUrl, type, notes]
    );

    if (req.io) req.io.emit('dashboard_update');

    res.status(201).json({ message: 'Pengajuan berhasil dikirim.', status: type });

  } catch (error) {
    console.error('Submit leave error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// ─── QR/Barcode Scan Attendance ──────────────────────────────────────
const SCAN_SECRET = process.env.SCAN_SECRET || 'scan_secret_key_change_in_production';

const generateCardToken = (userId, nisn) => {
  // Create a signed token for the QR code to prevent forgery
  const payload = `${userId}:${nisn}`;
  const signature = crypto.createHmac('sha256', SCAN_SECRET).update(payload).digest('hex').substring(0, 12);
  return `PRESENSI:${userId}:${nisn}:${signature}`;
};

const verifyCardToken = (token) => {
  try {
    const parts = token.split(':');
    if (parts.length !== 4 || parts[0] !== 'PRESENSI') return null;

    const userId = parseInt(parts[1]);
    const nisn = parts[2];
    const signature = parts[3];

    const expectedPayload = `${userId}:${nisn}`;
    const expectedSignature = crypto.createHmac('sha256', SCAN_SECRET).update(expectedPayload).digest('hex').substring(0, 12);

    if (signature !== expectedSignature) return null;

    return { userId, nisn };
  } catch {
    return null;
  }
};

// Get card data for a student (generates QR token)
const getCardData = async (req, res) => {
  // Allow admin and teacher to view any student's card via query parameter ?user_id=123
  const targetUserId = (req.query.user_id && ['admin', 'guru_pembimbing'].includes(req.user.role))
    ? req.query.user_id
    : req.user.id;

  try {
    const [users] = await db.execute(
      'SELECT id, name, email, nisn, kelas, jurusan, nama_instansi, photo FROM users WHERE id = ?',
      [targetUserId]
    );

    if (users.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const user = users[0];
    const qrToken = generateCardToken(user.id, user.nisn || 'N/A');

    res.json({
      data: {
        ...user,
        qr_token: qrToken
      }
    });
  } catch (error) {
    console.error('Get card data error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// Scan QR code or NISN barcode to check in a student (used by petugas/admin/guru)
const scanCheckIn = async (req, res) => {
  const { qr_token, location_id } = req.body;

  if (!qr_token || !qr_token.toString().trim()) {
    return res.status(400).json({ message: 'Barcode / QR Token wajib diisi.' });
  }

  const cleanToken = qr_token.toString().trim();
  let userId = null;

  // 1. Try to verify HMAC signed QR token
  const cardData = verifyCardToken(cleanToken);
  if (cardData) {
    userId = cardData.userId;
  } else {
    // 2. Fallback: Check if it's a raw NISN or user ID directly (supports 1D barcode scanner / manual NISN input)
    try {
      const [byNisn] = await db.execute('SELECT id FROM users WHERE nisn = ? LIMIT 1', [cleanToken]);
      if (byNisn.length > 0) {
        userId = byNisn[0].id;
      } else {
        // Check if numeric user ID
        if (!isNaN(cleanToken)) {
          const [byId] = await db.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [parseInt(cleanToken)]);
          if (byId.length > 0) userId = byId[0].id;
        }
      }
    } catch (e) {
      console.error('Error finding user by NISN/ID:', e);
    }
  }

  if (!userId) {
    return res.status(400).json({ message: 'QR Code atau Barcode NISN tidak valid atau belum terdaftar.' });
  }

  try {
    // Verify user exists and get details
    const [users] = await db.execute('SELECT id, name, nisn, kelas, jurusan, photo FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
    }

    const student = users[0];

    // Determine location: use provided location_id, or default to first location
    let resolvedLocationId = location_id || null;
    let loc = { latitude: 0, longitude: 0 };

    if (resolvedLocationId) {
      const [locations] = await db.execute('SELECT id, latitude, longitude FROM locations WHERE id = ?', [resolvedLocationId]);
      if (locations.length > 0) {
        loc = locations[0];
      }
    } else {
      const [locations] = await db.execute('SELECT id, latitude, longitude FROM locations LIMIT 1');
      if (locations.length > 0) {
        resolvedLocationId = locations[0].id;
        loc = locations[0];
      }
    }

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const [existing] = await db.execute(
      'SELECT id, check_in_time, check_out_time FROM attendances WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    const timeNow = new Date().toTimeString().split(' ')[0];
    const status = timeNow > '08:00:00' ? 'terlambat' : 'hadir';

    if (existing.length > 0 && !existing[0].check_out_time) {
      // Already checked in today but not checked out — perform Check-Out
      await db.execute(
        'UPDATE attendances SET check_out_time = ? WHERE id = ?',
        [timeNow, existing[0].id]
      );

      if (req.io) req.io.emit('dashboard_update');
      return res.json({
        message: `Check-out berhasil untuk ${student.name}`,
        student,
        type: 'checkout',
        check_in_time: existing[0].check_in_time,
        check_out_time: timeNow
      });
    }

    if (existing.length > 0) {
      return res.status(400).json({
        message: `${student.name} sudah melakukan presensi lengkap hari ini (Masuk: ${existing[0].check_in_time}, Pulang: ${existing[0].check_out_time}).`,
        student
      });
    }

    // Perform Check-In
    await db.execute(
      `INSERT INTO attendances (user_id, location_id, date, check_in_time, check_in_latitude, check_in_longitude, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, resolvedLocationId, today, timeNow, loc.latitude, loc.longitude, status, 'Via Petugas Scanner']
    );

    if (req.io) req.io.emit('dashboard_update');

    res.status(201).json({
      message: `Check-in berhasil untuk ${student.name}`,
      student,
      type: 'checkin',
      status,
      time: timeNow
    });

  } catch (error) {
    console.error('Scan check-in error:', error);
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

  const validStatuses = ['hadir', 'terlambat', 'izin', 'sakit', 'alpa', 'ditolak'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid.' });
  }

  try {
    await db.execute('UPDATE attendances SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Status berhasil diubah menjadi ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = { checkIn, checkOut, submitLeave, getHistory, updateStatus, scanCheckIn, getCardData };

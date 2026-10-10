const db = require('../config/db');

// SMK Negeri 20 Jakarta Official Default Coordinates
const SMKN20_PRESET = {
  name: 'SMK Negeri 20 Jakarta (Kampus Utama)',
  latitude: -6.28400000,
  longitude: 106.79380000,
  radius: 200,
  address: 'Jl. Melati No. 24, Cilandak Barat, Cilandak, Jakarta Selatan 12430'
};

const getLocations = async (req, res) => {
  try {
    const [locations] = await db.execute('SELECT * FROM locations ORDER BY id ASC');
    res.json({
      message: 'Berhasil mengambil data lokasi',
      data: locations,
      schoolPreset: SMKN20_PRESET
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat memuat data lokasi.' });
  }
};

const createLocation = async (req, res) => {
  const { name, latitude, longitude, radius, address } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Nama lokasi sekolah/tempat PKL wajib diisi.' });
  }

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);
  const radNum = parseInt(radius) || 200;

  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return res.status(400).json({ message: 'Latitude tidak valid (harus di antara -90 dan 90).' });
  }

  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    return res.status(400).json({ message: 'Longitude tidak valid (harus di antara -180 dan 180).' });
  }

  if (radNum <= 0 || radNum > 100000) {
    return res.status(400).json({ message: 'Radius toleransi harus di antara 10 dan 100.000 meter.' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO locations (name, latitude, longitude, radius, address) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), latNum.toFixed(8), lngNum.toFixed(8), radNum, address ? address.trim() : '']
    );

    const newLocation = {
      id: result.insertId,
      name: name.trim(),
      latitude: latNum.toFixed(8),
      longitude: lngNum.toFixed(8),
      radius: radNum,
      address: address ? address.trim() : ''
    };

    if (req.io) {
      req.io.emit('location_changed', { action: 'create', location: newLocation });
    }

    res.status(201).json({
      message: 'Titik lokasi berhasil ditambahkan',
      data: newLocation
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Gagal menambahkan titik lokasi ke database.' });
  }
};

const updateLocation = async (req, res) => {
  const { id } = req.params;
  const { name, latitude, longitude, radius, address } = req.body;

  if (!id) return res.status(400).json({ message: 'ID lokasi tidak valid.' });

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);
  const radNum = parseInt(radius) || 200;

  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return res.status(400).json({ message: 'Latitude tidak valid.' });
  }

  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    return res.status(400).json({ message: 'Longitude tidak valid.' });
  }

  try {
    const [exists] = await db.execute('SELECT id FROM locations WHERE id = ?', [id]);
    if (exists.length === 0) {
      return res.status(404).json({ message: 'Data lokasi tidak ditemukan.' });
    }

    await db.execute(
      'UPDATE locations SET name = ?, latitude = ?, longitude = ?, radius = ?, address = ?, updated_at = NOW() WHERE id = ?',
      [name.trim(), latNum.toFixed(8), lngNum.toFixed(8), radNum, address ? address.trim() : '', id]
    );

    if (req.io) {
      req.io.emit('location_changed', { action: 'update', id: parseInt(id) });
    }

    res.json({ message: 'Titik lokasi berhasil diperbarui.' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Gagal memperbarui titik lokasi.' });
  }
};

const deleteLocation = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'ID lokasi tidak valid.' });

  try {
    const [exists] = await db.execute('SELECT id, name FROM locations WHERE id = ?', [id]);
    if (exists.length === 0) {
      return res.status(404).json({ message: 'Lokasi tidak ditemukan.' });
    }

    // Check if attendances refer to this location
    const [refs] = await db.execute('SELECT COUNT(*) as count FROM attendances WHERE location_id = ?', [id]);
    if (refs[0].count > 0) {
      // Rather than blocking, or if school main location
      if (id == 1) {
        return res.status(400).json({
          message: 'Lokasi utama SMK Negeri 20 Jakarta tidak dapat dihapus karena menjadi referensi presensi pusat sekolah.'
        });
      }
    }

    await db.execute('DELETE FROM locations WHERE id = ?', [id]);

    if (req.io) {
      req.io.emit('location_changed', { action: 'delete', id: parseInt(id) });
    }

    res.json({ message: `Lokasi "${exists[0].name}" berhasil dihapus.` });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ message: 'Gagal menghapus lokasi karena terikat relasi presensi siswa.' });
  }
};

module.exports = {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  SMKN20_PRESET
};

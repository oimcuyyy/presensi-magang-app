const db = require('../config/db');

const getLocations = async (req, res) => {
  try {
    const [locations] = await db.execute('SELECT * FROM locations');
    res.json({ message: 'Berhasil mengambil data lokasi', data: locations });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = { getLocations };

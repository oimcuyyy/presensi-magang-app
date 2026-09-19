const db = require('../config/db');

const getAdminStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Total Siswa
    const [siswaResult] = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'siswa'");
    const totalSiswa = siswaResult[0].count;

    // 2. Hadir Hari Ini
    const [hadirResult] = await db.execute("SELECT COUNT(DISTINCT user_id) as count FROM attendances WHERE date = ?", [today]);
    const hadirHariIni = hadirResult[0].count;

    // 3. Total Lokasi Geofence
    const [lokasiResult] = await db.execute("SELECT COUNT(*) as count FROM locations");
    const totalLokasi = lokasiResult[0].count;

    // 4. Jurnal Menunggu Review (status = 'submitted')
    const [jurnalResult] = await db.execute("SELECT COUNT(*) as count FROM daily_journals WHERE status = 'submitted'");
    const jurnalMenunggu = jurnalResult[0].count;

    res.json({
      data: {
        totalSiswa,
        hadirHariIni,
        totalLokasi,
        jurnalMenunggu
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil statistik.' });
  }
};

module.exports = { getAdminStats };

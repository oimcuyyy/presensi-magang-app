const db = require('../config/db');

const getNotifications = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    res.json({ data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    res.json({ message: 'Notifikasi ditandai sudah dibaca.' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = { getNotifications, markAsRead };

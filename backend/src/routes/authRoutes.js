const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);

// Contoh route yang dilindungi untuk tes token (opsional)
router.get('/me', authenticateToken, (req, res) => {
  res.json({ message: 'Berhasil mengakses route terproteksi', user: req.user });
});

module.exports = router;

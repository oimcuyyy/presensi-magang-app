const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Middleware opsional untuk memastikan hanya admin yang bisa akses
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'guru_pembimbing') {
    return res.status(403).json({ message: 'Akses ditolak. Membutuhkan hak akses admin.' });
  }
  next();
};

router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);

router.get('/', authenticateToken, isAdmin, userController.getAllUsers);
router.post('/', authenticateToken, isAdmin, userController.createUser);
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);

module.exports = router;

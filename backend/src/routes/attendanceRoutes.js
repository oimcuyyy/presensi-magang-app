const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.post(['/checkin', '/check-in'], authenticateToken, attendanceController.checkIn);
router.post(['/checkout', '/check-out'], authenticateToken, attendanceController.checkOut);
router.post('/leave', authenticateToken, attendanceController.submitLeave);
router.get('/history', authenticateToken, attendanceController.getHistory);
router.put('/:id/status', authenticateToken, authorizeRole(['admin']), attendanceController.updateStatus);

// QR Card & Scan routes
router.get('/card-data', authenticateToken, attendanceController.getCardData);
router.post('/scan', authenticateToken, authorizeRole(['admin', 'guru_pembimbing']), attendanceController.scanCheckIn);

module.exports = router;

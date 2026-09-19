const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.post('/checkin', authenticateToken, attendanceController.checkIn);
router.post('/checkout', authenticateToken, attendanceController.checkOut);
router.post('/leave', authenticateToken, attendanceController.submitLeave);
router.get('/history', authenticateToken, attendanceController.getHistory);
router.put('/:id/status', authenticateToken, authorizeRole(['admin']), attendanceController.updateStatus);

module.exports = router;

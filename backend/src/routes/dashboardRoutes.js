const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/stats', authenticateToken, authorizeRole(['admin', 'guru_pembimbing']), dashboardController.getAdminStats);

module.exports = router;

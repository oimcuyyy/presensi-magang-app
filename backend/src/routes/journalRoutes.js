const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.post('/', authenticateToken, authorizeRole(['siswa']), journalController.createJournal);
router.get('/', authenticateToken, journalController.getJournals);
router.put('/:id', authenticateToken, authorizeRole(['guru_pembimbing']), journalController.updateJournalStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, locationController.getLocations);
router.post('/', authenticateToken, authorizeRole(['admin']), locationController.createLocation);
router.put('/:id', authenticateToken, authorizeRole(['admin']), locationController.updateLocation);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), locationController.deleteLocation);

module.exports = router;

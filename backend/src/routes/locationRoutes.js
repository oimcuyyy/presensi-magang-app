const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, locationController.getLocations);

module.exports = router;

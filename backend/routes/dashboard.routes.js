const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, dashboardController.getStats);

module.exports = router;

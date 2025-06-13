const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

// Protect all routes - only authenticated vendors can access
router.use(authenticate);

// Dashboard routes
router.get('/details', dashboardController.getVendorDashboard);

module.exports = router;

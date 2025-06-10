const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');
const authMiddleware = require('../middlewares/auth');

// Protect all routes - require authentication
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('vendor'));

// Revenue summary and statistics routes
router.get('/summary', revenueController.getRevenueSummary);
router.get('/stats', revenueController.getRevenueStats);

// Transaction routes
router.get('/transactions', revenueController.getRecentTransactions);
router.get('/transactions/:id', revenueController.getTransactionById);

module.exports = router;

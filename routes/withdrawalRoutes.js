const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authenticate } = require('../middlewares/auth');

// Protect all withdrawal routes with authentication
router.use(authenticate);

// Get all withdrawals with optional filtering
router.get('/', withdrawalController.getWithdrawals);

// Export withdrawals as CSV
router.get('/export-csv', withdrawalController.exportWithdrawalsCSV);

// Export withdrawals as Excel
router.get('/export-excel', withdrawalController.exportWithdrawalsExcel);

// Get details of a specific withdrawal
router.get('/:id', withdrawalController.getWithdrawalById);

// Create a new withdrawal request
router.post('/', withdrawalController.createWithdrawal);

// Cancel a withdrawal request
router.patch('/:id/cancel', withdrawalController.cancelWithdrawal);

// Retry a failed withdrawal request
router.post('/:id/retry', withdrawalController.retryWithdrawal);

// Admin - Update withdrawal status (requires admin role)
router.patch('/:id/status', withdrawalController.updateWithdrawalStatus);

module.exports = router;

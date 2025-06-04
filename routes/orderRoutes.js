const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// Get all orders for a specific store
router.get('/store/:storeId', authenticate, orderController.getOrdersByStoreId);

// Get order details by ID
router.get('/:id', orderController.getOrderById);

// Update order status
router.patch('/:id/status', authenticate, orderController.updateOrderStatus);

module.exports = router;

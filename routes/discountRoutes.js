const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { authenticate } = require('../middlewares/auth');

// All routes are protected - require authentication
router.use(authenticate);

// Coupon routes
router.get('/', discountController.getCoupons);
router.get('/generate-code', discountController.generateCouponCode);
router.get('/:id', discountController.getCouponById);
router.post('/', discountController.createCoupon);
router.patch('/:id', discountController.updateCoupon);
router.delete('/:id', discountController.deleteCoupon);

module.exports = router;

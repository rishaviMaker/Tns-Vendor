const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', adminController.login);
router.get('/all-vendors', authenticate, adminController.getAllVendors);
router.put('/vendor/:id/approve', authenticate, adminController.approveVendor);
router.put('/vendor/:id/reject', authenticate, adminController.rejectVendor);
router.post('/vendor/create', authenticate, adminController.createVendor);
router.get('/all-product-requests', authenticate, adminController.getAllProductRequests);
router.get('/all-products', authenticate, adminController.getAllProducts);
router.get('/product/:id', authenticate, adminController.getProduct);
router.get('/vendor/:id', authenticate, adminController.getVendor);
router.put('/vendor/:id', authenticate, adminController.updateVendor);
router.put('/product-request/:id/approve', authenticate, adminController.ApproveProductRequest);
router.put('/product-request/:id/reject', authenticate, adminController.RejectProductRequest);
router.delete('/product-request/:id', authenticate, adminController.DeleteProductRequest);
router.delete('/product/:id', authenticate, adminController.DeleteProduct);
router.put('/product/:id', authenticate, adminController.updateProduct);
router.post('/product/create', authenticate, adminController.createProduct);

module.exports = router;

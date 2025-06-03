const express = require('express');
const storeController = require('../controllers/storeController');

const router = express.Router();

// Store routes
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStoreById);
router.get('/vendor/:vendorId', storeController.getStoreByVendorId);
router.patch('/:id', storeController.updateStore);
router.patch('/:id/status', storeController.updateStoreStatus);
router.patch('/:id/verify-vendor', storeController.verifyVendor);

module.exports = router;

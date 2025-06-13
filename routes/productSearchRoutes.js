const express = require('express');
const router = express.Router();
const productSearchController = require('../controllers/productSearchController');
const authMiddleware = require('../middlewares/auth');

// Protect all routes - require authentication
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('vendor'));

// Search routes
router.get('/catalog', productSearchController.searchCatalogProducts);
router.get('/catalog/:id', productSearchController.getCatalogProductById);

// Product request routes
router.post('/request', productSearchController.requestNewProduct);
router.get('/requests', productSearchController.getVendorProductRequests);

module.exports = router;

const express = require('express');
const productRequestController = require('../controllers/productRequestController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Protect all routes
router.use(auth.authenticate);

// Create a new product request
router.post('/create', productRequestController.createProductRequest);

// Get all product requests for vendor
router.get('/', productRequestController.getAllProductRequests);

// Get a specific product request
router.get('/:id', productRequestController.getProductRequestById);

// Update a product request (only if status is pending)
router.patch('/:id', productRequestController.updateProductRequest);

// Cancel a product request (only if status is pending)
router.delete('/:id', productRequestController.cancelProductRequest);

module.exports = router;

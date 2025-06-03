const express = require('express');
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// Product routes with authentication
router.get('/', authenticate, productController.getAllProducts); // Added authentication
router.get('/:id', productController.getProductById);
router.get('/store/:storeId', productController.getProductsByStore);

// Protected product routes (require authentication)
// router.post('/create', productController.upload.single('image'), productController.createProduct);
// router.patch('/update/:id', productController.upload.single('image'), productController.updateProduct);
router.delete('/delete/:id', authenticate, productController.deleteProduct);
router.patch('/status/:id', authenticate, productController.updateProductStatus);

// For multiple image and video uploads
router.post('/create', 
  authenticate, // Add authentication middleware
  productController.upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ]), 
  productController.createProduct);

router.patch('/update/:id', 
  authenticate, // Add authentication middleware
  productController.upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ]), 
  productController.updateProduct);

module.exports = router;

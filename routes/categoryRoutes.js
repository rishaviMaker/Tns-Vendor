const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Public category routes
router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/subcategories', categoryController.getSubcategories);

module.exports = router;

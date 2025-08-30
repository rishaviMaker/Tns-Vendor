const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.get('/', authenticate, warehouseController.getAllWarehouse);
router.post('/', authenticate, warehouseController.createWarehouse);
router.put('/:id', authenticate, warehouseController.updateWarehouse);
router.delete('/:id', authenticate, warehouseController.deleteWarehouse);
router.get('/:id', authenticate, warehouseController.getWarehouseById);
router.get('/vendor/:vendorId', authenticate, warehouseController.getWarehouseByVendorId);

module.exports = router;

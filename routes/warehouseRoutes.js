const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.get('/', warehouseController.getAllWarehouse);
router.post('/', warehouseController.createWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);
router.get('/:id', warehouseController.getWarehouseById);
router.get('/vendor/:vendorId', warehouseController.getWarehouseByVendorId);

module.exports = router;

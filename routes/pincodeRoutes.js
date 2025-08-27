const express = require('express');
const pincodeController = require('../controllers/pincodeController');
const { authenticate } = require('../middlewares/auth');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.get('/:warehouse_id', pincodeController.getAllWarehousePincode);
router.post('/', pincodeController.createWarehousePincode);
router.put('/:id', pincodeController.updateWarehousePincode);
router.delete('/:id', pincodeController.deleteWarehousePincode);

router.post('/:warehouse_id/upload', upload.single('file'), pincodeController.uploadExcel);

module.exports = router;

const express = require('express');
const vendorController = require('../controllers/vendorController');
const { authenticate, authorize } = require('../middlewares/auth');


const router = express.Router();

// Public vendor routes
router.get('/',  authenticate, vendorController.getAllVendors);
router.get('/:id', vendorController.getVendor);

// Vendor registration and auth
router.post('/register', vendorController.upload.single('idProof'), vendorController.registerVendor);
router.post('/login', vendorController.loginVendor);

// OTP verification routes
router.post('/send-otp', vendorController.sendOTP);
router.post('/verify-otp', vendorController.verifyOTP);

// Vendor profile routes
router.patch('/profile/:id',authenticate, vendorController.updateVendorProfile);
router.patch('/upload-logo/:id', authenticate, vendorController.logoUpload.single('logo'), vendorController.uploadLogo);
router.get('/dashboard/:id', authenticate, vendorController.getVendorDashboard);

// Notification settings route
router.patch('/device-token', authenticate, vendorController.updateDeviceToken);

// ID Proof upload route
router.post('/upload-id-proof/:id',authenticate, vendorController.upload.single('idProof'), vendorController.uploadIdProof);

module.exports = router;

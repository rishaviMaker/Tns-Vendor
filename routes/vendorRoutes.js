const express = require('express');
const vendorController = require('../controllers/vendorController');

const router = express.Router();

// Public vendor routes
router.get('/', vendorController.getAllVendors);
router.get('/:id', vendorController.getVendor);

// Vendor registration and auth
router.post('/register', vendorController.upload.single('idProof'), vendorController.registerVendor);
router.post('/login', vendorController.loginVendor);

// OTP verification routes
router.post('/send-otp', vendorController.sendOTP);
router.post('/verify-otp', vendorController.verifyOTP);

// Vendor profile routes
router.patch('/profile/:id', vendorController.updateVendorProfile);
router.patch('/upload-logo/:id', vendorController.uploadLogo);
router.get('/dashboard/:id', vendorController.getVendorDashboard);

// ID Proof upload route
router.post('/upload-id-proof/:id', vendorController.upload.single('idProof'), vendorController.uploadIdProof);

module.exports = router;

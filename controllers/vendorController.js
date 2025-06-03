const { Vendor } = require('../models/Vendor');
const { OTP } = require('../models/OTP');
const { Store } = require('../models/Store');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const otpService = require('../services/otpService');
const notificationService = require('../services/notificationService');
const multer = require('multer');
const path = require('path');

// Configure storage for ID proof uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/id_proofs/');
  },
  filename: function(req, file, cb) {
    cb(null, 'id_proof_' + Date.now() + path.extname(file.originalname));
  }
});

// File filter for ID proof uploads
const fileFilter = (req, file, cb) => {
  // Accept only PDF, JPG, and PNG files
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload PDF, JPG, or PNG file.'), false);
  }
};

exports.upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Get all vendors
 * @route GET /api/vendors
 */
exports.getAllVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.findAll({
      // where: { status: 'active' },
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      status: 'success',
      results: vendors.length,
      data: {
        vendors
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get vendor by ID
 * @route GET /api/vendors/:id
 */
exports.getVendor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!vendor) {
      return res.status(404).json({
        status: 'fail',
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        vendor
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update vendor profile
 * @route PATCH /api/vendors/profile/:id
 * @access Private (Vendor only)
 */
exports.updateVendorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findByPk(id);
    
    if (!vendor) {
      return res.status(404).json({
        status: 'fail',
        message: 'Vendor profile not found'
      });
    }
    
    const {
      vendorName,
      businessName,
      businessDescription,
      street,
      city,
      state,
      country,
      postalCode,
      website,
      phone,
      taxId,
      bankAccountDetails
    } = req.body;
    
    // Update vendor details
    if (vendorName) vendor.vendorName = vendorName;
    if (businessName) vendor.businessName = businessName;
    if (businessDescription) vendor.businessDescription = businessDescription;
    if (street) vendor.street = street;
    if (city) vendor.city = city;
    if (state) vendor.state = state;
    if (country) vendor.country = country;
    if (postalCode) vendor.postalCode = postalCode;
    if (website) vendor.website = website;
    if (phone) vendor.phone = phone;
    if (taxId) vendor.taxId = taxId;
    if (bankAccountDetails) vendor.bankAccountDetails = bankAccountDetails;
    
    await vendor.save();
    
    // Exclude password from response
    const vendorResponse = vendor.toJSON();
    delete vendorResponse.password;
    
    res.status(200).json({
      status: 'success',
      data: {
        vendor: vendorResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload vendor logo
 * @route PATCH /api/vendors/upload-logo/:id
 * @access Private (Vendor only)
 * @note This endpoint would be extended with file upload middleware
 */
exports.uploadLogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findByPk(id);
    
    if (!vendor) {
      return res.status(404).json({
        status: 'fail',
        message: 'Vendor profile not found'
      });
    }
    
    // In a real application, req.file would contain the uploaded file
    // For now, we'll assume the file path is passed in the request body
    const { logoUrl } = req.body;
    
    if (!logoUrl) {
      return res.status(400).json({
        status: 'fail',
        message: 'No logo provided'
      });
    }
    
    vendor.logoUrl = logoUrl;
    await vendor.save();
    
    // Exclude password from response
    const vendorResponse = vendor.toJSON();
    delete vendorResponse.password;
    
    res.status(200).json({
      status: 'success',
      data: {
        vendor: vendorResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get vendor dashboard statistics
 * @route GET /api/vendors/dashboard/:id
 * @access Private (Vendor only)
 */
exports.getVendorDashboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!vendor) {
      return res.status(404).json({
        status: 'fail',
        message: 'Vendor profile not found'
      });
    }
    
    // In this simplified version, we're just returning the vendor data
    // In a real application, we would add statistics like products, orders, revenue, etc.
    
    res.status(200).json({
      status: 'success',
      data: {
        vendor,
        stats: {
          // Placeholder for future statistics
          totalProducts: 0,
          activeProducts: 0,
          outOfStockProducts: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new vendor - First step (without OTP verification)
 * @route POST /api/vendors/register
 * @access Public
 */
exports.registerVendor = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      businessType,
      mobileNumber,
      alternativeMobileNumber,
      position,
      idProofType,
      companyName,
      shopUrl,
      gstinNumber,
      panNumber,
      establishedYear,
      shopPhoneNumber,
      street,
      city,
      state,
      postalCode,
      country
    } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Passwords do not match'
      });
    }

    // Check if vendor already exists with this email
    const existingVendorByEmail = await Vendor.findOne({ where: { email } });
    if (existingVendorByEmail) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already in use'
      });
    }

    // Check if vendor already exists with this mobile number
    const existingVendorByMobile = await Vendor.findOne({ where: { mobileNumber } });
    if (existingVendorByMobile) {
      return res.status(400).json({
        status: 'fail',
        message: 'Mobile number already in use'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get ID proof URL from request file if it exists
    const idProofUrl = req.file ? `/uploads/id_proofs/${req.file.filename}` : null;

    // Create new vendor with pending status
    const newVendor = await Vendor.create({
      fullName,
      email,
      password: hashedPassword,
      businessType,
      mobileNumber,
      alternativeMobileNumber,
      position,
      idProofType,
      idProofUrl,
      companyName,
      shopUrl,
      gstinNumber,
      panNumber,
      establishedYear,
      shopPhoneNumber,
      street,
      city,
      state,
      postalCode,
      country: country || 'India',
      status: 'pending',
      isMobileVerified: false
    });

    // Generate and send OTP
    const otpRecord = await otpService.createOTP(mobileNumber);
    const otpSent = await otpService.sendOTP(mobileNumber, otpRecord.otp);

    // Create store entry in mp_stores table
    const storeData = await Store.create({
      name: companyName,
      phone: shopPhoneNumber,
      address: street,
      city,
      state,
      country: country || 'India',
      gst_no: gstinNumber,
      pan_no: panNumber,
      established_year: establishedYear,
      business_type: businessType,
      logo: null, // Will be updated later
      description: null, // Can be updated later
      content: null, // Can be updated later
      customerId: newVendor.id,
      status: 'pending',
      vendor_verified_at: null, // Will be set when vendor is verified
      created_at: new Date(),
      updated_at: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newVendor.id, email: newVendor.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Exclude password from response
    const vendorResponse = newVendor.toJSON();
    delete vendorResponse.password;

    res.status(201).json({
      status: 'success',
      token,
      message: otpSent ? 'Vendor registered successfully. OTP sent to your mobile number.' : 'Vendor registered successfully, but there was an issue sending OTP.',
      data: {
        vendor: vendorResponse,
        store: storeData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP for mobile verification
 * @route POST /api/vendors/send-otp
 * @access Public
 */
exports.sendOTP = async (req, res, next) => {
  try {
    const { mobileNumber, deviceToken } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        status: 'fail',
        message: 'Mobile number is required'
      });
    }

    // Generate and send OTP
    const otpRecord = await otpService.createOTP(mobileNumber);
    const otpSent = await otpService.sendOTP(mobileNumber, otpRecord.otp, deviceToken);

    // Send push notification if device token is provided
    if (deviceToken) {
      await notificationService.sendNotification(
        deviceToken,
        'OTP Verification',
        `Your OTP is ${otpRecord.otp}. It will expire in 10 minutes.`,
        { type: 'otp', otp: otpRecord.otp }
      );
    }

    res.status(200).json({
      status: 'success',
      otp:otpRecord.otp,
      message: otpSent ? 'OTP sent successfully' : 'There was an issue sending OTP'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and update vendor's mobile verification status
 * @route POST /api/vendors/verify-otp
 * @access Public
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { mobileNumber, otp, vendorId } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Mobile number and OTP are required'
      });
    }

    // Verify OTP
    const verificationResult = await otpService.verifyOTP(mobileNumber, otp);

    if (!verificationResult.verified) {
      return res.status(400).json({
        status: 'fail',
        message: verificationResult.message
      });
    }

    // If vendorId is provided, update the vendor's mobile verification status
    if (vendorId) {
      const vendor = await Vendor.findByPk(vendorId);
      if (vendor && vendor.mobileNumber === mobileNumber) {
        vendor.isMobileVerified = true;
        await vendor.save();
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login vendor
 * @route POST /api/vendors/login
 * @access Public
 */
exports.loginVendor = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if vendor exists
    const vendor = await Vendor.findOne({ where: { email } });
    if (!vendor) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials'
      });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: vendor.id, email: vendor.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Exclude password from response
    const vendorResponse = vendor.toJSON();
    delete vendorResponse.password;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      data: {
        vendor: vendorResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload ID Proof for Vendor
 * @route POST /api/vendors/upload-id-proof/:id
 * @access Private
 */
exports.uploadIdProof = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No file uploaded or invalid file format'
      });
    }

    const vendor = await Vendor.findByPk(id);
    
    if (!vendor) {
      return res.status(404).json({
        status: 'fail',
        message: 'Vendor not found'
      });
    }
    
    // Update vendor with ID proof URL
    vendor.idProofUrl = `/uploads/id_proofs/${req.file.filename}`;
    await vendor.save();
    
    // Exclude password from response
    const vendorResponse = vendor.toJSON();
    delete vendorResponse.password;
    
    res.status(200).json({
      status: 'success',
      message: 'ID proof uploaded successfully',
      data: {
        vendor: vendorResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

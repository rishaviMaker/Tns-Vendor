const { Vendor } = require('../models/Vendor');
const { OTP } = require('../models/OTP');
const { Store } = require('../models/Store');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const otpService = require('../services/otpService');
const notificationService = require('../services/notificationService');
const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Configure storage for ID proof uploads
const idProofStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/id_proofs/');
  },
  filename: function(req, file, cb) {
    cb(null, 'id_proof_' + Date.now() + path.extname(file.originalname));
  }
});

// Configure storage for logo uploads
const logoStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create directory if it doesn't exist
    const fs = require('fs');
    const dir = './uploads/logos/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, 'logo_' + Date.now() + path.extname(file.originalname));
  }
});

// File filter for ID proof uploads
const idProofFileFilter = (req, file, cb) => {
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

// File filter for logo uploads
const logoFileFilter = (req, file, cb) => {
  // Accept only JPG, PNG, and GIF files for logos
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/gif'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload JPG, PNG, or GIF file.'), false);
  }
};

// ID Proof upload middleware
exports.upload = multer({ 
  storage: idProofStorage, 
  fileFilter: idProofFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Logo upload middleware
exports.logoUpload = multer({ 
  storage: logoStorage, 
  fileFilter: logoFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for logos
});

/**
 * Get all vendors
 * @route GET /api/vendors
 */
exports.getAllVendors = catchAsync(async (req, res, next) => {
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
});

/**
 * Get vendor by ID
 * @route GET /api/vendors/:id
 */
exports.getVendor = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const vendor = await Vendor.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }
    
    const store = await Store.findOne({ where: { customer_id: id } });

    res.status(200).json({
      status: 'success',
      data: {
        vendor,
        store: store || null
      }
    });
});

/**
 * Update vendor profile
 * @route PATCH /api/vendors/profile/:id
 * @access Private (Vendor only)
 */
exports.updateVendorProfile = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    const vendor = await Vendor.findByPk(id);
    
    if (!vendor) {
      return next(new AppError('Vendor profile not found', 404));
    }
    
    // Check if the authenticated user is the same as the vendor being updated
    if (req.user && req.user.id !== vendor.id) {
      return next(new AppError('You are not authorized to update this vendor profile', 403));
    }
    
    // Track changed fields for notification
    const changedFields = [];
    
    const {
      // Original fields
      vendorName,
      businessName,
      businessDescription,
      website,
      phone,
      taxId,
      bankAccountDetails,

      // Fields from registerVendor
      fullName,
      email,
      businessType,
      mobileNumber,
      alternativeMobileNumber,
      position,
      idProofType,
      idProofNumber,
      companyName,
      shopUrl,
      gstinNumber,
      panNumber,
      establishedYear,
      shopPhoneNumber,
      
      // Address fields
      street,
      city,
      state,
      country,
      postalCode,
      
      // Bank details
      preferredPaymentMethod,
      bankName,
      ifscCode,
      accountNumber,
      paypalId,
      upiId,
      paymentDescription,
      
      // Social media links
      facebookLink,
      twitterLink,
      instagramLink,
      youtubeLink,
      linkedinLink,
      whatsappLink
    } = req.body;
    
    // Update vendor details and track changes
    // Original fields
    if (vendorName && vendor.vendorName !== vendorName) {
      vendor.vendorName = vendorName;
      changedFields.push('vendorName');
    }
    if (businessName && vendor.businessName !== businessName) {
      vendor.businessName = businessName;
      changedFields.push('businessName');
    }
    if (businessDescription && vendor.businessDescription !== businessDescription) {
      vendor.businessDescription = businessDescription;
      changedFields.push('businessDescription');
    }
    if (website && vendor.website !== website) {
      vendor.website = website;
      changedFields.push('website');
    }
    if (phone && vendor.phone !== phone) {
      vendor.phone = phone;
      changedFields.push('phone');
    }
    if (taxId && vendor.taxId !== taxId) {
      vendor.taxId = taxId;
      changedFields.push('taxId');
    }
    if (bankAccountDetails && JSON.stringify(vendor.bankAccountDetails) !== JSON.stringify(bankAccountDetails)) {
      vendor.bankAccountDetails = bankAccountDetails;
      changedFields.push('bankAccountDetails');
    }

    // Fields from registerVendor
    if (fullName && vendor.fullName !== fullName) {
      vendor.fullName = fullName;
      changedFields.push('fullName');
    }
    if (email && vendor.email !== email) {
      vendor.email = email;
      changedFields.push('email');
    }
    if (businessType && vendor.businessType !== businessType) {
      vendor.businessType = businessType;
      changedFields.push('businessType');
    }
    if (mobileNumber && vendor.mobileNumber !== mobileNumber) {
      vendor.mobileNumber = mobileNumber;
      changedFields.push('mobileNumber');
    }
    if (alternativeMobileNumber && vendor.alternativeMobileNumber !== alternativeMobileNumber) {
      vendor.alternativeMobileNumber = alternativeMobileNumber;
      changedFields.push('alternativeMobileNumber');
    }
    if (position && vendor.position !== position) {
      vendor.position = position;
      changedFields.push('position');
    }
    if (idProofType && vendor.idProofType !== idProofType) {
      vendor.idProofType = idProofType;
      changedFields.push('idProofType');
    }
    if (idProofNumber && vendor.idProofNumber !== idProofNumber) {
      vendor.idProofNumber = idProofNumber;
      changedFields.push('idProofNumber');
    }
    if (companyName && vendor.companyName !== companyName) {
      vendor.companyName = companyName;
      changedFields.push('companyName');
    }
    if (shopUrl && vendor.shopUrl !== shopUrl) {
      vendor.shopUrl = shopUrl;
      changedFields.push('shopUrl');
    }
    if (gstinNumber && vendor.gstinNumber !== gstinNumber) {
      vendor.gstinNumber = gstinNumber;
      changedFields.push('gstinNumber');
    }
    if (panNumber && vendor.panNumber !== panNumber) {
      vendor.panNumber = panNumber;
      changedFields.push('panNumber');
    }
    if (establishedYear && vendor.establishedYear !== establishedYear) {
      vendor.establishedYear = establishedYear;
      changedFields.push('establishedYear');
    }
    if (shopPhoneNumber && vendor.shopPhoneNumber !== shopPhoneNumber) {
      vendor.shopPhoneNumber = shopPhoneNumber;
      changedFields.push('shopPhoneNumber');
    }
    
    // Address fields
    if (street && vendor.street !== street) {
      vendor.street = street;
      changedFields.push('street');
    }
    if (city && vendor.city !== city) {
      vendor.city = city;
      changedFields.push('city');
    }
    if (state && vendor.state !== state) {
      vendor.state = state;
      changedFields.push('state');
    }
    if (country && vendor.country !== country) {
      vendor.country = country;
      changedFields.push('country');
    }
    if (postalCode && vendor.postalCode !== postalCode) {
      vendor.postalCode = postalCode;
      changedFields.push('postalCode');
    }
    
    await vendor.save();

    // Update related store if it exists
    let store = null;
    const storeChangedFields = [];
    
    if (vendor.id) {
      store = await Store.findOne({ where: { customer_id: vendor.id } });
      if (store) {
        // Update store information and track changes
        if (companyName && store.name !== companyName) {
          store.name = companyName;
          storeChangedFields.push('name');
        }
        if (shopPhoneNumber && store.phone !== shopPhoneNumber) {
          store.phone = shopPhoneNumber;
          storeChangedFields.push('phone');
        }
        if (street && store.address !== street) {
          store.address = street;
          storeChangedFields.push('address');
        }
        if (city && store.city !== city) {
          store.city = city;
          storeChangedFields.push('city');
        }
        if (state && store.state !== state) {
          store.state = state;
          storeChangedFields.push('state');
        }
        if (postalCode && store.postal_code !== postalCode) {
          store.postal_code = postalCode;
          storeChangedFields.push('postal_code');
        }
        if (country && store.country !== country) {
          store.country = country;
          storeChangedFields.push('country');
        }
        if (businessDescription && store.description !== businessDescription) {
          store.description = businessDescription;
          storeChangedFields.push('description');
        }
        if (website && store.website !== website) {
          store.website = website;
          storeChangedFields.push('website');
        }
        if (gstinNumber && store.gstin !== gstinNumber) {
          store.gstin = gstinNumber;
          storeChangedFields.push('gstin');
        }
        if (panNumber && store.pan !== panNumber) {
          store.pan = panNumber;
          storeChangedFields.push('pan');
        }
        if (establishedYear && store.established_year !== establishedYear) {
          store.established_year = establishedYear;
          storeChangedFields.push('established_year');
        }
        if (businessType && store.business_type !== businessType) {
          store.business_type = businessType;
          storeChangedFields.push('business_type');
        }
        // Bank
        if(preferredPaymentMethod && store.preferred_payment_method !== preferredPaymentMethod){
          store.preferred_payment_method = preferredPaymentMethod;
          storeChangedFields.push('preferred_payment_method');
        }
        if(bankName && store.bank_name !== bankName){
          store.bank_name = bankName;
          storeChangedFields.push('bank_name');
        }
        if(ifscCode && store.ifsc_code !== ifscCode){
          store.ifsc_code = ifscCode;
          storeChangedFields.push('ifsc_code');
        }
        if(accountNumber && store.account_number !== accountNumber){
          store.account_number = accountNumber;
          storeChangedFields.push('account_number');
        }
        if(paypalId && store.paypal_id !== paypalId){
          store.paypal_id = paypalId;
          storeChangedFields.push('paypal_id');
        }
        if(upiId && store.upi_id !== upiId){
          store.upi_id = upiId;
          storeChangedFields.push('upi_id');
        }
        if(paymentDescription && store.payment_description !== paymentDescription){
          store.payment_description = paymentDescription;
          storeChangedFields.push('payment_description');
        }
        // Social media links
        if (facebookLink && store.facebook_link !== facebookLink) {
          store.facebook_link = facebookLink;
          storeChangedFields.push('facebook_link');
        }
        if (twitterLink && store.twitter_link !== twitterLink) {
          store.twitter_link = twitterLink;
          storeChangedFields.push('twitter_link');
        }
        if (instagramLink && store.instagram_link !== instagramLink) {
          store.instagram_link = instagramLink;
          storeChangedFields.push('instagram_link');
        }
        if (youtubeLink && store.youtube_link !== youtubeLink) {
          store.youtube_link = youtubeLink;
          storeChangedFields.push('youtube_link');
        }
        if (linkedinLink && store.linkedin_link !== linkedinLink) {
          store.linkedin_link = linkedinLink;
          storeChangedFields.push('linkedin_link');
        }
        if (whatsappLink && store.whatsapp_link !== whatsappLink) {
          store.whatsapp_link = whatsappLink;
          storeChangedFields.push('whatsapp_link');
        }
        
        store.updated_at = new Date();
        
        await store.save();
      }
    }
    
    // Send notifications if there were changes
    const eventNotificationService = require('../services/eventNotificationService');
    
    // Send vendor profile update notification if fields were changed
    if (changedFields.length > 0) {
      await eventNotificationService.notifyVendorProfileUpdated(vendor, changedFields);
    }
    
    // Send store update notification if store fields were changed
    if (store && storeChangedFields.length > 0) {
      await eventNotificationService.notifyStoreUpdated(store, vendor.id, storeChangedFields);
    }
    
    // Exclude password from response
    const vendorResponse = vendor.toJSON();
    delete vendorResponse.password;
    
    res.status(200).json({
      status: 'success',
      data: {
        vendor: vendorResponse,
        store: vendor.id ? await Store.findOne({ where: { customer_id: vendor.id } }) : null
      }
    });
});

/**
 * Upload vendor logo
 * @route PATCH /api/vendors/upload-logo/:id
 * @access Private (Vendor only)
 * @note This endpoint uses file upload middleware to handle logo uploads
 */
exports.uploadLogo = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const vendor = await Vendor.findByPk(id);

    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }

    // Check if the authenticated user is the same as the vendor being updated
    if (req.user && req.user.id !== vendor.id) {
      return next(new AppError('You are not authorized to upload logo for this vendor', 403));
    }

    // Check if file was uploaded
    if (!req.file) {
      return next(new AppError('No logo file provided', 400));
    }
    
    // Validate file size (additional validation if needed)
    if (req.file.size > 5 * 1024 * 1024) { // 5MB limit
      return next(new AppError('Logo file size exceeds the 5MB limit', 400));
    }
    
    // Get the file path of the uploaded logo
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    
    // Update the vendor's logo URL
    vendor.logoUrl = logoUrl;
    await vendor.save();
    
    // Also update the store logo if this vendor has a store
    const store = await Store.findOne({ where: { customer_id: id } });
    if (store) {
      store.logo = logoUrl;
      await store.save();
    }
    
    // Exclude password from response
    const vendorResponse = vendor.toJSON();
    delete vendorResponse.password;
    
    res.status(200).json({
      status: 'success',
      message: 'Logo uploaded successfully',
      data: {
        vendor: vendorResponse,
        store: store || null
      }
    });
});

/**
 * Get vendor dashboard statistics
 * @route GET /api/vendors/dashboard/:id
 * @access Private (Vendor only)
 */
exports.getVendorDashboard = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    const vendor = await Vendor.findByPk(id);
    
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }
    
    // Check if the authenticated user is the same as the vendor being accessed
    if (req.user && req.user.id !== vendor.id) {
      return next(new AppError('You are not authorized to access this vendor dashboard', 403));
    }
    
    // Get associated store data if exists
    const store = await Store.findOne({ where: { customer_id: vendor.id } });
    
    // Exclude password from response
    const vendorResponse = vendor.toJSON();
    delete vendorResponse.password;
    
    res.status(200).json({
      status: 'success',
      data: {
        vendor: vendorResponse,
        store: store || null,
        stats: {
          totalOrders: 0,  // Placeholder for actual order count
          pendingOrders: 0,  // Placeholder for pending orders
          revenue: 0,  // Placeholder for revenue
          products: 0  // Placeholder for product count
        }
      }
    });
});

/**
 * Register a new vendor - First step (without OTP verification)
 * @route POST /api/vendors/register
 * @access Public
 */
exports.registerVendor = catchAsync(async (req, res, next) => {
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
    idProofNumber,
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
    country,
    deviceToken
  } = req.body;

  // Validate required fields
  if (!fullName) {
    return next(new AppError('Full name is required', 400));
  }
  
  if (!email) {
    return next(new AppError('Email is required', 400));
  }
  
  if (!password) {
    return next(new AppError('Password is required', 400));
  }
  
  if (!businessType) {
    return next(new AppError('Business type is required', 400));
  }
  
  if (!mobileNumber) {
    return next(new AppError('Mobile number is required', 400));
  }
  
  if (!companyName) {
    return next(new AppError('Company name is required', 400));
  }
  
  // Validate password match
  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }
  
  // Validate password strength
  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }
    
    if (!email) {
      return next(new AppError('Email is required', 400));
    }
    
    if (!password) {
      return next(new AppError('Password is required', 400));
    }
    
    if (!businessType) {
      return next(new AppError('Business type is required', 400));
    }
    
    if (!mobileNumber) {
      return next(new AppError('Mobile number is required', 400));
    }
    
    if (!companyName) {
      return next(new AppError('Company name is required', 400));
    }
    
    // Validate password match
    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }
    
    // Validate password strength
    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }

    // Check if vendor already exists with this email
    const existingVendorByEmail = await Vendor.findOne({ where: { email } });
    if (existingVendorByEmail) {
      return next(new AppError('Email already in use', 400));
    }

    // Check if vendor already exists with this mobile number
    const existingVendorByMobile = await Vendor.findOne({ where: { mobileNumber } });
    if (existingVendorByMobile) {
      return next(new AppError('Mobile number already in use', 400));
    }
    
    // Validate ID proof type
    // if (idProofType && !['Aadhar Card', 'PAN Card', 'Driving License', 'Voter ID'].includes(idProofType)) {
    //   return next(new AppError('Invalid ID proof type. Must be one of: Aadhar Card, PAN Card, Driving License, Voter ID', 400));
    // }

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
      idProofNumber,
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

    // Save device token if provided
    if (deviceToken) {
      newVendor.deviceToken = deviceToken;
      newVendor.notificationsEnabled = true;
    }

    // Save the vendor to the database
    await newVendor.save();

    // Create a new store associated with this vendor
    const store = await Store.create({
      name: companyName,
      customer_id: newVendor.id,
      phone: shopPhoneNumber || mobileNumber,
      address: street,
      city,
      state,
      country,
      postal_code: postalCode,
      established_year: establishedYear,
      gstin: gstinNumber,
      pan: panNumber,
      business_type: businessType,
      description: '',
      status: 'pending',
      vendor_verified_at: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Generate and send OTP to the mobile number
    let otpSent = false;
    let otpRecord = null;
    
    try {
      // Create OTP record
      otpRecord = await otpService.createOTP(mobileNumber);
      
      // Send OTP via SMS
      otpSent = await otpService.sendOTP(mobileNumber, otpRecord.otp, deviceToken);
      
      // Send push notification with OTP if device token is provided
      if (deviceToken) {
        await notificationService.sendNotification(
          deviceToken,
          'OTP Verification',
          `Your OTP is ${otpRecord.otp}. It will expire in 10 minutes.`,
          { type: 'otp', otp: otpRecord.otp }
        );
      }
    } catch (error) {
      console.error('Error sending OTP during registration:', error);
      // We'll continue with registration even if OTP fails
      // The message in the response will indicate there was an issue
    }

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
        store: store
      }
    });
});

/**
 * Send OTP for mobile verification
 * @route POST /api/vendors/send-otp
 * @access Public
 */
exports.sendOTP = catchAsync(async (req, res, next) => {
    const { mobileNumber, deviceToken } = req.body;

    if (!mobileNumber) {
      return next(new AppError('Mobile number is required', 400));
    }
    
    // Validate mobile number format (basic validation)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return next(new AppError('Invalid mobile number format. Must be 10 digits', 400));
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

    // Check if OTP was created successfully
    if (!otpRecord) {
      return next(new AppError('Failed to generate OTP', 500));
    }
    
    res.status(200).json({
      status: 'success',
      otp: otpRecord.otp,
      message: otpSent ? 'OTP sent successfully' : 'There was an issue sending OTP'
    });
});

/**
 * Verify OTP and update vendor's mobile verification status
 * @route POST /api/vendors/verify-otp
 * @access Public
 */
/**
 * Update device token and notification preferences
 * @route PATCH /api/vendors/device-token
 * @access Private (Vendor only)
 */
exports.updateDeviceToken = catchAsync(async (req, res, next) => {
    const { deviceToken, notificationsEnabled } = req.body;
    const vendorId = req.user.id;
    
    // Validate device token if provided
    if (deviceToken !== undefined && (!deviceToken || typeof deviceToken !== 'string')) {
      return next(new AppError('Valid device token is required', 400));
    }
    
    // Find the vendor
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }
    
    // Update device token if provided
    if (deviceToken !== undefined) {
      vendor.deviceToken = deviceToken;
      
      // Subscribe to topics if token is provided and different from existing
      if (deviceToken && vendor.deviceToken !== deviceToken) {
        const eventNotificationService = require('../services/eventNotificationService');
        await eventNotificationService.subscribeDeviceToTopics(deviceToken, 'vendor', vendor.id);
      }
    }
    
    // Update notifications preference if provided
    if (notificationsEnabled !== undefined) {
      vendor.notificationsEnabled = !!notificationsEnabled;
    }
    
    await vendor.save();
    
    // Exclude password from response
    const vendorResponse = vendor.toJSON();
    delete vendorResponse.password;
    
    res.status(200).json({
      status: 'success',
      message: 'Device token and notification preferences updated successfully',
      data: {
        vendor: vendorResponse
      }
    });
});

exports.verifyOTP = catchAsync(async (req, res, next) => {
    const { mobileNumber, otp, vendorId, deviceToken } = req.body;

    if (!mobileNumber) {
      return next(new AppError('Mobile number is required', 400));
    }
    
    if (!otp) {
      return next(new AppError('OTP is required', 400));
    }
    
    // Validate mobile number format
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return next(new AppError('Invalid mobile number format. Must be 10 digits', 400));
    }
    
    // Validate OTP format (assuming it's a 6-digit number)
    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp)) {
      return next(new AppError('Invalid OTP format. Must be 6 digits', 400));
    }

    // Verify OTP
    const verificationResult = await otpService.verifyOTP(mobileNumber, otp);

    if (!verificationResult.verified) {
      return next(new AppError(verificationResult.message || 'OTP verification failed', 400));
    }

    // If vendorId is provided, update the vendor's mobile verification status
    if (vendorId) {
      const vendor = await Vendor.findByPk(vendorId);
      
      if (!vendor) {
        return next(new AppError('Vendor not found with the provided ID', 404));
      }
      
      if (vendor.mobileNumber !== mobileNumber) {
        return next(new AppError('Mobile number does not match the vendor record', 400));
      }
      
      vendor.isMobileVerified = true;
      
      // Update device token if provided
      if (deviceToken && vendor.deviceToken !== deviceToken) {
        vendor.deviceToken = deviceToken;
        vendor.notificationsEnabled = true;
        
        // Subscribe to relevant topics after saving
        const eventNotificationService = require('../services/eventNotificationService');
        await eventNotificationService.subscribeDeviceToTopics(deviceToken, 'vendor', vendor.id);
      }
      
      await vendor.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully'
    });
});

/**
 * Login vendor
 * @route POST /api/vendors/login
 * @access Public
 */
exports.loginVendor = catchAsync(async (req, res, next) => {
    const { email, password, deviceToken } = req.body;
    
    // Validate required fields
    if (!email) {
      return next(new AppError('Email is required', 400));
    }
    
    if (!password) {
      return next(new AppError('Password is required', 400));
    }
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return next(new AppError('Invalid email format', 400));
    }

    // Check if vendor exists
    const vendor = await Vendor.findOne({ where: { email } });
    if (!vendor) {
      // Use 401 for authentication failures but with a more specific message
      return next(new AppError('No vendor found with this email', 401));
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return next(new AppError('Incorrect password', 401));
    }
    
    // Check if vendor account is active
    if (vendor.status === 'rejected') {
      return next(new AppError('Your account has been rejected. Please contact support.', 403));
    }

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        { id: vendor.id, role: 'vendor' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
    } catch (error) {
      return next(new AppError('Error generating authentication token', 500));
    }

    // Get associated store data if exists
    const store = await Store.findOne({ where: { customer_id: vendor.id } });

    // Remove password from response
    const vendorResponse = { ...vendor.toJSON() };
    delete vendorResponse.password;

    // Update device token if provided
    if (deviceToken) {
      // Update only if it's different from the existing token
      if (vendor.deviceToken !== deviceToken) {
        vendor.deviceToken = deviceToken;
        await vendor.save();
        
        // Subscribe to relevant topics
        const eventNotificationService = require('../services/eventNotificationService');
        await eventNotificationService.subscribeDeviceToTopics(deviceToken, 'vendor', vendor.id);
      }
    }
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        vendor: vendorResponse,
        store: store || null
      }
    });
});

/**
 * Upload ID Proof for Vendor
 * @route POST /api/vendors/upload-id-proof/:id
 * @access Private
 */
exports.uploadIdProof = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!req.file) {
      return next(new AppError('No file uploaded or invalid file format', 400));
    }

    const vendor = await Vendor.findByPk(id);
    
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }
    
    // Check if the authenticated user is the same as the vendor being updated
    if (req.user && req.user.id !== vendor.id) {
      return next(new AppError('You are not authorized to upload ID proof for this vendor', 403));
    }
    
    // Get associated store data
    const store = await Store.findOne({ where: { customer_id: id } });
    
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
        vendor: vendorResponse,
        store: store || null
      }
    });
});

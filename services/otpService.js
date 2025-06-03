const { OTP } = require('../models/OTP');
const notificationService = require('./notificationService');

/**
 * Generate a random OTP of specified length
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} Generated OTP
 */
const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

/**
 * Create and save OTP for a mobile number
 * @param {string} mobileNumber - Mobile number to send OTP
 * @returns {Promise<Object>} OTP object
 */
exports.createOTP = async (mobileNumber) => {
  try {
    // Delete any existing OTPs for this mobile number
    await OTP.destroy({ where: { mobileNumber } });
    
    // Generate new OTP
    const otpCode = generateOTP();
    
    // Set expiry time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    // Save OTP to database
    const otpRecord = await OTP.create({
      mobileNumber,
      otp: otpCode,
      expiresAt,
      isVerified: false
    });
    
    return otpRecord;
  } catch (error) {
    console.error('Error creating OTP:', error);
    throw error;
  }
};

/**
 * Send OTP via SMS and/or push notification
 * @param {string} mobileNumber - Mobile number to send OTP
 * @param {string} otp - OTP to send
 * @param {string} deviceToken - Firebase device token (optional)
 * @returns {Promise<boolean>} Success status
 */
exports.sendOTP = async (mobileNumber, otp, deviceToken = null) => {
  try {
    // Here you would integrate with an SMS service to send the OTP
    // For this implementation, we'll just log it and assume it's sent
    console.log(`Sending OTP ${otp} to ${mobileNumber}`);
    
    // If device token is provided, also send as push notification
    if (deviceToken) {
      await notificationService.sendNotification(
        deviceToken,
        'Verification Code',
        `Your OTP is ${otp}. It will expire in 10 minutes.`,
        { type: 'otp', otp }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

/**
 * Verify OTP for a mobile number
 * @param {string} mobileNumber - Mobile number to verify
 * @param {string} otpCode - OTP to verify
 * @returns {Promise<boolean>} Verification status
 */
exports.verifyOTP = async (mobileNumber, otpCode) => {
  try {
    // Find latest OTP for this mobile number
    const otpRecord = await OTP.findOne({
      where: { mobileNumber },
      order: [['createdAt', 'DESC']]
    });
    
    if (!otpRecord) {
      return { verified: false, message: 'No OTP found for this mobile number' };
    }
    
    // Check if OTP is expired
    const now = new Date();
    if (now > otpRecord.expiresAt) {
      return { verified: false, message: 'OTP has expired' };
    }
    
    // Check if OTP matches
    if (otpRecord.otp !== otpCode) {
      return { verified: false, message: 'Invalid OTP' };
    }
    
    // Mark OTP as verified
    otpRecord.isVerified = true;
    await otpRecord.save();
    
    return { verified: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { verified: false, message: 'Error verifying OTP' };
  }
};

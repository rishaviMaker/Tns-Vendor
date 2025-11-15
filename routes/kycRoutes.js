const express = require('express');
const { authenticate } = require('../middlewares/auth');
const cashfreeService = require('../services/cashfreeService');
const { Vendor } = require('../models/Vendor');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: KYC
 *   description: KYC verification APIs
 */

/**
 * @swagger
 * /api/vendor/kyc/pan:
 *   post:
 *     summary: Verify PAN Card
 *     description: Verify PAN card details
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idProof
 *             properties:
 *               idProof:
 *                 type: string
 *                 description: PAN card number
 *               name:
 *                 type: string
 *                 description: Name as per PAN card (optional)
 *     responses:
 *       200:
 *         description: PAN verification result
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/pan', async (req, res) => {
  try {
    const { idProof, name } = req.body;
    
    if (!idProof) {
      return res.status(400).json({
        success: false,
        message: 'PAN number is required'
      });
    }
    
    // Verify PAN with Cashfree
    const result = await cashfreeService.verifyPAN(idProof, name);
    
    // If PAN verification is successful, cross-check with Aadhaar data
    if (result.verified && req.user && req.user.id) {
      const vendor = await Vendor.findByPk(req.user.id);
      
      // Check if vendor has verified Aadhaar
      if (vendor && vendor.isAadharVerified && vendor.kycVerificationData) {
        const aadhaarData = vendor.kycVerificationData.aadhaar;
        
        if (aadhaarData && aadhaarData.data) {
          // Extract names from both documents
          const panName = result.data?.registered_name || result.data?.name || '';
          const aadhaarName = aadhaarData.data?.name || aadhaarData.data?.full_name || '';
          
          // Normalize names for comparison (remove extra spaces, convert to lowercase)
          const normalizeName = (name) => name.trim().toLowerCase().replace(/\s+/g, ' ');
          
          if (panName && aadhaarName) {
            const normalizedPanName = normalizeName(panName);
            const normalizedAadhaarName = normalizeName(aadhaarName);
            
            // Check if names match (exact or partial match)
            const namesMatch = normalizedPanName === normalizedAadhaarName || 
                              normalizedPanName.includes(normalizedAadhaarName) ||
                              normalizedAadhaarName.includes(normalizedPanName);
            
            if (!namesMatch) {
              return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Name mismatch: PAN card name does not match with Aadhaar card name',
                data: {
                  panName: panName,
                  aadhaarName: aadhaarName,
                  verified: false
                }
              });
            }
          }
        }
      }
    }
    
    return res.json({
      status: result.verified ? "success" : "error",
      success: result.verified,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in PAN verification route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during PAN verification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendor/kyc/aadhaar/otp:
 *   post:
 *     summary: Request OTP for Aadhaar Verification
 *     description: Send OTP to the mobile number registered with Aadhaar
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idProof
 *             properties:
 *               idProof:
 *                 type: string
 *                 description: Aadhaar number
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/aadhaar/otp', async (req, res) => {
  try {
    const { idProof } = req.body;
    
    if (!idProof) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number is required'
      });
    }
    
    // Call the verifyAadhaar function without OTP - this will trigger the OTP request
    const result = await cashfreeService.verifyAadhaar(idProof);
    
    return res.json({
      status: result.success ? "success" : "error",
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in Aadhaar OTP request route:', error);
    return res.status(500).json({
      status: "error",
      success: false,
      message: 'Error during Aadhaar OTP request',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendor/kyc/aadhaar/verify:
 *   post:
 *     summary: Verify Aadhaar with OTP
 *     description: Complete Aadhaar verification using OTP and request ID
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idProof
 *               - otp
 *               - requestId
 *             properties:
 *               idProof:
 *                 type: string
 *                 description: Aadhaar number
 *               otp:
 *                 type: string
 *                 description: OTP received on registered mobile
 *               requestId:
 *                 type: string
 *                 description: Request ID received from OTP request
 *               name:
 *                 type: string
 *                 description: Name as per Aadhaar (optional)
 *     responses:
 *       200:
 *         description: Aadhaar verification result
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/aadhaar/verify', async (req, res) => {
  try {
    const { idProof, otp, requestId, name } = req.body;
    
    if (!idProof || !otp || !requestId) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number, OTP, and request ID are required'
      });
    }
    
    const result = await cashfreeService.verifyAadhaar(idProof, name, otp, requestId);
    
    return res.json({
      status: result.verified ? "success" : "error",
      success: result.verified,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in Aadhaar verification route:', error);
    return res.status(500).json({
      status: "error",
      success: false,
      message: 'Error during Aadhaar verification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendor/kyc/aadhaar:
 *   post:
 *     summary: Verify Aadhaar Card (Legacy)
 *     description: Backward compatibility endpoint for Aadhaar verification - initiates OTP flow
 *     tags: [KYC]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idProof
 *             properties:
 *               idProof:
 *                 type: string
 *                 description: Aadhaar number
 *               name:
 *                 type: string
 *                 description: Name as per Aadhaar (optional)
 *     responses:
 *       200:
 *         description: Aadhaar OTP request initiated
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/aadhaar', async (req, res) => {
  try {
    const { idProof, name } = req.body;
    
    if (!idProof) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number is required'
      });
    }
    
    // Call the verifyAadhaar function without OTP - this will trigger the OTP request
    const result = await cashfreeService.verifyAadhaar(idProof, name);
    
    return res.json({
      success: result.success,
      message: "Aadhaar verification now requires OTP. Please use the new endpoints: /api/vendor/kyc/aadhaar/otp and /api/vendor/kyc/aadhaar/verify",
      data: result.data
    });
  } catch (error) {
    console.error('Error in legacy Aadhaar verification route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during Aadhaar verification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendor/kyc/dl:
 *   post:
 *     summary: Verify Driving License
 *     description: Verify driving license details
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idProof
 *             properties:
 *               idProof:
 *                 type: string
 *                 description: Driving license number
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth in YYYY-MM-DD format (optional)
 *     responses:
 *       200:
 *         description: DL verification result
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/dl', async (req, res) => {
  try {
    const { idProof, dob } = req.body;
    
    if (!idProof) {
      return res.status(400).json({
        success: false,
        message: 'Driving license number is required'
      });
    }
    
    const result = await cashfreeService.verifyDL(idProof, dob);
    
    return res.json({
      success: result.verified,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in DL verification route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during driving license verification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendor/kyc/gstin:
 *   post:
 *     summary: Verify GSTIN
 *     description: Verify GSTIN details
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idProof
 *             properties:
 *               idProof:
 *                 type: string
 *                 description: GSTIN number
 *     responses:
 *       200:
 *         description: GSTIN verification result
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/gstin', async (req, res) => {
  try {
    const { idProof } = req.body;
    
    if (!idProof) {
      return res.status(400).json({
        success: false,
        message: 'GSTIN is required'
      });
    }
    
    const result = await cashfreeService.verifyGSTIN(idProof);
    
    return res.json({
      status: result.invalid ? "invalid" : result.verified ? "success" : "error",
      success: result.invalid ? false : result.verified,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GSTIN verification route:', error);
    return res.status(500).json({
      status: "error",
      success: false,
      message: 'Error during GSTIN verification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendor/kyc/voterid:
 *   post:
 *     summary: Verify Voter ID
 *     description: Verify Voter ID details
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idProof
 *             properties:
 *               idProof:
 *                 type: string
 *                 description: Voter ID number
 *               name:
 *                 type: string
 *                 description: Name as per Voter ID (optional)
 *     responses:
 *       200:
 *         description: Voter ID verification result
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/voterid', async (req, res) => {
  try {
    const { idProof, name } = req.body;
    
    if (!idProof) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID number is required'
      });
    }
    
    const result = await cashfreeService.verifyVoterId(idProof, { name });
    
    return res.json({
      success: result.verified,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in Voter ID verification route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during Voter ID verification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendor/kyc/verify:
 *   post:
 *     summary: Verify any ID proof
 *     description: Generic endpoint to verify any type of ID proof
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idProofType
 *               - idProof
 *             properties:
 *               idProofType:
 *                 type: string
 *                 enum: [PAN Card, Aadhar Card, Driving License, Voter ID]
 *                 description: Type of ID proof
 *               idProof:
 *                 type: string
 *                 description: ID proof number
 *               name:
 *                 type: string
 *                 description: Name as per ID (optional)
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth in YYYY-MM-DD format (optional for DL)
 *     responses:
 *       200:
 *         description: Verification result
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/verify', async (req, res) => {
  try {
    const { idProofType, idProof, ...options } = req.body;
    
    if (!idProofType || !idProof) {
      return res.status(400).json({
        success: false,
        message: 'ID proof type and ID proof number are required'
      });
    }
    
    const result = await cashfreeService.verifyIdProof(idProofType, idProof, options);
    
    return res.json({
      success: result.verified,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in ID verification route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during ID verification',
      error: error.message
    });
  }
});

module.exports = router;

/**
 * Cashfree KYC Verification Service
 * Provides methods to verify various identity documents through Cashfree API
 */

const axios = require('axios');

// KYC verification API endpoints
const CASHFREE_API_BASE_URL = process.env.CASHFREE_API_BASE_URL || 'https://api.cashfree.com/verification';
const PAN_VERIFICATION_ENDPOINT = '/pan';
const AADHAAR_VERIFICATION_ENDPOINT = '/aadhaar';
const DL_VERIFICATION_ENDPOINT = '/dl';
const GSTIN_VERIFICATION_ENDPOINT = '/gstin';

// Cache to store recent successful verifications (to reduce API calls)
const verificationCache = {
  pan: new Map(),
  aadhaar: new Map(),
  dl: new Map(),
  gstin: new Map()
};

// Expiry time for cache entries (24 hours)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Helper to get authentication headers for Cashfree API requests
 * @returns {Object} Headers with authentication details
 */
const getCashfreeHeaders = () => {
  return {
    'x-client-id': process.env.CASHFREE_CLIENT_ID,
    'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
    'x-api-version': '2022-01-01',
    'Content-Type': 'application/json'
  };
};

/**
 * Check cache for existing verification
 * @param {string} type - Verification type (pan, aadhaar, dl, gstin)
 * @param {string} id - ID number
 * @returns {Object|null} Cached result or null if not found/expired
 */
const checkCache = (type, id) => {
  if (!verificationCache[type] || !verificationCache[type].has(id)) {
    return null;
  }
  
  const entry = verificationCache[type].get(id);
  const now = Date.now();
  
  if (now - entry.timestamp > CACHE_EXPIRY_MS) {
    // Remove expired entry
    verificationCache[type].delete(id);
    return null;
  }
  
  return entry.result;
};

/**
 * Add verification result to cache
 * @param {string} type - Verification type (pan, aadhaar, dl, gstin)
 * @param {string} id - ID number
 * @param {Object} result - Verification result
 */
const cacheResult = (type, id, result) => {
  if (!verificationCache[type]) {
    return;
  }
  
  verificationCache[type].set(id, {
    result,
    timestamp: Date.now()
  });
};

/**
 * Verify PAN Card details
 * @param {string} panNumber - PAN card number to verify
 * @param {string} name - Name as per PAN card (optional)
 * @returns {Promise<Object>} Verification result
 */
const verifyPAN = async (panNumber, name = '') => {
  try {
    // Check cache first
    const cachedResult = checkCache('pan', panNumber);
    if (cachedResult) {
      return {
        verified: cachedResult.verified,
        message: 'Verification result from cache',
        data: cachedResult
      };
    }

    const response = await axios.post(
      `${CASHFREE_API_BASE_URL}${PAN_VERIFICATION_ENDPOINT}`,
      { pan: panNumber, name: name },
      { headers: getCashfreeHeaders() }
    );

    const result = response.data;
    const verified = result.status === 'SUCCESS' || result.status === 'VALID';

    // Cache successful verifications
    if (verified) {
      cacheResult('pan', panNumber, {
        verified,
        ...result
      });
    }

    return {
      verified,
      message: verified ? 'PAN verified successfully' : 'PAN verification failed',
      data: result
    };
  } catch (error) {
    console.error('Error verifying PAN:', error.response?.data || error.message);
    return {
      verified: false,
      message: 'Error during PAN verification',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Verify Aadhaar Card details
 * @param {string} aadhaarNumber - Aadhaar number to verify
 * @param {string} name - Name as per Aadhaar (optional)
 * @returns {Promise<Object>} Verification result
 */
const verifyAadhaar = async (aadhaarNumber, name = '') => {
  try {
    // Check cache first
    const cachedResult = checkCache('aadhaar', aadhaarNumber);
    if (cachedResult) {
      return {
        verified: cachedResult.verified,
        message: 'Verification result from cache',
        data: cachedResult
      };
    }

    const response = await axios.post(
      `${CASHFREE_API_BASE_URL}${AADHAAR_VERIFICATION_ENDPOINT}`,
      { aadhaar: aadhaarNumber, name: name },
      { headers: getCashfreeHeaders() }
    );

    const result = response.data;
    const verified = result.status === 'SUCCESS' || result.status === 'VALID';

    // Cache successful verifications
    if (verified) {
      cacheResult('aadhaar', aadhaarNumber, {
        verified,
        ...result
      });
    }

    return {
      verified,
      message: verified ? 'Aadhaar verified successfully' : 'Aadhaar verification failed',
      data: result
    };
  } catch (error) {
    console.error('Error verifying Aadhaar:', error.response?.data || error.message);
    return {
      verified: false,
      message: 'Error during Aadhaar verification',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Verify Driving License details
 * @param {string} dlNumber - Driving license number to verify
 * @param {string} dob - Date of birth in YYYY-MM-DD format (optional)
 * @returns {Promise<Object>} Verification result
 */
const verifyDL = async (dlNumber, dob = '') => {
  try {
    // Check cache first
    const cachedResult = checkCache('dl', dlNumber);
    if (cachedResult) {
      return {
        verified: cachedResult.verified,
        message: 'Verification result from cache',
        data: cachedResult
      };
    }

    const response = await axios.post(
      `${CASHFREE_API_BASE_URL}${DL_VERIFICATION_ENDPOINT}`,
      { dl: dlNumber, dob: dob },
      { headers: getCashfreeHeaders() }
    );

    const result = response.data;
    const verified = result.status === 'SUCCESS' || result.status === 'VALID';

    // Cache successful verifications
    if (verified) {
      cacheResult('dl', dlNumber, {
        verified,
        ...result
      });
    }

    return {
      verified,
      message: verified ? 'DL verified successfully' : 'DL verification failed',
      data: result
    };
  } catch (error) {
    console.error('Error verifying DL:', error.response?.data || error.message);
    return {
      verified: false,
      message: 'Error during DL verification',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Verify GSTIN details
 * @param {string} gstinNumber - GSTIN to verify
 * @returns {Promise<Object>} Verification result
 */
const verifyGSTIN = async (gstinNumber) => {
  try {
    // Check cache first
    const cachedResult = checkCache('gstin', gstinNumber);
    if (cachedResult) {
      return {
        verified: cachedResult.verified,
        message: 'Verification result from cache',
        data: cachedResult
      };
    }

    const response = await axios.post(
      `${CASHFREE_API_BASE_URL}${GSTIN_VERIFICATION_ENDPOINT}`,
      { gstin: gstinNumber },
      { headers: getCashfreeHeaders() }
    );

    const result = response.data;
    const verified = result.status === 'SUCCESS' || result.status === 'VALID';

    // Cache successful verifications
    if (verified) {
      cacheResult('gstin', gstinNumber, {
        verified,
        ...result
      });
    }

    return {
      verified,
      message: verified ? 'GSTIN verified successfully' : 'GSTIN verification failed',
      data: result
    };
  } catch (error) {
    console.error('Error verifying GSTIN:', error.response?.data || error.message);
    return {
      verified: false,
      message: 'Error during GSTIN verification',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Verify ID proof based on type
 * @param {string} idProofType - Type of ID proof (Aadhar Card, PAN Card, Driving License)
 * @param {string} idProofNumber - ID proof number
 * @param {Object} options - Additional options like name, dob etc.
 * @returns {Promise<Object>} Verification result
 */
const verifyIdProof = async (idProofType, idProofNumber, options = {}) => {
  switch (idProofType) {
    case 'PAN Card':
      return await verifyPAN(idProofNumber, options.name);
    case 'Aadhar Card':
      return await verifyAadhaar(idProofNumber, options.name);
    case 'Driving License':
      return await verifyDL(idProofNumber, options.dob);
    default:
      return {
        verified: false,
        message: `Unsupported ID proof type: ${idProofType}`
      };
  }
};

module.exports = {
  verifyPAN,
  verifyAadhaar,
  verifyDL,
  verifyGSTIN,
  verifyIdProof
};

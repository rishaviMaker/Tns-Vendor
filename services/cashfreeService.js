/**
 * Cashfree KYC Verification Service
 * Provides methods to verify various identity documents through Cashfree API
 */

const axios = require('axios');

// KYC verification API endpoints
// Base URL for Cashfree API
const CASHFREE_API_BASE_URL = process.env.CASHFREE_API_BASE_URL || 'https://api.cashfree.com/verification';
const PAN_VERIFICATION_ENDPOINT = '/pan';
// Using offline-aadhaar endpoint based on Cashfree documentation
const AADHAAR_VERIFICATION_ENDPOINT = '/offline-aadhaar';
const DL_VERIFICATION_ENDPOINT = '/dl';
const GSTIN_VERIFICATION_ENDPOINT = '/gstin';
const VOTER_ID_VERIFICATION_ENDPOINT = '/voterid';

// Cache to store recent successful verifications (to reduce API calls)
const verificationCache = {
  pan: new Map(),
  aadhaar: new Map(),
  dl: new Map(),
  gstin: new Map(),
  voterId: new Map()
};

// Expiry time for cache entries (24 hours)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Name matching threshold (60% similarity required for flexible matching)
// Adjust this value based on your requirements:
// - 0.50 (50%): Very lenient, allows significant differences
// - 0.60 (60%): Balanced, handles middle names and minor variations
// - 0.70 (70%): Moderate, requires closer match
// - 0.80 (80%): Strict, only minor typos allowed
const NAME_MATCH_THRESHOLD = 0.50;

/**
 * Calculate similarity between two strings using Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
const calculateStringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  // Normalize strings: lowercase, remove extra spaces, remove special characters
  const normalize = (str) => str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  // If strings are identical after normalization
  if (s1 === s2) return 1;
  
  // Check if one name contains the other (partial match)
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }
  
  // Levenshtein distance algorithm
  const matrix = [];
  const len1 = s1.length;
  const len2 = s2.length;
  
  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  
  // Return similarity score (1 - normalized distance)
  return 1 - (distance / maxLength);
};

/**
 * Check if two names match with a given threshold
 * @param {string} name1 - First name
 * @param {string} name2 - Second name
 * @param {number} threshold - Minimum similarity threshold (default 0.50 = 50%)
 * @returns {Object} Match result with similarity score
 */
const checkNameMatch = (name1, name2, threshold = NAME_MATCH_THRESHOLD) => {
  const similarity = calculateStringSimilarity(name1, name2);
  const matched = similarity >= threshold;
  
  return {
    matched,
    similarity: Math.round(similarity * 100), // Convert to percentage
    threshold: Math.round(threshold * 100)
  };
};

/**
 * Helper to get authentication headers for Cashfree API requests
 * @returns {Object} Headers with authentication details
 */
const getCashfreeHeaders = () => {
  // Primary credentials from environment variables
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  
  // Fallback credentials for development - THESE SHOULD BE REPLACED WITH ACTUAL VALUES IN PRODUCTION
  // NOTE: This is only for development purposes. In a production environment, always use environment variables.
  const fallbackClientId = 'CF774792CVV4EV5IEPUC73B3JRMG'; // Your actual client ID 
  const fallbackClientSecret = ''; // Your actual client secret needs to be added here for testing
  
  // Use environment variables if available, otherwise use fallbacks
  const finalClientId = clientId || fallbackClientId;
  const finalClientSecret = clientSecret || fallbackClientSecret;
  
  // Log authentication status for debugging
  if (!finalClientSecret) {
    console.error('🚨 CRITICAL: Cashfree client secret is missing. Authentication will fail!');
    console.error('Please add CASHFREE_CLIENT_SECRET to your environment variables or update the fallback in getCashfreeHeaders()');
  }
  
  if (!finalClientId) {
    console.error('🚨 CRITICAL: Cashfree client ID is missing!');
  }

  // Return headers with the best credentials we have
  return {
    'x-client-id': finalClientId || '',
    'x-client-secret': finalClientSecret || '',
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

    // Log request details for debugging
    const url = `${CASHFREE_API_BASE_URL}${PAN_VERIFICATION_ENDPOINT}`;
    
    // Using snake_case for consistency with Aadhaar endpoint
    const payload = {
      pan: panNumber,
      name: name || ''
    };
    
    const headers = getCashfreeHeaders();
    
    console.log('PAN Verification Request:', { url, payload, headers: { ...headers, 'x-client-secret': '[REDACTED]' } });

    const response = await axios.post(
      url,
      payload,
      { headers }
    );

    const result = response.data;
    const verified = result.valid === true;

    // Check name match if name is provided
    if (verified && name && result.registered_name) {
      const nameMatchResult = checkNameMatch(name, result.registered_name);
      
      if (!nameMatchResult.matched) {
        return {
          verified: false,
          message: `Name mismatch: PAN card name does not match with provided name (${nameMatchResult.similarity}% similarity, ${nameMatchResult.threshold}% required)`,
          data: {
            providedName: name,
            panName: result.registered_name,
            verified: false,
            nameSimilarity: nameMatchResult.similarity,
            requiredSimilarity: nameMatchResult.threshold
          }
        };
      }
      
      // Log successful name match
      console.log(`✅ Name match successful: ${nameMatchResult.similarity}% similarity`);
    }
    
    // Cache successful verifications
    if (verified) {
      cacheResult('pan', panNumber, {
        verified,
        ...result
      });
    }
    console.log('PAN Verification Response:', { result });

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
 * Initiate Aadhaar verification with OTP
 * @param {string} idProof - Aadhaar number to verify
 * @param {string} name - Name as per Aadhaar (optional)
 * @returns {Promise<Object>} OTP request result
 */
const requestAadhaarOtp = async (idProof) => {
  try {
    // Log request details for debugging
    const url = `${CASHFREE_API_BASE_URL}${AADHAAR_VERIFICATION_ENDPOINT}/otp`;
    
    // Payload for OTP request - try different formats that Cashfree might expect
    const payload = {
      aadhaar_number: idProof,
      aadhaarNumber: idProof,  // Try camelCase format as well
      id_number: idProof       // Generic format as fallback
    };
    
    const headers = getCashfreeHeaders();
    
    console.log('Aadhaar OTP Request:', { url, payload, headers: { ...headers, 'x-client-secret': '[REDACTED]' } });

    const response = await axios.post(
      url,
      payload,
      { headers }
    );

    return {
      success: true,
      message: 'OTP sent successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error requesting Aadhaar OTP:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    return {
      success: false,
      message: 'Error requesting Aadhaar OTP',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Verify Aadhaar Card details
 * @param {string} idProof - Aadhaar number to verify
 * @param {string} name - Name as per Aadhaar (optional)
 * @param {string} otp - OTP received on registered mobile (optional)
 * @param {string} requestId - Request ID from OTP request (optional)
 * @returns {Promise<Object>} Verification result
 */
const verifyAadhaar = async (idProof, name = '', otp = '', requestId = '') => {
  try {
    // Check cache first
    const cachedResult = checkCache('aadhaar', idProof);
    if (cachedResult) {
      return {
        verified: cachedResult.verified,
        message: 'Verification result from cache',
        data: cachedResult
      };
    }
    
    // If OTP and requestId are not provided, initiate the OTP request flow
    if (!otp || !requestId) {
      return await requestAadhaarOtp(idProof);
    }
    
    // Log request details for debugging
    const url = `${CASHFREE_API_BASE_URL}${AADHAAR_VERIFICATION_ENDPOINT}/verify`;
    
    // Payload for OTP verification
    const payload = {
      otp: otp,
      request_id: requestId,
      ref_id: requestId
    };
    
    const headers = getCashfreeHeaders();
    
    console.log('Aadhaar Verification Request:', { url, payload, headers: { ...headers, 'x-client-secret': '[REDACTED]' } });

    const response = await axios.post(
      url,
      payload,
      { headers }    
    );

    const result = response.data;
    const verified = result.status === 'SUCCESS' || result.status === 'VALID';
    
    // Check name match if name is provided
    if (verified && name && result.name) {
      const nameMatchResult = checkNameMatch(name, result.name);
      
      if (!nameMatchResult.matched) {
        return {
          verified: false,
          message: `Name mismatch: Aadhaar card name does not match with provided name (${nameMatchResult.similarity}% similarity, ${nameMatchResult.threshold}% required)`,
          data: {
            providedName: name,
            aadhaarName: result.name,
            verified: false,
            nameSimilarity: nameMatchResult.similarity,
            requiredSimilarity: nameMatchResult.threshold
          }
        };
      }
      
      // Log successful name match
      console.log(`✅ Name match successful: ${nameMatchResult.similarity}% similarity`);
    }

    // Cache successful verifications
    if (verified) {
      cacheResult('aadhaar', idProof, {
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
    // Enhanced error logging
    console.error('Error verifying Aadhaar:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      url: `${CASHFREE_API_BASE_URL}${AADHAAR_VERIFICATION_ENDPOINT}`
    });
    
    return {
      verified: false,
      message: 'Error during Aadhaar verification',
      error: error.response?.data || error.message,
      errorDetails: {
        status: error.response?.status,
        statusText: error.response?.statusText
      }
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

    // Log request details for debugging
    const url = `${CASHFREE_API_BASE_URL}${DL_VERIFICATION_ENDPOINT}`;
    
    // Using snake_case for consistency with other endpoints
    const payload = {
      dl_number: dlNumber,
      dob: dob || ''
    };
    
    const headers = getCashfreeHeaders();
    
    console.log('DL Verification Request:', { url, payload, headers: { ...headers, 'x-client-secret': '[REDACTED]' } });

    const response = await axios.post(
      url,
      payload,
      { headers }
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

    // Log request details for debugging
    const url = `${CASHFREE_API_BASE_URL}${GSTIN_VERIFICATION_ENDPOINT}`;
    
    // Using snake_case for consistency
    const payload = {
      gstin: gstinNumber
    };
    
    const headers = getCashfreeHeaders();
    
    console.log('GSTIN Verification Request:', { url, payload, headers: { ...headers, 'x-client-secret': '[REDACTED]' } });

    const response = await axios.post(
      url,
      payload,
      { headers }
    );


    console.log('GSTIN Verification Response:', response.data);
    const result = response.data;
    const verified = result.status === 'SUCCESS' || result.valid === true;

    const invalid = result.message === 'GSTIN Doesn\'t Exist';
    // Cache successful verifications
    console.log('GSTIN Verification Result:', { verified, invalid, result });
    if (verified) {
      cacheResult('gstin', gstinNumber, {
        verified,
        ...result
      });
    }

    return {
      verified,
      invalid,
      status: invalid ? "invalid" : verified ? "success" : "error",
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
 * Verify Voter ID details
 * @param {string} idProof - Voter ID number to verify
 * @param {Object} options - Additional options like name (optional)
 * @returns {Promise<Object>} Verification result
 */
const verifyVoterId = async (idProof, options = {}) => {
  try {
    // Check cache first
    const cachedResult = checkCache('voterId', idProof);
    if (cachedResult) {
      return {
        verified: cachedResult.verified,
        message: 'Verification result from cache',
        data: cachedResult
      };
    }

    // Log request details for debugging
    const url = `${CASHFREE_API_BASE_URL}${VOTER_ID_VERIFICATION_ENDPOINT}`;
    
    // Using snake_case for consistency
    const payload = { voter_id: idProof };
    
    // Add name if provided
    if (options.name) {
      payload.name = options.name;
    }
    
    const headers = getCashfreeHeaders();
    
    console.log('Voter ID Verification Request:', { url, payload, headers: { ...headers, 'x-client-secret': '[REDACTED]' } });

    const response = await axios.post(
      url,
      payload,
      { headers }
    );

    const result = response.data;
    const verified = result.status === 'SUCCESS' || result.status === 'VALID';

    // Cache successful verifications
    if (verified) {
      cacheResult('voterId', idProof, {
        verified,
        ...result
      });
    }

    return {
      verified,
      message: verified ? 'Voter ID verified successfully' : 'Voter ID verification failed',
      data: result
    };
  } catch (error) {
    console.error('Error verifying Voter ID:', error.response?.data || error.message);
    return {
      verified: false,
      message: 'Error during Voter ID verification',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Verify ID proof based on type
 * @param {string} idProofType - Type of ID proof (Aadhar Card, PAN Card, Driving License, Voter ID)
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
    case 'Voter ID':
      return await verifyVoterId(idProofNumber, { name: options.name });
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
  verifyVoterId,
  verifyIdProof
};

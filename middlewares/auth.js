const jwt = require('jsonwebtoken');
const { Vendor } = require('../models/Vendor');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Not authenticated. Please login' 
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if vendor exists
    const vendor = await Vendor.findByPk(decoded.id);
    
    if (!vendor) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Vendor no longer exists' 
      });
    }

    // Attach vendor to request
    req.user = vendor;
    
    // Continue to next middleware
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Token expired' 
      });
    }
    
    return res.status(500).json({ 
      status: 'error', 
      message: 'Authentication error' 
    });
  }
};

/**
 * Authorization middleware
 * Checks if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Not authenticated. Please login' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'fail', 
        message: 'Not authorized to access this resource' 
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };

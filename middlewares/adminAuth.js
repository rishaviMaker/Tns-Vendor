const jwt = require("jsonwebtoken");
const { Vendor } = require("../models/Vendor");
const { User } = require("../models/User");

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "fail",
        message: "Not authenticated. Please login",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if vendor exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User not found",
      });
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "fail",
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "fail",
        message: "Token expired",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Authentication error",
    });
  }
};

module.exports = { authenticate };

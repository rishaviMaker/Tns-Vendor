/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errorDetails = {};

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Validation error';
    errorDetails.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }

  // Handle Sequelize database errors
  if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = 'Database error';
    if (process.env.NODE_ENV === 'development') {
      errorDetails.databaseError = err.message;
    }
  }

  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    errorDetails.fileError = err.message;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    message = 'Validation error';
    errorDetails.errors = err.array();
  }

  // Handle specific error codes
  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable. Please try again later.';
  }

  if (err.code === 'ENOTFOUND') {
    statusCode = 404;
    message = 'Resource not found.';
  }
  
  // Set response status code
  res.status(statusCode);
  
  // Prepare response object
  const errorResponse = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message
  };
  
  // Only include additional details in development mode
  if (process.env.NODE_ENV === 'development') {
    if (Object.keys(errorDetails).length > 0) {
      errorResponse.errorDetails = errorDetails;
    }
    errorResponse.stack = err.stack;
    errorResponse.error = {
      statusCode: err.statusCode,
      status: err.status,
      isOperational: err.isOperational
    };
  }
  
  // Send error response
  res.json(errorResponse);
};

module.exports = errorHandler;

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  
  // Set response status code
  res.status(statusCode);
  
  // Send error response
  res.json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
};

module.exports = errorHandler;

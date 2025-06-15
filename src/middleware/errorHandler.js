const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Server error:', err.stack);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
};

module.exports = errorHandler;

 
/**
 * Custom error class with status code support
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle MongoDB/Mongoose errors and convert to API errors
 * @param {Error} err - The error object
 * @returns {ApiError} - Converted API error
 */
const handleDatabaseError = (err) => {
  // Validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return new ApiError(`Validation error: ${messages.join(', ')}`, 400);
  }
  
  // Duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return new ApiError(`Duplicate field value: ${field} already exists`, 400);
  }
  
  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return new ApiError(`Invalid ${err.path}: ${err.value}`, 400);
  }
  
  // Default to internal server error
  console.error('Unhandled database error:', err);
  return new ApiError('Database operation failed', 500);
};

/**
 * Async error handler to avoid try/catch blocks in route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    // Check if this is already an ApiError
    if (err instanceof ApiError) {
      next(err);
    } 
    // Check if this is a database error
    else if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) {
      next(handleDatabaseError(err));
    } 
    // Generic error
    else {
      console.error('Unhandled error in route handler:', err);
      next(new ApiError(err.message || 'Internal server error', 500));
    }
  });
};

module.exports = {
  ApiError,
  asyncHandler,
  handleDatabaseError
};

/**
 * middleware/errorHandler.js
 *
 * A single, centralized error-handling middleware for Express.
 * All errors thrown from routes/controllers arrive here.
 *
 * Add this LAST in your app.js middleware chain with:
 *   app.use(errorHandler);
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the full stack in development so developers can debug easily
  if (process.env.NODE_ENV !== 'production') {
    console.error('🔴 Error:', err.stack || err.message);
  }

  // Determine the status code:
  // • If the error already has a status code (e.g. set by a controller), use it.
  // • Otherwise fall back to 500 (Internal Server Error).
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred.',
    // Only send stack traces in development — never leak internals in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

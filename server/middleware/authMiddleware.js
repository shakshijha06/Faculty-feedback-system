/**
 * middleware/authMiddleware.js
 *
 * JWT authentication middleware (Phase 5).
 *
 * Verifies the Bearer token sent in the Authorization header.
 * Attaches the decoded user payload to req.user so downstream
 * controllers know who is making the request.
 *
 * Usage:
 *   const { protect, adminOnly } = require('../middleware/authMiddleware');
 *   router.get('/admin/users', protect, adminOnly, adminController.listUsers);
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — require a valid JWT.
 * Returns 401 if the token is missing or invalid.
 */
const protect = async (req, res, next) => {
  let token;

  // Expect: Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach lightweight user info — do NOT attach passwords
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated.'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * adminOnly — must come AFTER protect.
 * Returns 403 if the authenticated user is not an admin.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
};

module.exports = { protect, adminOnly };

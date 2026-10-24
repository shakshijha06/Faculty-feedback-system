/**
 * controllers/authController.js
 *
 * API:
 *   POST /api/auth/login            — log in (student or admin)
 *   GET  /api/auth/me               — get current user profile (requires token)
 *   POST /api/auth/logout           — client-side token discard
 *   PUT  /api/auth/change-password  — change own password (requires token)
 */

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { isDBConnected } = require('../config/db');

// ── Helper: sign a JWT ────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Helper: guard against missing DB ─────────────────────────────────────────
const requireDB = (res) => {
  if (!isDBConnected()) {
    res.status(503).json({
      success: false,
      message: 'Database is not connected. Configure MONGODB_URI in server/.env.',
    });
    return false;
  }
  return true;
};

/**
 * POST /api/auth/login
 * Body: { identifier, password }
 *   identifier — enrollment number (students) OR email address (admins)
 *
 * SECURITY: Both "user not found" and "wrong password" return the same 401
 * with the same message, so callers cannot determine whether an account exists.
 */
const login = async (req, res, next) => {
  if (!requireDB(res)) return;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Enrollment number/email and password are required.' });
    }

    // Support both enrollment number (students) and institutional email (students & admins).
    const trimmed = identifier.trim();
    const rollCandidate = trimmed.toUpperCase();
    const emailCandidate = trimmed.toLowerCase();

    let user = await User.findOne({
      $or: [
        { rollNumber: rollCandidate },
        { email: emailCandidate },
      ],
    }).select('+password');

    // Case-insensitive fallback if entered with unconventional casing or whitespace
    if (!user && trimmed.includes('@')) {
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({
        email: { $regex: new RegExp(`^${escaped}$`, 'i') },
      }).select('+password');
    }

    // Generic error — do NOT reveal whether the account exists
    const INVALID_MSG = 'Invalid credentials. Please check your enrollment number/email and password.';

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: INVALID_MSG });
    }

    if (!user.isActive) {
      // Slightly more specific so the student knows to contact admin,
      // but still does not confirm the account to an attacker who doesn't know it exists.
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact your administrator.' });
    }

    const token = signToken(user._id);

    // Never include password, __v, or internal fields in the response
    res.status(200).json({
      success: true,
      token,
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,         // 'student' | 'admin' — client uses this for routing only; server always re-checks
        rollNumber: user.rollNumber,
        semester:   user.semester,
        department: user.department,
        division:   user.division,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Requires: protect middleware (sets req.user)
 */
const getMe = async (req, res) => {
  // req.user is already set by the protect middleware (no password)
  res.status(200).json({ success: true, user: req.user });
};

/**
 * POST /api/auth/logout
 * JWTs are stateless — logout just instructs the client to discard the token.
 */
const logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully. Please delete your token on the client.' });
};

/**
 * PUT /api/auth/change-password
 * Body: { currentPassword, newPassword }
 * Requires: protect middleware
 */
const changePassword = async (req, res, next) => {
  if (!requireDB(res)) return;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'New password must be different from your current password.' });
  }

  try {
    // Fetch user WITH password (select: false means we must explicitly select it)
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // pre-save hook will hash this
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};

module.exports = { login, getMe, logout, changePassword };

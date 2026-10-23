/**
 * controllers/adminController.js
 *
 * Admin-only management of student user accounts.
 *
 * API:
 *   GET    /api/admin/users                    — list all students
 *   POST   /api/admin/users                    — create a new student account
 *   PUT    /api/admin/users/:id                — update student details
 *   DELETE /api/admin/users/:id                — deactivate student account (soft)
 *   PUT    /api/admin/users/:id/reactivate     — reactivate a deactivated account
 *   GET    /api/admin/dashboard                — real counts from DB (no hardcoded figures)
 */

const User = require('../models/User');
const Faculty = require('../models/Faculty');
const FeedbackSubmission = require('../models/FeedbackSubmission');
const AwardNomination = require('../models/AwardNomination');
const { validationResult } = require('express-validator');
const { isDBConnected } = require('../config/db');

const requireDB = (res) => {
  if (!isDBConnected()) {
    res.status(503).json({ success: false, message: 'Database is not connected.' });
    return false;
  }
  return true;
};

// ── GET /api/admin/users ───────────────────────────────────────────────────────
const listUsers = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const users = await User.find({ role: 'student' }).sort({ name: 1 }).select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
};

// ── POST /api/admin/users ──────────────────────────────────────────────────────
// Admin creates a student account. Password is bcrypt-hashed by the User model pre-save hook.
const createUser = async (req, res, next) => {
  if (!requireDB(res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const user = await User.create({ ...req.body, role: 'student' });
    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json({ success: true, data: safeUser });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      const msg = field === 'rollNumber'
        ? `Enrollment number "${req.body.rollNumber}" is already registered.`
        : 'An account with that email already exists.';
      return res.status(400).json({ success: false, message: msg });
    }
    next(err);
  }
};

// ── PUT /api/admin/users/:id ───────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  if (!requireDB(res)) return;
  // Prevent role escalation or password changes through this endpoint
  const safeBody = { ...req.body };
  delete safeBody.role;
  delete safeBody.password;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, safeBody, { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Enrollment number already in use.' });
    next(err);
  }
};

// ── DELETE /api/admin/users/:id ────────────────────────────────────────────────
// Soft deactivate — user account is preserved but cannot log in
const deactivateUser = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: `Account for ${user.name} deactivated.` });
  } catch (err) { next(err); }
};

// ── PUT /api/admin/users/:id/reactivate ───────────────────────────────────────
const reactivateUser = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive: true }, { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: `Account for ${user.name} reactivated.` });
  } catch (err) { next(err); }
};

// ── GET /api/admin/dashboard ───────────────────────────────────────────────────
// Returns ONLY real database counts — no hardcoded or synthetic numbers.
const getDashboardStats = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const [studentCount, activeStudentCount, facultyCount, submissionCount, pendingNominations] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isActive: true }),
      Faculty.countDocuments({ isActive: true }),
      FeedbackSubmission.countDocuments(),
      AwardNomination.countDocuments({ status: 'pending' }),
    ]);
    res.status(200).json({
      success: true,
      stats: { studentCount, activeStudentCount, facultyCount, submissionCount, pendingNominations },
    });
  } catch (err) { next(err); }
};

module.exports = { listUsers, createUser, updateUser, deactivateUser, reactivateUser, getDashboardStats };

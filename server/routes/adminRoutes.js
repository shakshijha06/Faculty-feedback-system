/**
 * routes/adminRoutes.js
 * All routes require protect + adminOnly middleware.
 */

const express = require('express');
const { body } = require('express-validator');
const {
  listUsers, createUser, updateUser, deactivateUser,
  reactivateUser, getDashboardStats,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth guards to all admin routes
router.use(protect, adminOnly);

// Validation for creating a new student account
const userCreateValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('A valid email address is required'),
  body('rollNumber').trim().notEmpty().withMessage('Enrollment number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be 1–8'),
  body('department').optional().trim(),
  body('division').optional().trim(),
];

router.get('/dashboard', getDashboardStats);
router.get('/users', listUsers);
router.post('/users', userCreateValidation, createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deactivateUser);
router.put('/users/:id/reactivate', reactivateUser);

module.exports = router;

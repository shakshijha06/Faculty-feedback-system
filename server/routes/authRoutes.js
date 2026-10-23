/**
 * routes/authRoutes.js
 *
 * POST /api/auth/login
 * GET  /api/auth/me        (protected)
 * POST /api/auth/logout    (protected)
 */

const express = require('express');
const { body } = require('express-validator');
const { login, getMe, logout, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation for login — identifier can be enrollment number (e.g. CS22001) or email (admins)
const loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Enrollment number or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/login',           loginValidation, login);
router.get('/me',               protect, getMe);
router.post('/logout',          protect, logout);
router.put('/change-password',  protect, changePassword);

module.exports = router;

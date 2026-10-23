/**
 * routes/assignmentRoutes.js
 */

const express = require('express');
const { body } = require('express-validator');
const {
  getMyAssignments, getAllAssignments, createAssignment, updateAssignment, deleteAssignment,
} = require('../controllers/assignmentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const assignmentValidation = [
  body('faculty').notEmpty().withMessage('Faculty ID is required'),
  body('course').notEmpty().withMessage('Course ID is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be 1-8'),
  body('academicYear').matches(/^\d{4}-\d{2,4}$/).withMessage('Academic year format: 2024-25'),
  body('department').trim().notEmpty().withMessage('Department is required'),
];

// Student route: their own assignments
router.get('/my', protect, getMyAssignments);

// Admin routes
router.get('/', protect, adminOnly, getAllAssignments);
router.post('/', protect, adminOnly, assignmentValidation, createAssignment);
router.put('/:id', protect, adminOnly, updateAssignment);
router.delete('/:id', protect, adminOnly, deleteAssignment);

module.exports = router;

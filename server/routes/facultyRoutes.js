/**
 * routes/facultyRoutes.js
 *
 * GET    /api/faculty         — any authenticated user (active faculty only)
 * GET    /api/faculty/all     — admin only (all incl. inactive)
 * GET    /api/faculty/:id     — any authenticated user
 * GET    /api/faculty/:id/stats — admin only (aggregated feedback)
 * POST   /api/faculty         — admin only
 * PUT    /api/faculty/:id     — admin only
 * PUT    /api/faculty/:id/reactivate — admin only
 * DELETE /api/faculty/:id     — admin only (soft deactivate)
 */

const express = require('express');
const { body } = require('express-validator');
const {
  getAllFaculty, getAllFacultyIncludingInactive, getMyDepartmentFaculty, getFacultyById,
  getFacultyStats, createFaculty, updateFaculty, deactivateFaculty, reactivateFaculty,
} = require('../controllers/facultyController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const facultyValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
];

// IMPORTANT: specific routes before parameterised ones to avoid route conflicts
router.get('/my-department',          protect, getMyDepartmentFaculty);
router.get('/all',                    protect, adminOnly, getAllFacultyIncludingInactive);
router.get('/',                       protect, getAllFaculty);
router.get('/:id/stats',              protect, adminOnly, getFacultyStats);
router.get('/:id',                    protect, getFacultyById);
router.post('/',                      protect, adminOnly, facultyValidation, createFaculty);
router.put('/:id/reactivate',         protect, adminOnly, reactivateFaculty);
router.put('/:id',                    protect, adminOnly, updateFaculty);
router.delete('/:id',                 protect, adminOnly, deactivateFaculty);

module.exports = router;

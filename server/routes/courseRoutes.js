/**
 * routes/courseRoutes.js
 */

const express = require('express');
const { body } = require('express-validator');
const { getAllCourses, getCourseById, createCourse, updateCourse, deactivateCourse } = require('../controllers/courseController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const courseValidation = [
  body('courseCode').trim().notEmpty().withMessage('Course code is required'),
  body('title').trim().notEmpty().withMessage('Course title is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be 1-8'),
];

router.get('/', protect, getAllCourses);
router.get('/:id', protect, getCourseById);
router.post('/', protect, adminOnly, courseValidation, createCourse);
router.put('/:id', protect, adminOnly, updateCourse);
router.delete('/:id', protect, adminOnly, deactivateCourse);

module.exports = router;

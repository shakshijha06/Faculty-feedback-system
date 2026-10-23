/**
 * routes/feedbackRoutes.js
 */

const express = require('express');
const { body }  = require('express-validator');
const {
  submitFeedback, getSubmissionStatus,
  getDraft, saveDraft, getAggregatedResults,
} = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Validate submit body
const submitValidation = [
  body('facultyId').notEmpty().withMessage('Faculty ID is required'),
  body('ratings').isArray({ min: 1 }).withMessage('At least one rating is required'),
  body('ratings.*.questionKey').notEmpty().withMessage('Each rating must have a questionKey'),
  body('ratings.*.score').isInt({ min: 1, max: 5 }).withMessage('Score must be 1–5'),
  body('ratings.*.reason').trim().isLength({ min: 5 }).withMessage('Reason (min 5 chars) required for each rating'),
];

router.post('/submit',                    protect, submitValidation, submitFeedback);
router.get('/status/:facultyId',          protect, getSubmissionStatus);
router.get('/draft/:facultyId',           protect, getDraft);
router.post('/draft/:facultyId',          protect, saveDraft);
router.get('/results/:facultyId',         protect, adminOnly, getAggregatedResults);

module.exports = router;

/**
 * routes/nominationRoutes.js
 */

const express = require('express');
const { body } = require('express-validator');
const {
  createNomination, getMyNomination, getLeaderboard,
  getAllNominations, updateNominationStatus,
} = require('../controllers/nominationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const nominationValidation = [
  body('primaryFaculty').notEmpty().withMessage('Primary faculty ID is required'),
  body('primaryReason')
    .trim().isLength({ min: 20, max: 500 })
    .withMessage('Primary reason must be 20–500 characters'),
  body('academicYear')
    .matches(/^\d{4}-\d{2,4}$/)
    .withMessage('Academic year format: 2024-25'),
  // Additional nominees are optional but if present must each have faculty + reason
  body('additionalNominees').optional().isArray({ max: 2 }).withMessage('At most 2 additional nominees'),
  body('additionalNominees.*.faculty').notEmpty().withMessage('Faculty ID required for each additional nominee'),
  body('additionalNominees.*.reason')
    .trim().isLength({ min: 20, max: 500 })
    .withMessage('Reason (20–500 chars) required for each additional nominee'),
];

// IMPORTANT: specific segment /mine and /leaderboard must come before /:id
router.get('/mine', protect, getMyNomination);
router.get('/leaderboard', protect, adminOnly, getLeaderboard);
router.post('/', protect, nominationValidation, createNomination);
router.get('/', protect, adminOnly, getAllNominations);
router.put('/:id/status', protect, adminOnly, updateNominationStatus);

module.exports = router;

/**
 * routes/nominationCycleRoutes.js
 */

const express = require('express');
const { body }  = require('express-validator');
const {
  getActiveCycle, listCycles, createCycle, updateCycle,
} = require('../controllers/nominationCycleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const cycleValidation = [
  body('title').trim().notEmpty().withMessage('Cycle title is required'),
  body('academicYear').matches(/^\d{4}-\d{2,4}$/).withMessage('Academic year format: 2024-25'),
];

// Specific before parameterised
router.get('/active', protect, getActiveCycle);
router.get('/',       protect, adminOnly, listCycles);
router.post('/',      protect, adminOnly, cycleValidation, createCycle);
router.put('/:id',    protect, adminOnly, updateCycle);

module.exports = router;

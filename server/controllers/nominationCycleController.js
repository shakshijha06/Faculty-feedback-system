/**
 * controllers/nominationCycleController.js
 *
 * Admin manages Award of Excellence nomination cycles.
 * One cycle per academic year controls which faculty are eligible
 * and whether nominations are currently open.
 *
 * API:
 *   GET  /api/nomination-cycles/active   — student: get the currently open cycle (eligible faculty populated)
 *   GET  /api/nomination-cycles          — admin: list all cycles
 *   POST /api/nomination-cycles          — admin: create a new cycle
 *   PUT  /api/nomination-cycles/:id      — admin: update cycle (eligible faculty, status, title)
 */

const NominationCycle = require('../models/NominationCycle');
const { validationResult } = require('express-validator');
const { isDBConnected }    = require('../config/db');

const requireDB = (res) => {
  if (!isDBConnected()) {
    res.status(503).json({ success: false, message: 'Database is not connected.' });
    return false;
  }
  return true;
};

// GET /api/nomination-cycles/active  (authenticated — student or admin)
const getActiveCycle = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const cycle = await NominationCycle.findOne({ status: 'open' })
      .populate('eligibleFaculty', 'name department designation isActive')
      .lean();

    if (!cycle) {
      return res.status(200).json({ success: true, data: null, message: 'No nomination cycle is currently open.' });
    }

    // Filter to only active faculty (guard for faculty deactivated after cycle creation)
    cycle.eligibleFaculty = cycle.eligibleFaculty.filter(f => f.isActive);

    res.status(200).json({ success: true, data: cycle });
  } catch (err) { next(err); }
};

// GET /api/nomination-cycles  (admin only)
const listCycles = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const cycles = await NominationCycle.find()
      .populate('eligibleFaculty', 'name department')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: cycles.length, data: cycles });
  } catch (err) { next(err); }
};

// POST /api/nomination-cycles  (admin only)
const createCycle = async (req, res, next) => {
  if (!requireDB(res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    // Enforce only one open cycle at a time
    if (req.body.status === 'open') {
      const alreadyOpen = await NominationCycle.findOne({ status: 'open' });
      if (alreadyOpen) {
        return res.status(400).json({
          success: false,
          message: `Another cycle ("${alreadyOpen.title}") is already open. Close it before opening a new one.`,
        });
      }
    }

    const cycle = await NominationCycle.create({
      ...req.body,
      createdBy: req.user._id,
      openedAt:  req.body.status === 'open' ? new Date() : undefined,
    });
    res.status(201).json({ success: true, data: cycle });
  } catch (err) { next(err); }
};

// PUT /api/nomination-cycles/:id  (admin only)
const updateCycle = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const current = await NominationCycle.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: 'Cycle not found.' });

    // Prevent two open cycles
    if (req.body.status === 'open' && current.status !== 'open') {
      const alreadyOpen = await NominationCycle.findOne({ status: 'open' });
      if (alreadyOpen) {
        return res.status(400).json({
          success: false,
          message: `Another cycle ("${alreadyOpen.title}") is already open.`,
        });
      }
    }

    const update = { ...req.body };
    if (update.status === 'open'   && current.status !== 'open')   update.openedAt  = new Date();
    if (update.status === 'closed' && current.status !== 'closed') update.closedAt  = new Date();

    const cycle = await NominationCycle.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('eligibleFaculty', 'name department');
    res.status(200).json({ success: true, data: cycle });
  } catch (err) { next(err); }
};

module.exports = { getActiveCycle, listCycles, createCycle, updateCycle };

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

const Faculty = require('../models/Faculty');
const NominationCycle = require('../models/NominationCycle');
const AwardNomination = require('../models/AwardNomination');
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
    const cycle = await NominationCycle.findOne({ status: 'open', isDeleted: { $ne: true } })
      .populate('eligibleFaculty', 'name department designation employeeId isActive')
      .lean();

    if (!cycle) {
      return res.status(200).json({ success: true, data: null, hasSubmitted: false, message: 'No nomination cycle is currently open.' });
    }

    // Filter to only active faculty
    cycle.eligibleFaculty = (cycle.eligibleFaculty || []).filter(f => f && f.isActive);

    // If eligibleFaculty was empty (admin opened cycle without restricting to a subset),
    // automatically include all active faculty members so students can submit nominations.
    if (cycle.eligibleFaculty.length === 0) {
      const allActive = await Faculty.find({ isActive: true })
        .select('name department designation employeeId isActive')
        .sort({ name: 1 })
        .lean();
      cycle.eligibleFaculty = allActive;
    }

    // Check if the authenticated student has already submitted for this specific cycle
    let hasSubmitted = false;
    let userNomination = null;
    if (req.user && req.user.role === 'student') {
      userNomination = await AwardNomination.findOne({
        nominator: req.user._id,
        $or: [{ cycle: cycle._id }, { academicYear: cycle.academicYear }],
      })
        .populate('primaryFaculty', 'name department designation')
        .populate('additionalNominees.faculty', 'name department designation')
        .lean();
      hasSubmitted = !!userNomination;
    }

    res.status(200).json({ success: true, data: cycle, hasSubmitted, userNomination });
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

// DELETE /api/nomination-cycles/:id  (admin only)
const deleteCycle = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const cycle = await NominationCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found.' });

    // Soft-delete: marked as deleted and closed, preserving historical nominations
    cycle.isDeleted = true;
    cycle.status = 'closed';
    cycle.closedAt = cycle.closedAt || new Date();
    await cycle.save();

    res.status(200).json({ success: true, message: 'Cycle deleted and archived successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getActiveCycle, listCycles, createCycle, updateCycle, deleteCycle };

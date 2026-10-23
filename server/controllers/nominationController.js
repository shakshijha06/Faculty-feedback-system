/**
 * controllers/nominationController.js
 *
 * Student-facing nomination submission. Uses active NominationCycle
 * to validate eligibility and open/closed status.
 *
 * API:
 *   POST /api/nominations               — student submits nomination
 *   GET  /api/nominations/mine          — student views their own nomination
 *   GET  /api/nominations/leaderboard   — admin: faculty ranked by nomination count
 *   GET  /api/nominations               — admin: all nominations (reasons, no student name)
 *   PUT  /api/nominations/:id/status    — admin: update status
 */

const AwardNomination  = require('../models/AwardNomination');
const NominationCycle  = require('../models/NominationCycle');
const { validationResult } = require('express-validator');
const { isDBConnected } = require('../config/db');

const requireDB = (res) => {
  if (!isDBConnected()) {
    res.status(503).json({ success: false, message: 'Database is not connected.' });
    return false;
  }
  return true;
};

// POST /api/nominations
const createNomination = async (req, res, next) => {
  if (!requireDB(res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { primaryFaculty, primaryReason, additionalNominees } = req.body;

    // 1. Find the open cycle
    const cycle = await NominationCycle.findOne({ status: 'open' });
    if (!cycle) {
      return res.status(400).json({ success: false, message: 'No nomination cycle is currently open.' });
    }

    // 2. Validate primary faculty is in eligibleFaculty[]
    const eligibleIds = cycle.eligibleFaculty.map(String);
    if (!eligibleIds.includes(String(primaryFaculty))) {
      return res.status(400).json({ success: false, message: 'The selected faculty member is not eligible for this nomination cycle.' });
    }

    // 3. Validate additional nominees are also eligible
    const extras = additionalNominees || [];
    for (const n of extras) {
      if (!eligibleIds.includes(String(n.faculty))) {
        return res.status(400).json({ success: false, message: 'One or more additional nominees are not eligible for this cycle.' });
      }
    }

    const nomination = await AwardNomination.create({
      nominator: req.user._id,
      primaryFaculty,
      primaryReason,
      additionalNominees: extras,
      academicYear: cycle.academicYear,
    });

    res.status(201).json({
      success: true,
      message: 'Nomination submitted successfully.',
      data: { id: nomination._id, status: nomination.status },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already submitted a nomination for this academic year.' });
    }
    next(err);
  }
};

// GET /api/nominations/mine
const getMyNomination = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const nomination = await AwardNomination.findOne({ nominator: req.user._id })
      .populate('primaryFaculty', 'name department designation')
      .populate('additionalNominees.faculty', 'name department designation');
    res.status(200).json({ success: true, data: nomination });
  } catch (err) { next(err); }
};

// GET /api/nominations/leaderboard  (admin)
const getLeaderboard = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const nominations = await AwardNomination.find()
      .populate('primaryFaculty', 'name department designation employeeId');

    const facultyMap = {};
    nominations.forEach(nom => {
      const fid = String(nom.primaryFaculty?._id);
      if (!facultyMap[fid]) {
        facultyMap[fid] = { faculty: nom.primaryFaculty, nominationCount: 0, reasons: [] };
      }
      facultyMap[fid].nominationCount += 1;
      facultyMap[fid].reasons.push(nom.primaryReason);
    });

    const leaderboard = Object.values(facultyMap)
      .sort((a, b) => b.nominationCount - a.nominationCount);

    res.status(200).json({ success: true, data: leaderboard });
  } catch (err) { next(err); }
};

// GET /api/nominations  (admin)
const getAllNominations = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const nominations = await AwardNomination.find()
      .populate('primaryFaculty', 'name department designation')
      .populate('additionalNominees.faculty', 'name department')
      .sort({ createdAt: -1 });
    // Nominator is intentionally not populated to protect student privacy
    res.status(200).json({ success: true, count: nominations.length, data: nominations });
  } catch (err) { next(err); }
};

// PUT /api/nominations/:id/status  (admin)
const updateNominationStatus = async (req, res, next) => {
  if (!requireDB(res)) return;
  const { status } = req.body;
  if (!['pending', 'shortlisted'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be "pending" or "shortlisted".' });
  }
  try {
    const nomination = await AwardNomination.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!nomination) return res.status(404).json({ success: false, message: 'Nomination not found.' });
    res.status(200).json({ success: true, data: nomination });
  } catch (err) { next(err); }
};

module.exports = { createNomination, getMyNomination, getLeaderboard, getAllNominations, updateNominationStatus };

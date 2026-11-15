/**
 * controllers/facultyController.js
 *
 * Admin-only CRUD for faculty members + per-faculty stats endpoint
 * + Faculty search supporting full name, first/last name, timetable initials, and abbreviations.
 *
 * API:
 *   GET    /api/faculty              — list active faculty (supports ?q= or ?search=)
 *   GET    /api/faculty/search       — search active faculty by name/initials (?q=...)
 *   GET    /api/faculty/my-department — active faculty for student's department (supports ?q=)
 *   GET    /api/faculty/all          — list all faculty incl. inactive (admin)
 *   GET    /api/faculty/:id          — get one faculty member
 *   GET    /api/faculty/:id/stats    — aggregated feedback stats (admin only)
 *   POST   /api/faculty              — create faculty (admin only)
 *   PUT    /api/faculty/:id          — update faculty (admin only)
 *   DELETE /api/faculty/:id          — deactivate faculty (admin only, soft)
 *   PUT    /api/faculty/:id/reactivate — reactivate faculty (admin only)
 */

const Faculty = require('../models/Faculty');
const FacultyAssignment = require('../models/FacultyAssignment');
const FeedbackSubmission = require('../models/FeedbackSubmission');
const { validationResult } = require('express-validator');
const { isDBConnected } = require('../config/db');
const {
  generateInitials,
  getEffectiveInitials,
  matchesFacultySearch,
} = require('../utils/facultySearch');

const requireDB = (res) => {
  if (!isDBConnected()) {
    res.status(503).json({ success: false, message: 'Database is not connected.' });
    return false;
  }
  return true;
};

// Formats a faculty document ensuring verified/generated initials are always populated
const formatFaculty = (doc) => {
  const f = doc && doc.toObject ? doc.toObject() : { ...doc };
  if (!f.abbreviation || !f.abbreviation.trim()) {
    f.abbreviation = generateInitials(f.name);
  } else {
    f.abbreviation = f.abbreviation.trim().toUpperCase();
  }
  return f;
};

// GET /api/faculty — active faculty only, with optional ?q= or ?search= filter
const getAllFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const rawFaculty = await Faculty.find({ isActive: true }).sort({ name: 1 });
    let faculty = rawFaculty.map(formatFaculty);

    const q = (req.query.q || req.query.search || '').trim();
    if (q) {
      faculty = faculty.filter(f => matchesFacultySearch(f, q));
    }

    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (err) { next(err); }
};

/**
 * GET /api/faculty/search?q=... (authenticated)
 * Dedicated search endpoint for finding faculty across name, initials, and timetable abbreviations.
 */
const searchFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const q = (req.query.q || req.query.search || '').trim();
    const query = { isActive: true };

    // If student has a department, we can prioritize or scope, but allow finding all active faculty
    const rawFaculty = await Faculty.find(query).sort({ name: 1 });
    let faculty = rawFaculty.map(formatFaculty);

    if (q) {
      faculty = faculty.filter(f => matchesFacultySearch(f, q));
    }

    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (err) { next(err); }
};

/**
 * GET /api/faculty/my-department  (authenticated student)
 *
 * Returns active faculty whose department matches the logged-in student's department.
 * Uses flexible matching so abbreviations like "CSE" or "Computer Science" match
 * canonical "Computer Science and Engineering".
 *
 * If the student has no department set, returns all active faculty so they still see data.
 * Also supports optional ?q= or ?search= query parameter.
 */
const getMyDepartmentFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const query = { isActive: true };
    if (req.user && req.user.department) {
      const studentDept = req.user.department.trim();
      let regexPattern = `^${studentDept}$`;
      if (/computer\s*science/i.test(studentDept) || /^cse$/i.test(studentDept)) {
        regexPattern = 'computer\\s*science|cse';
      } else if (/information\s*technology/i.test(studentDept) || /^it$/i.test(studentDept)) {
        regexPattern = 'information\\s*technology|\\bit\\b';
      } else if (/electronics/i.test(studentDept) || /^ece$/i.test(studentDept)) {
        regexPattern = 'electronics|ece';
      } else if (/internet\s*of\s*things/i.test(studentDept) || /^iot$/i.test(studentDept)) {
        regexPattern = 'internet\\s*of\\s*things|iot';
      }
      query.department = { $regex: new RegExp(regexPattern, 'i') };
    }
    const rawFaculty = await Faculty.find(query).sort({ name: 1 });
    let faculty = rawFaculty.map(formatFaculty);

    const q = (req.query.q || req.query.search || '').trim();
    if (q) {
      faculty = faculty.filter(f => matchesFacultySearch(f, q));
    }

    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (err) { next(err); }
};

// GET /api/faculty/all — all including inactive (admin use)
const getAllFacultyIncludingInactive = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const rawFaculty = await Faculty.find().sort({ name: 1 });
    let faculty = rawFaculty.map(formatFaculty);

    const q = (req.query.q || req.query.search || '').trim();
    if (q) {
      faculty = faculty.filter(f => matchesFacultySearch(f, q));
    }

    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (err) { next(err); }
};

// GET /api/faculty/:id
const getFacultyById = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.status(200).json({ success: true, data: formatFaculty(faculty) });
  } catch (err) { next(err); }
};

/**
 * GET /api/faculty/:id/stats  (admin only)
 * Aggregates all FeedbackSubmissions for this faculty.
 * PRIVACY: returns only aggregated averages, score distributions, and anonymous comments — zero student identifiers.
 */
const getFacultyStats = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const empty = {
      success: true,
      responseCount: 0,
      averageScores: {},
      overallAverage: null,
      ratingDistributions: {},
      comments: [],
      reasons: {},
    };

    const submissions = await FeedbackSubmission.find({ faculty: req.params.id }).sort({ createdAt: -1 });
    if (!submissions || submissions.length === 0) return res.status(200).json(empty);

    const scoreSums = {};
    const scoreCounts = {};
    const ratingDistributions = {};
    const reasons = {};
    let totalScoreSum = 0;
    let totalScoreCount = 0;

    submissions.forEach(sub => {
      if (Array.isArray(sub.ratings)) {
        sub.ratings.forEach(({ questionKey, score, reason }) => {
          if (!scoreSums[questionKey]) {
            scoreSums[questionKey] = 0;
            scoreCounts[questionKey] = 0;
            ratingDistributions[questionKey] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            reasons[questionKey] = [];
          }
          scoreSums[questionKey] += score;
          scoreCounts[questionKey] += 1;
          if (score >= 1 && score <= 5) {
            ratingDistributions[questionKey][score] += 1;
          }
          if (reason && reason.trim()) {
            reasons[questionKey].push(reason.trim());
          }
          totalScoreSum += score;
          totalScoreCount += 1;
        });
      }
    });

    const averageScores = {};
    Object.keys(scoreSums).forEach(key => {
      averageScores[key] = parseFloat((scoreSums[key] / scoreCounts[key]).toFixed(2));
    });

    const overallAverage = totalScoreCount > 0
      ? parseFloat((totalScoreSum / totalScoreCount).toFixed(2))
      : null;

    const comments = submissions
      .filter(s => s.positiveComment || s.improvementComment || s.overallComment)
      .map(s => ({
        positiveComment: s.positiveComment || null,
        improvementComment: s.improvementComment || null,
        overallComment: s.overallComment || null,
        academicYear: s.academicYear || null,
      }));

    res.status(200).json({
      success: true,
      responseCount: submissions.length,
      averageScores,
      overallAverage,
      ratingDistributions,
      comments,
      reasons,
    });
  } catch (err) { next(err); }
};

// POST /api/faculty (admin only)
const createFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstMsg = errors.array()[0]?.msg || 'Validation failed.';
    return res.status(400).json({ success: false, message: firstMsg, errors: errors.array() });
  }
  try {
    const payload = { ...req.body };
    if (!payload.email || !payload.email.trim()) {
      delete payload.email;
    }
    // Auto-generate abbreviation if not provided, or uppercase and trim if provided
    if (payload.abbreviation && typeof payload.abbreviation === 'string' && payload.abbreviation.trim()) {
      payload.abbreviation = payload.abbreviation.trim().toUpperCase();
    } else if (payload.name) {
      payload.abbreviation = generateInitials(payload.name);
    }
    const faculty = await Faculty.create(payload);
    res.status(201).json({ success: true, data: formatFaculty(faculty) });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      const val = err.keyValue ? err.keyValue[field] : '';
      const msg = field === 'employeeId'
        ? `A faculty with Employee ID "${val}" already exists.`
        : field === 'email'
        ? `A faculty with email "${val}" already exists.`
        : 'A faculty with this information already exists.';
      return res.status(400).json({ success: false, message: msg });
    }
    if (err.name === 'ValidationError') {
      const firstMsg = Object.values(err.errors)[0]?.message || 'Validation error.';
      return res.status(400).json({ success: false, message: firstMsg });
    }
    next(err);
  }
};

// PUT /api/faculty/:id (admin only)
const updateFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const updateData = { ...req.body };
    if (updateData.email !== undefined && (!updateData.email || !updateData.email.trim())) {
      delete updateData.email;
    }
    if (updateData.abbreviation !== undefined) {
      if (typeof updateData.abbreviation === 'string' && updateData.abbreviation.trim()) {
        updateData.abbreviation = updateData.abbreviation.trim().toUpperCase();
      } else if (updateData.name) {
        updateData.abbreviation = generateInitials(updateData.name);
      }
    }
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.status(200).json({ success: true, data: formatFaculty(faculty) });
  } catch (err) { next(err); }
};

// DELETE /api/faculty/:id — soft deactivate (admin only)
const deactivateFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.status(200).json({ success: true, message: `${faculty.name} deactivated.` });
  } catch (err) { next(err); }
};

// PUT /api/faculty/:id/reactivate (admin only)
const reactivateFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.status(200).json({ success: true, message: `${faculty.name} reactivated.` });
  } catch (err) { next(err); }
};

module.exports = {
  getAllFaculty,
  searchFaculty,
  getAllFacultyIncludingInactive,
  getMyDepartmentFaculty,
  getFacultyById,
  getFacultyStats,
  createFaculty,
  updateFaculty,
  deactivateFaculty,
  reactivateFaculty,
};

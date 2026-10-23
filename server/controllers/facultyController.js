/**
 * controllers/facultyController.js
 *
 * Admin-only CRUD for faculty members + per-faculty stats endpoint.
 *
 * API:
 *   GET    /api/faculty              — list all active faculty
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

const requireDB = (res) => {
  if (!isDBConnected()) {
    res.status(503).json({ success: false, message: 'Database is not connected.' });
    return false;
  }
  return true;
};

// GET /api/faculty — active faculty only
const getAllFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const faculty = await Faculty.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (err) { next(err); }
};

/**
 * GET /api/faculty/my-department  (authenticated student)
 *
 * Returns active faculty whose department matches the logged-in student's department.
 * This is the fix for the "no faculty showing on student dashboard" defect — it does NOT
 * require manually created FacultyAssignment records.
 *
 * If the student has no department set, returns all active faculty so they still see data.
 */
const getMyDepartmentFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const query = { isActive: true };
    if (req.user.department) {
      query.department = { $regex: new RegExp(`^${req.user.department}$`, 'i') };
    }
    const faculty = await Faculty.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (err) { next(err); }
};


// GET /api/faculty/all — all including inactive (admin use)
const getAllFacultyIncludingInactive = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const faculty = await Faculty.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (err) { next(err); }
};

// GET /api/faculty/:id
const getFacultyById = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.status(200).json({ success: true, data: faculty });
  } catch (err) { next(err); }
};

/**
 * GET /api/faculty/:id/stats  (admin only)
 *
 * Aggregates all FeedbackSubmissions across ALL assignments for this faculty.
 * PRIVACY: returns only aggregated averages and anonymous comments — no student identifiers.
 */
const getFacultyStats = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const assignments = await FacultyAssignment.find({ faculty: req.params.id }).select('_id');
    const assignmentIds = assignments.map(a => a._id);

    const empty = { success: true, responseCount: 0, averageScores: {}, overallAverage: null, comments: [] };
    if (assignmentIds.length === 0) return res.status(200).json(empty);

    const submissions = await FeedbackSubmission.find({ assignment: { $in: assignmentIds } });
    if (submissions.length === 0) return res.status(200).json(empty);

    // Aggregate per-question scores
    const scoreSums = {};
    const scoreCounts = {};
    let totalScoreSum = 0;
    let totalScoreCount = 0;

    submissions.forEach(sub => {
      sub.ratings.forEach(({ questionKey, score }) => {
        scoreSums[questionKey] = (scoreSums[questionKey] || 0) + score;
        scoreCounts[questionKey] = (scoreCounts[questionKey] || 0) + 1;
        totalScoreSum += score;
        totalScoreCount += 1;
      });
    });

    const averageScores = {};
    Object.keys(scoreSums).forEach(key => {
      averageScores[key] = parseFloat((scoreSums[key] / scoreCounts[key]).toFixed(2));
    });

    const overallAverage = totalScoreCount > 0
      ? parseFloat((totalScoreSum / totalScoreCount).toFixed(2))
      : null;

    // Anonymous comments — no student identifiers whatsoever
    const comments = submissions
      .filter(s => s.positiveComment || s.improvementComment)
      .map(s => ({
        positiveComment: s.positiveComment || null,
        improvementComment: s.improvementComment || null,
      }));

    res.status(200).json({ success: true, responseCount: submissions.length, averageScores, overallAverage, comments });
  } catch (err) { next(err); }
};

// POST /api/faculty (admin only)
const createFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json({ success: true, data: faculty });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'A faculty with this Employee ID already exists.' });
    next(err);
  }
};

// PUT /api/faculty/:id (admin only)
const updateFaculty = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.status(200).json({ success: true, data: faculty });
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
  getAllFaculty, getAllFacultyIncludingInactive, getMyDepartmentFaculty, getFacultyById,
  getFacultyStats, createFaculty, updateFaculty, deactivateFaculty, reactivateFaculty,
};

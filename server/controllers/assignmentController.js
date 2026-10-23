/**
 * controllers/assignmentController.js
 *
 * Admin manages faculty-course-student assignments.
 * Students fetch their own assigned courses for the dashboard.
 *
 * API:
 *   GET  /api/assignments/my        — student: get own assignments (feedback window open)
 *   GET  /api/assignments           — admin: get all assignments
 *   POST /api/assignments           — admin: create assignment
 *   PUT  /api/assignments/:id       — admin: update (e.g. enroll students, toggle window)
 *   DELETE /api/assignments/:id     — admin: delete assignment
 */

const FacultyAssignment = require('../models/FacultyAssignment');
const { validationResult } = require('express-validator');
const { isDBConnected } = require('../config/db');

const requireDB = (res) => {
  if (!isDBConnected()) {
    res.status(503).json({ success: false, message: 'Database is not connected.' });
    return false;
  }
  return true;
};

/**
 * GET /api/assignments/my
 * Returns all open feedback assignments where the logged-in student is enrolled.
 */
const getMyAssignments = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const assignments = await FacultyAssignment.find({
      enrolledStudents: req.user._id,
      feedbackWindowOpen: true,
    })
      .populate('faculty', 'name department designation employeeId')
      .populate('course', 'courseCode title semester credits');

    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (err) { next(err); }
};

/**
 * GET /api/assignments  (admin only)
 */
const getAllAssignments = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const assignments = await FacultyAssignment.find()
      .populate('faculty', 'name employeeId department')
      .populate('course', 'courseCode title semester')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (err) { next(err); }
};

/**
 * POST /api/assignments  (admin only)
 */
const createAssignment = async (req, res, next) => {
  if (!requireDB(res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const assignment = await FacultyAssignment.create(req.body);
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'This exact assignment already exists.' });
    next(err);
  }
};

/**
 * PUT /api/assignments/:id  (admin only)
 * Can be used to enroll students or toggle feedbackWindowOpen.
 */
const updateAssignment = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const assignment = await FacultyAssignment.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    res.status(200).json({ success: true, data: assignment });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/assignments/:id  (admin only)
 */
const deleteAssignment = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const assignment = await FacultyAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    res.status(200).json({ success: true, message: 'Assignment deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getMyAssignments, getAllAssignments, createAssignment, updateAssignment, deleteAssignment };

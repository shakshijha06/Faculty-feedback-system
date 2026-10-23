/**
 * controllers/courseController.js
 * Admin CRUD for courses; students can list courses.
 */

const Course = require('../models/Course');
const { validationResult } = require('express-validator');
const { isDBConnected } = require('../config/db');

const requireDB = (res) => {
  if (!isDBConnected()) {
    res.status(503).json({ success: false, message: 'Database is not connected.' });
    return false;
  }
  return true;
};

const getAllCourses = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const courses = await Course.find({ isActive: true }).sort({ courseCode: 1 });
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (err) { next(err); }
};

const getCourseById = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.status(200).json({ success: true, data: course });
  } catch (err) { next(err); }
};

const createCourse = async (req, res, next) => {
  if (!requireDB(res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Course code already exists.' });
    next(err);
  }
};

const updateCourse = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.status(200).json({ success: true, data: course });
  } catch (err) { next(err); }
};

const deactivateCourse = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.status(200).json({ success: true, message: 'Course deactivated.' });
  } catch (err) { next(err); }
};

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, deactivateCourse };

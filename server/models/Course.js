/**
 * Course.js — Mongoose model for academic courses
 *
 * A course (e.g. "Data Structures") is taught by one faculty member
 * to one or more groups of students (captured in FacultyAssignment).
 *
 * Naming: courseCode is the official code (e.g. "CS301"),
 *         title is the human-readable name.
 */

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Course code cannot exceed 20 characters'],
    },

    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [150, 'Course title cannot exceed 150 characters'],
    },

    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },

    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
    },

    credits: {
      type: Number,
      min: [1, 'Credits must be at least 1'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
courseSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Course', courseSchema);

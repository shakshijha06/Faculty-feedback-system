/**
 * FacultyAssignment.js — Links a Faculty member to a Course and a group of Students
 *
 * This is the central "who teaches whom" record.
 * One assignment = one faculty + one course + one student group (division/semester).
 *
 * RELATIONSHIP MAP:
 *   Faculty  1 ──── * FacultyAssignment * ──── 1 Course
 *   Student  * ────────────────────────────────────────── FacultyAssignment
 *   (via enrolledStudents array)
 *
 * The feedbackWindowOpen flag controls whether students can currently submit feedback.
 * Admins flip this flag to open/close the feedback period.
 */

const mongoose = require('mongoose');

const facultyAssignmentSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty reference is required'],
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },

    // Academic context — helps filter assignments on the student dashboard
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      // e.g. "2024-25"
      match: [/^\d{4}-\d{2,4}$/, 'Academic year format should be like 2024-25'],
    },
    division: {
      type: String,
      trim: true,
      // e.g. "A", "B" — optional; allows filtering by class division
    },
    department: {
      type: String,
      trim: true,
      required: [true, 'Department is required'],
    },

    // Students enrolled in this assignment — referenced by User._id
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ── Feedback window ───────────────────────────────────────────────────────
    // Admin opens this before the feedback period and closes it after.
    feedbackWindowOpen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound index ────────────────────────────────────────────────────────────
// Prevents creating duplicate assignments for the same faculty + course + year.
facultyAssignmentSchema.index(
  { faculty: 1, course: 1, academicYear: 1, division: 1 },
  { unique: true }
);

facultyAssignmentSchema.index({ semester: 1, department: 1, academicYear: 1 });

module.exports = mongoose.model('FacultyAssignment', facultyAssignmentSchema);

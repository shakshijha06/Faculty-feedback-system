/**
 * Faculty.js — Mongoose model for faculty members
 *
 * Faculty are NOT users — they cannot log in.
 * They are managed by admins (CRUD) and assigned to courses via FacultyAssignment.
 *
 * Students rate faculty through feedback forms; results are aggregated
 * and never link individual responses back to a student.
 */

const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    // ── Academic details ──────────────────────────────────────────────────────
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
      // e.g. "Assistant Professor", "Professor", "HOD"
    },

    // ── Status ────────────────────────────────────────────────────────────────
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
facultySchema.index({ department: 1 });
facultySchema.index({ isActive: 1 });

module.exports = mongoose.model('Faculty', facultySchema);

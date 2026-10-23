/**
 * User.js — Mongoose model for students and admins
 *
 * A single User collection handles both roles:
 *   role: 'student' — can view assigned courses and submit feedback
 *   role: 'admin'   — can manage faculty, courses, and view reports
 *
 * We separate roles (not separate collections) to keep auth logic simple.
 * Faculty members are NOT users in this system — they are managed by admins
 * and represented in the Faculty collection.
 *
 * PRIVACY NOTE: Student identity is never stored inside FeedbackSubmission
 * documents. Only SubmissionStatus tracks "which student submitted for which
 * assignment" — and that collection is never exposed to faculty.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // College/institutional email — used as the login identifier
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // select: false means password is NOT returned in queries by default
      select: false,
    },

    // ── Role ─────────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: 'Role must be either student or admin',
      },
      default: 'student',
    },

    // ── Student-specific fields ───────────────────────────────────────────────
    // Only populated when role === 'student'
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      // unique + sparse: enforces uniqueness for students while allowing
      // multiple admin documents that have no rollNumber (null is excluded from the index)
      unique: true,
      sparse: true,
    },
    semester: {
      type: Number,
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
    },
    department: {
      type: String,
      trim: true,
    },
    division: {
      type: String,
      trim: true,
      maxlength: 10,
    },

    // ── Account state ─────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// email already indexed via unique: true
userSchema.index({ role: 1 });
userSchema.index({ department: 1, semester: 1 });

// ── Password hashing hook ─────────────────────────────────────────────────────
// Runs automatically before every save(). Only re-hashes when password changed.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: verify password ─────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

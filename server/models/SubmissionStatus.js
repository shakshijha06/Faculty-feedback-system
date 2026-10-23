/**
 * models/SubmissionStatus.js — Voter-roll record
 *
 * Tracks WHICH student submitted for WHICH faculty in WHICH academic year.
 * Contains ZERO feedback content — that lives in FeedbackSubmission.
 *
 * Purpose: prevent duplicate submissions without exposing student identity
 * inside the feedback content itself.
 */

const mongoose = require('mongoose');

const submissionStatusSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2,4}$/, 'Format: 2024-25'],
    },
    hasSubmitted: { type: Boolean, default: false },
    submittedAt:  { type: Date },
  },
  { timestamps: true }
);

// One record per student + faculty + year — guarantees no duplicates
submissionStatusSchema.index({ student: 1, faculty: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('SubmissionStatus', submissionStatusSchema);

/**
 * models/FeedbackDraft.js
 *
 * Stores an in-progress feedback form for a student/faculty pair.
 * Drafts are per-student and can be resumed after logout.
 *
 * PRIVACY: Draft IS linked to student (intentional — it's the student's own work-in-progress).
 * On final submission the content moves to FeedbackSubmission (no student link)
 * and this draft is deleted.
 */

const mongoose = require('mongoose');

const draftRatingSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true, trim: true },
    label:       { type: String, trim: true },
    score:       { type: Number, min: 0, max: 5, default: 0 },
    reason:      { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const feedbackDraftSchema = new mongoose.Schema(
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
    ratings:            { type: [draftRatingSchema], default: [] },
    positiveComment:    { type: String, trim: true, maxlength: 1000 },
    improvementComment: { type: String, trim: true, maxlength: 1000 },
    overallComment:     { type: String, trim: true, maxlength: 1500 },
    lastSaved:          { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One draft per student per faculty per year
feedbackDraftSchema.index({ student: 1, faculty: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('FeedbackDraft', feedbackDraftSchema);

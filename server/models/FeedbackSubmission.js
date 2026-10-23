/**
 * models/FeedbackSubmission.js — Final anonymous feedback content
 *
 * PRIVACY: This document contains NO student identity.
 * It is linked to a Faculty (not an assignment) + academicYear.
 * The anonymousToken is a server-generated UUID — never from student data.
 * SubmissionStatus.js is the separate record that tracks who has submitted.
 *
 * RATING SCHEMA — each rating requires:
 *   questionKey : machine-readable key
 *   label       : human-readable question text
 *   score       : numeric 1–5
 *   reason      : mandatory explanation (min 5 chars)
 */

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true, trim: true },
    label:       { type: String, trim: true },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [1, 'Score must be at least 1'],
      max: [5, 'Score must be at most 5'],
    },
    reason: {
      type: String,
      required: [true, 'A reason is required for each rating'],
      trim: true,
      minlength: [5,  'Reason must be at least 5 characters'],
      maxlength: [500,'Reason cannot exceed 500 characters'],
    },
  },
  { _id: false }
);

const feedbackSubmissionSchema = new mongoose.Schema(
  {
    // Faculty being evaluated — NOT a student reference
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty reference is required'],
    },

    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      match: [/^\d{4}-\d{2,4}$/, 'Format: 2024-25'],
    },

    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },

    // Server-generated UUID — NOT derived from student data
    anonymousToken: {
      type: String,
      required: true,
    },

    ratings: {
      type: [ratingSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one rating is required',
      },
    },

    positiveComment:    { type: String, trim: true, maxlength: 1000 },
    improvementComment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

feedbackSubmissionSchema.index({ faculty: 1, academicYear: 1 });

module.exports = mongoose.model('FeedbackSubmission', feedbackSubmissionSchema);

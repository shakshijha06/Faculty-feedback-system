/**
 * models/AwardNomination.js — Award of Excellence nominations
 *
 * Workflow: one student submits one nomination document per academic year.
 * The document contains:
 *   - primaryFaculty + primaryReason (required)
 *   - additionalNominees[] — up to 2 optional additional nominees, each with faculty + reason
 *
 * Uniqueness: compound index on { nominator, academicYear } prevents double submission.
 * Privacy: nominator is stored for de-duplication audit; it is NEVER returned
 *          in faculty-facing or public API responses.
 */

const mongoose = require('mongoose');

// Sub-schema for an additional (optional) nominee
const additionalNomineeSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty reference is required for additional nominee'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required for each additional nominee'],
      trim: true,
      minlength: [20, 'Reason must be at least 20 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
  },
  { _id: false }
);

const awardNominationSchema = new mongoose.Schema(
  {
    // The submitting student — for de-duplication only, never exposed to faculty
    nominator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Nominator (student) is required'],
    },

    // Primary (required) nominee
    primaryFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Primary nominated faculty is required'],
    },
    primaryReason: {
      type: String,
      required: [true, 'Reason for primary nomination is required'],
      trim: true,
      minlength: [20, 'Please provide at least 20 characters for the reason'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },

    // Up to 2 optional additional nominees
    additionalNominees: {
      type: [additionalNomineeSchema],
      validate: {
        validator: (arr) => arr.length <= 2,
        message: 'You may nominate at most 2 additional faculty members',
      },
      default: [],
    },

    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      match: [/^\d{4}-\d{2,4}$/, 'Academic year format should be like 2024-25'],
    },

    // Admin workflow: pending → shortlisted (Award/Reject handled separately)
    status: {
      type: String,
      enum: ['pending', 'shortlisted'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// One student can submit only one nomination per academic year
awardNominationSchema.index({ nominator: 1, academicYear: 1 }, { unique: true });

// For leaderboard: how many nominations each faculty received
awardNominationSchema.index({ primaryFaculty: 1, academicYear: 1 });

module.exports = mongoose.model('AwardNomination', awardNominationSchema);

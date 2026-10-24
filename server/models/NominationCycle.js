/**
 * models/NominationCycle.js
 *
 * An admin creates a NominationCycle to open nominations for a given academic year.
 * Only active, named faculty listed in eligibleFaculty[] may be nominated by students.
 *
 * At most one cycle should be 'open' at a time — enforced at the application level.
 */

const mongoose = require('mongoose');

const nominationCycleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Cycle title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      match: [/^\d{4}-\d{2,4}$/, 'Format: 2024-25'],
    },

    // Status controls whether students can submit nominations
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'closed',
    },

    // Faculty who are eligible for nomination in this cycle
    eligibleFaculty: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
      },
    ],

    // The admin who created this cycle
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Soft delete / archival flag
    isDeleted: {
      type: Boolean,
      default: false,
    },

    openedAt:  { type: Date },
    closedAt:  { type: Date },
  },
  { timestamps: true }
);

nominationCycleSchema.index({ academicYear: 1 });
nominationCycleSchema.index({ status: 1 });

module.exports = mongoose.model('NominationCycle', nominationCycleSchema);

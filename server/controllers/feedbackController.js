/**
 * controllers/feedbackController.js
 *
 * Faculty-based (not assignment-based) anonymous feedback.
 * Students from a given department submit feedback on active faculty
 * from their same department during an open academic year.
 *
 * PRIVACY:
 * - FeedbackSubmission stores NO student identity.
 * - SubmissionStatus is the only place student↔faculty is linked.
 * - Draft IS student-linked (intentional — it's their own in-progress work).
 * - Results API returns aggregated data only — no student identifiers ever.
 *
 * API:
 *   POST /api/feedback/submit                   — submit final feedback
 *   GET  /api/feedback/status/:facultyId        — student: check if already submitted
 *   GET  /api/feedback/draft/:facultyId         — student: load saved draft
 *   POST /api/feedback/draft/:facultyId         — student: save/update draft
 *   GET  /api/feedback/results/:facultyId       — admin: aggregated results for a faculty
 */

const FeedbackSubmission = require('../models/FeedbackSubmission');
const FeedbackDraft      = require('../models/FeedbackDraft');
const SubmissionStatus   = require('../models/SubmissionStatus');
const Faculty            = require('../models/Faculty');
const { validationResult } = require('express-validator');
const { isDBConnected }  = require('../config/db');
const crypto = require('crypto');

const CURRENT_YEAR = '2024-25'; // In production, derive from an active period model

const requireDB = (res) => {
  if (!isDBConnected()) {
    res.status(503).json({ success: false, message: 'Database is not connected.' });
    return false;
  }
  return true;
};

// ── POST /api/feedback/submit ─────────────────────────────────────────────────
const submitFeedback = async (req, res, next) => {
  if (!requireDB(res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { facultyId, ratings, positiveComment, improvementComment, overallComment, academicYear } = req.body;
  const year = academicYear || CURRENT_YEAR;
  const studentId = req.user._id;

  try {
    // 1. Faculty must exist and be active
    const faculty = await Faculty.findById(facultyId);
    if (!faculty || !faculty.isActive) {
      return res.status(404).json({ success: false, message: 'Faculty member not found or inactive.' });
    }

    // 2. Student and faculty must share the same department (normalized matching)
    if (req.user.department && faculty.department) {
      const sDept = req.user.department.trim().toLowerCase();
      const fDept = faculty.department.trim().toLowerCase();
      const isCse = (d) => d.includes('computer') || d.includes('cse');
      const isIt  = (d) => d.includes('information') || d === 'it';
      const isEce = (d) => d.includes('electronics') || d === 'ece';
      const isIot = (d) => d.includes('things') || d === 'iot';

      const match = sDept === fDept ||
        (isCse(sDept) && isCse(fDept)) ||
        (isIt(sDept) && isIt(fDept)) ||
        (isEce(sDept) && isEce(fDept)) ||
        (isIot(sDept) && isIot(fDept));

      if (!match) {
        return res.status(403).json({ success: false, message: 'You can only submit feedback for faculty in your department.' });
      }
    }

    // 3. Duplicate check
    const existing = await SubmissionStatus.findOne({ student: studentId, faculty: facultyId, academicYear: year });
    if (existing?.hasSubmitted) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this faculty member.' });
    }

    // 4. Validate each rating has both score and reason
    if (!Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one rating is required.' });
    }
    for (const r of ratings) {
      if (!r.score || r.score < 1 || r.score > 5)
        return res.status(400).json({ success: false, message: `Score for "${r.questionKey}" must be 1–5.` });
      if (!r.reason || r.reason.trim().length < 5)
        return res.status(400).json({ success: false, message: `A reason (min 5 chars) is required for "${r.label || r.questionKey}".` });
    }

    // Validate overall comment if required
    if (overallComment !== undefined && overallComment.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide an overall comment of at least 5 characters.' });
    }

    // 5. Generate server-side anonymous token (no student data used)
    const anonymousToken = crypto.randomUUID();

    // 6a. Store anonymous feedback content
    await FeedbackSubmission.create({
      faculty: facultyId,
      academicYear: year,
      department: faculty.department,
      anonymousToken,
      ratings,
      positiveComment:    positiveComment    ? positiveComment.trim()    : undefined,
      improvementComment: improvementComment ? improvementComment.trim() : undefined,
      overallComment:     overallComment     ? overallComment.trim()     : undefined,
    });

    // 6b. Record submission in voter roll (student linked, no content)
    await SubmissionStatus.findOneAndUpdate(
      { student: studentId, faculty: facultyId, academicYear: year },
      { hasSubmitted: true, submittedAt: new Date() },
      { upsert: true, new: true }
    );

    // 7. Remove draft now that final submission is done
    await FeedbackDraft.findOneAndDelete({ student: studentId, faculty: facultyId, academicYear: year });

    res.status(201).json({ success: true, message: 'Feedback submitted successfully. Your response is anonymous.' });
  } catch (err) { next(err); }
};

// ── GET /api/feedback/status/:facultyId ──────────────────────────────────────
const getSubmissionStatus = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const year = req.query.year || CURRENT_YEAR;
    const status = await SubmissionStatus.findOne({
      student: req.user._id,
      faculty: req.params.facultyId,
      academicYear: year,
    });
    res.status(200).json({
      success: true,
      hasSubmitted: status?.hasSubmitted || false,
      submittedAt:  status?.submittedAt  || null,
    });
  } catch (err) { next(err); }
};

// ── GET /api/feedback/draft/:facultyId ────────────────────────────────────────
const getDraft = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const year  = req.query.year || CURRENT_YEAR;
    const draft = await FeedbackDraft.findOne({
      student: req.user._id,
      faculty: req.params.facultyId,
      academicYear: year,
    });
    res.status(200).json({ success: true, data: draft || null });
  } catch (err) { next(err); }
};

// ── POST /api/feedback/draft/:facultyId ──────────────────────────────────────
const saveDraft = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const year = req.body.academicYear || CURRENT_YEAR;
    const draft = await FeedbackDraft.findOneAndUpdate(
      { student: req.user._id, faculty: req.params.facultyId, academicYear: year },
      {
        ratings:            req.body.ratings            || [],
        positiveComment:    req.body.positiveComment    || '',
        improvementComment: req.body.improvementComment || '',
        overallComment:     req.body.overallComment     || '',
        lastSaved: new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Draft saved.', data: { lastSaved: draft.lastSaved } });
  } catch (err) { next(err); }
};

// ── GET /api/feedback/results/:facultyId (admin only) ─────────────────────────
const getAggregatedResults = async (req, res, next) => {
  if (!requireDB(res)) return;
  try {
    const year = req.query.year || CURRENT_YEAR;
    const submissions = await FeedbackSubmission.find({ faculty: req.params.facultyId, academicYear: year });

    const empty = { success: true, responseCount: 0, averageScores: {}, overallAverage: null, comments: [] };
    if (submissions.length === 0) return res.status(200).json(empty);

    const scoreSums = {};
    const scoreCounts = {};
    let totalSum = 0, totalCount = 0;

    submissions.forEach(sub => {
      sub.ratings.forEach(({ questionKey, score }) => {
        scoreSums[questionKey]   = (scoreSums[questionKey]   || 0) + score;
        scoreCounts[questionKey] = (scoreCounts[questionKey] || 0) + 1;
        totalSum   += score;
        totalCount += 1;
      });
    });

    const averageScores = {};
    Object.keys(scoreSums).forEach(k => {
      averageScores[k] = parseFloat((scoreSums[k] / scoreCounts[k]).toFixed(2));
    });

    const overallAverage = totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(2)) : null;

    // Only anonymous text — no student identifiers
    const comments = submissions
      .filter(s => s.positiveComment || s.improvementComment)
      .map(s => ({ positiveComment: s.positiveComment || null, improvementComment: s.improvementComment || null }));

    res.status(200).json({ success: true, responseCount: submissions.length, averageScores, overallAverage, comments });
  } catch (err) { next(err); }
};

module.exports = { submitFeedback, getSubmissionStatus, getDraft, saveDraft, getAggregatedResults };

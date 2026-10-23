/**
 * app.js — Express application setup
 *
 * This file creates and configures the Express app.
 * It is kept separate from index.js so the app can be imported
 * in tests without starting the HTTP server.
 */

const express = require('express');
const cors = require('cors');
const { isDBConnected } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Route imports (added progressively through the phases) ────────────────────
const authRoutes            = require('./routes/authRoutes');
const facultyRoutes         = require('./routes/facultyRoutes');
const courseRoutes          = require('./routes/courseRoutes');
const assignmentRoutes      = require('./routes/assignmentRoutes');
const feedbackRoutes        = require('./routes/feedbackRoutes');
const nominationRoutes      = require('./routes/nominationRoutes');
const nominationCycleRoutes = require('./routes/nominationCycleRoutes');
const adminRoutes           = require('./routes/adminRoutes');

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────────

// Parse incoming JSON bodies
app.use(express.json());

// Allow the React dev server (port 5173 by default) to call this API
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// ── Health-Check Endpoint ─────────────────────────────────────────────────────
/**
 * GET /api/health
 *
 * Returns the server status and the database connection state.
 * Use this to verify the server is running without needing a DB connection.
 *
 * Example response (DB not configured):
 * {
 *   "success": true,
 *   "server": "running",
 *   "database": "disconnected",
 *   "message": "Server is up. Database is not connected — check your MONGODB_URI."
 * }
 */
app.get('/api/health', (req, res) => {
  const db = isDBConnected();
  res.status(200).json({
    success: true,
    server: 'running',
    database: db ? 'connected' : 'disconnected',
    message: db
      ? 'Server and database are both healthy.'
      : 'Server is up. Database is not connected — check your MONGODB_URI in server/.env.',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',               authRoutes);
app.use('/api/faculty',            facultyRoutes);
app.use('/api/courses',            courseRoutes);
app.use('/api/assignments',        assignmentRoutes);
app.use('/api/feedback',           feedbackRoutes);
app.use('/api/nominations',        nominationRoutes);
app.use('/api/nomination-cycles',  nominationCycleRoutes);
app.use('/api/admin',              adminRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Centralized Error Handler (must be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;

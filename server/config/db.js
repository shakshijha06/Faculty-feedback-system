/**
 * db.js — Mongoose connection module
 *
 * Reads MONGODB_URI from the environment and connects to MongoDB.
 * If the URI is missing or the connection fails, it logs a clear error
 * and sets a global flag so the rest of the app can report "DB unavailable"
 * rather than silently pretending operations succeeded.
 *
 * Usage:
 *   const { connectDB, isDBConnected } = require('./config/db');
 *   await connectDB();
 */

const mongoose = require('mongoose');

// Track connection state so routes can check before executing DB operations
let dbConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      '\n⚠️  MONGODB_URI is not set in your .env file.\n' +
      '   Copy server/.env.example → server/.env and fill in your Atlas connection string.\n' +
      '   The server will start, but all database operations will fail until this is fixed.\n'
    );
    return; // Do NOT throw — let the server start so the health check still works
  }

  try {
    await mongoose.connect(uri);
    dbConnected = true;
    console.log('✅  MongoDB connected successfully');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    console.error(
      '   Check your MONGODB_URI and make sure your Atlas cluster is running.\n' +
      '   The server will continue without a database connection.\n'
    );
    // Do NOT crash the process here — controllers will check isDBConnected()
  }
};

/**
 * Returns true only when Mongoose is fully connected.
 * Controllers use this to return a 503 instead of crashing.
 */
const isDBConnected = () => dbConnected;

module.exports = { connectDB, isDBConnected };

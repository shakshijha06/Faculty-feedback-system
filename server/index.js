/**
 * index.js — Server entry point
 *
 * 1. Loads environment variables from .env
 * 2. Connects to MongoDB (gracefully — server still starts on failure)
 * 3. Starts the HTTP server
 */

require('dotenv').config(); // Must be the very first line

const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Attempt database connection before accepting requests.
  // connectDB() will NOT throw on failure — it logs and continues.
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: /api/health`);
});
};

startServer();

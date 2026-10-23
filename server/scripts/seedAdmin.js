/**
 * scripts/seedAdmin.js
 *
 * Creates the initial admin account from environment variables.
 * Run this ONCE after setting up your .env file and connecting to MongoDB Atlas.
 *
 * Usage:
 *   cd server
 *   node scripts/seedAdmin.js
 *
 * Required .env variables:
 *   MONGODB_URI   — your Atlas connection string
 *   ADMIN_EMAIL   — email for the admin account
 *   ADMIN_PASSWORD — initial admin password (min 6 chars)
 *
 * This script is SAFE to run multiple times — it checks if the admin
 * already exists before creating a new one.
 *
 * NEVER hardcode credentials here. All values come from .env.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const runSeed = async () => {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  // Validate that required env vars are present
  if (!uri || !email || !password) {
    console.error('❌ Missing required environment variables.');
    console.error('   Make sure MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD are set in server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ email, role: 'admin' });
    if (existing) {
      console.log(`ℹ️  Admin account already exists for ${email}. No changes made.`);
      await mongoose.disconnect();
      return;
    }

    // Create admin — password is hashed automatically by the User model's pre-save hook
    await User.create({ name: 'System Admin', email, password, role: 'admin' });
    console.log(`✅ Admin account created successfully for ${email}`);
    console.log('   You can now log in at POST /api/auth/login with these credentials.');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

runSeed();

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function verifyAllUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const result = await User.updateMany(
      { isVerified: false },
      { $set: { isVerified: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users to verified status.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifyAllUsers();

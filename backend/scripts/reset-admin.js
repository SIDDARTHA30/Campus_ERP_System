require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    const email = 'sid76sidhu@gmail.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.findOneAndUpdate(
      { email },
      { 
        $set: { 
          passwordHash: hashedPassword,
          role: 'admin',
          isVerified: true,
          mustChangePassword: false,
          status: 'active',
          name: 'System Administrator'
        }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Admin account reset successfully:', result.email);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting admin:', err.message);
    process.exit(1);
  }
}

resetAdmin();

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { connectDB } = require('../config/db');

async function seedAdmin() {
  try {
    await connectDB();
    console.log('✅ DB Connected for seeding');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@institution.ac.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists:', adminEmail);
      
      // Update password just in case user wants to reset it via .env
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      existingAdmin.passwordHash = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      existingAdmin.mustChangePassword = false;
      await existingAdmin.save();
      
      console.log('✅ Admin credentials updated successfully');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const newAdmin = new User({
        name: 'System Administrator',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin',
        isVerified: true,
        mustChangePassword: false,
        status: 'active'
      });

      await newAdmin.save();
      console.log('✅ Admin user created successfully:', adminEmail);
    }

    mongoose.connection.close();
    console.log('👋 Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedAdmin();

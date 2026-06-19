const User = require('../models/User');
const bcrypt = require('bcrypt');

const seedData = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env. Skipping admin check.');
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      console.log(`🚀 Creating initial admin account: ${adminEmail}`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin',
        isVerified: true,
        mustChangePassword: false,
        status: 'active'
      });
      console.log('✅ Admin account created successfully.');
    } else {
      console.log(`ℹ️ Admin account already exists: ${adminEmail}`);
    }
  } catch (error) {
    console.error('❌ Error during auto-seeding:', error.message);
  }
};

module.exports = seedData;
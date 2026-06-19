const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("../models/User");

const createAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD.trim();

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const adminData = {
      name: "Super Admin",
      email,
      passwordHash,
      role: "admin",
      isVerified: true,
      mustChangePassword: false,
      status: "active",
    };

    const user = await User.findOneAndUpdate(
      { email },
      { $set: adminData },
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`✅ Admin ${user ? 'synced' : 'created'} successfully: ${email}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

createAdmin();

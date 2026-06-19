const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in .env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected.");

    const hashed = await bcrypt.hash("123456", 10);

    // Update all users: set passwordHash to "123456" and clear mustChangePassword/isVerified flags
    const result = await User.updateMany(
      {}, 
      { 
        $set: { 
          passwordHash: hashed,
          mustChangePassword: false,
          isVerified: true
        } 
      }
    );

    console.log(`✅ Reset complete. Updated ${result.modifiedCount} users.`);
    console.log("✅ All user passwords are now set to: 123456");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during password reset:", error.message);
    process.exit(1);
  }
}

run();

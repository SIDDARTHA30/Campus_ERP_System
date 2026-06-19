const mongoose = require('mongoose');
const seedData = require('./seed');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not set in environment variables');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri);
    const maskedUri = mongoUri.replace(/\/\/.*:.*@/, '//****:****@');
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
    console.log(`🔗 URI: ${maskedUri}`);

    // Seed initial data only if necessary
    await seedData();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
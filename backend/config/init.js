const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Book = require('../models/Book');
const User = require('../models/User');

/**
 * Synchronizes all model indexes with the database.
 * This should be run on server startup to ensure data integrity
 * without impacting performance during bulk operations.
 */
const syncAllIndexes = async () => {
  try {
    console.log('🔄 Syncing Database Indexes...');
    await Promise.all([
      Student.syncIndexes(),
      Faculty.syncIndexes(),
      Subject.syncIndexes(),
      Book.syncIndexes(),
      User.syncIndexes()
    ]);
    console.log('✅ Database Indexes Synced');

    // Logging collection names for verification
    console.log('📋 Collection Mapping:');
    console.log(`- Students: ${Student.collection.name}`);
    console.log(`- Faculty:  ${Faculty.collection.name}`);
    console.log(`- Subjects: ${Subject.collection.name}`);
    console.log(`- Books:    ${Book.collection.name}`);
    console.log(`- Users:    ${User.collection.name}`);

    // Logging current counts for persistence verification
    const [students, faculty, subjects, books, users] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Subject.countDocuments(),
      Book.countDocuments(),
      User.countDocuments()
    ]);

    console.log('📊 DATA SUMMARY ON STARTUP:');
    console.log(`- Students: ${students}`);
    console.log(`- Faculty:  ${faculty}`);
    console.log(`- Subjects: ${subjects}`);
    console.log(`- Books:    ${books}`);
    console.log(`- Users:    ${users}`);
    console.log('-------------------------------------------');
  } catch (error) {
    console.error('❌ Error during startup init:', error.message);
  }
};

module.exports = { syncAllIndexes };

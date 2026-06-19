const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Subject = require('./models/Subject');
    const Faculty = require('./models/Faculty');
    const User = require('./models/User');

    // Find subjects with assigned faculty
    const subs = await Subject.find({ faculty: { $ne: null } }).populate('faculty');
    console.log('--- Subjects with Assigned Faculty ---');
    console.log(subs.map(s => ({
      subjectName: s.name,
      code: s.code,
      facultyName: s.faculty?.name,
      facultyId: s.faculty?._id
    })));

    // Let's check users with faculty role
    const facultyUsers = await User.find({ role: 'faculty' }).limit(5);
    console.log('--- Faculty Users ---');
    console.log(facultyUsers.map(f => ({ name: f.name, email: f.email })));

    // Find a faculty that has subjects assigned
    const subWithFac = await Subject.findOne({ faculty: { $ne: null } }).populate('faculty');
    if (subWithFac && subWithFac.faculty) {
      console.log('Found faculty with subject:', subWithFac.faculty.name);
      // Let's find the User object for this faculty
      const userObj = await User.findOne({ name: subWithFac.faculty.name, role: 'faculty' });
      if (userObj) {
        console.log('User email for this faculty:', userObj.email);
      } else {
        // Let's find any User linked to this faculty
        const userObjByEmail = await User.findOne({ email: subWithFac.faculty.email });
        console.log('User by email:', userObjByEmail?.email);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();

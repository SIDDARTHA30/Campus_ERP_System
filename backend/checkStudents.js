const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Student = require('./models/Student');
    const User = require('./models/User');

    const students = await Student.find().limit(5);
    console.log('--- Student Models ---');
    console.log(students.map(s => ({ name: s.name, email: s.email, id: s._id, user: s.user })));

    const studentUsers = await User.find({ role: 'student' }).limit(5);
    console.log('--- Student Users ---');
    console.log(studentUsers.map(su => ({ name: su.name, email: su.email, id: su._id })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();

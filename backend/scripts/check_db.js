const mongoose = require('mongoose');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Mark = require('../models/Mark');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB:', mongoose.connection.name);

    const studentCount = await Student.countDocuments();
    const subjectCount = await Subject.countDocuments();
    const markCount = await Mark.countDocuments();

    console.log(`Students: ${studentCount}`);
    console.log(`Subjects: ${subjectCount}`);
    console.log(`Marks: ${markCount}`);

    if (studentCount > 0) {
      const s = await Student.findOne();
      console.log('Sample Student AdmissionNo:', s.admissionNo);
    }

    if (subjectCount > 0) {
      const sub = await Subject.findOne();
      console.log('Sample Subject Code:', sub.code);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();

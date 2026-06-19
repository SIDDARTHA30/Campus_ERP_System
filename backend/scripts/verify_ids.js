const mongoose = require('mongoose');
require('dotenv').config();

async function checkIds() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const Student = mongoose.model('Student', new mongoose.Schema({ admissionNo: String }));
  const Subject = mongoose.model('Subject', new mongoose.Schema({ code: String }));

  const studentId = '23891A0501';
  const subjectCode = '23CS501PC';

  const student = await Student.findOne({ 
    admissionNo: { $regex: `^${studentId}$`, $options: 'i' } 
  });
  const subject = await Subject.findOne({ 
    code: { $regex: `^${subjectCode}$`, $options: 'i' } 
  });

  console.log(`Student [${studentId}]:`, student ? 'EXISTS ✅' : 'NOT FOUND ❌');
  if (student) console.log('DB Student ID:', student.admissionNo);

  console.log(`Subject [${subjectCode}]:`, subject ? 'EXISTS ✅' : 'NOT FOUND ❌');
  if (subject) console.log('DB Subject Code:', subject.code);

  await mongoose.disconnect();
}

checkIds();

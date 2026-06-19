const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Faculty = require('./models/Faculty');
    const Subject = require('./models/Subject');

    // Clear and rebuild subjects array on Faculty models based on Subject.faculty references
    const faculties = await Faculty.find();
    let updatedCount = 0;

    for (const fac of faculties) {
      // Find all subjects where faculty field equals this faculty's ID
      const assignedSubjects = await Subject.find({ faculty: fac._id });
      const subjectIds = assignedSubjects.map(s => s._id);

      fac.subjects = subjectIds;
      await fac.save();
      
      console.log(`Faculty: ${fac.name} -> Assigned Subjects: ${assignedSubjects.map(s => s.name).join(', ') || 'None'}`);
      updatedCount++;
    }

    console.log(`✅ Synced subjects for ${updatedCount} faculty members.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();

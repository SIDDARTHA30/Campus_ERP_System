const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Faculty = require('./models/Faculty');
    const User = require('./models/User');

    const faculties = await Faculty.find();
    let updatedCount = 0;

    for (const fac of faculties) {
      // Find corresponding user by email
      const user = await User.findOne({ email: fac.email, role: 'faculty' });
      if (user) {
        fac.user = user._id;
        await fac.save();
        updatedCount++;
        console.log(`Linked Faculty: ${fac.name} (${fac.email}) -> User ID: ${user._id}`);
      } else {
        console.log(`No user found for Faculty: ${fac.name} (${fac.email})`);
      }
    }

    console.log(`✅ Completed linking. Updated ${updatedCount} faculty records.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();

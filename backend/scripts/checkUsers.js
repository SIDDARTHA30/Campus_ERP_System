(async ()=>{
  try{
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://127.0.0.1:27017/campus-erp');
    const User = require('../models/User');
    const count = await User.countDocuments();
    console.log('users:', count);
    await mongoose.connection.close();
    process.exit(0);
  }catch(err){
    console.error('error:', err);
    process.exit(1);
  }
})();

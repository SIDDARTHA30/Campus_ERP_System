const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  admissionNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  batch: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dateOfBirth: Date,
  address: String,
  phone: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
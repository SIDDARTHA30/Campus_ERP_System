const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: false
  },
  credits: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  className: String,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
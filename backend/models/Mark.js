const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  examType: {
    type: String,
    enum: ['internal', 'mid', 'semester', 'assignment', 'quiz'],
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  date: {
    type: Date,
    default: Date.now
  },
  remarks: String
}, {
  timestamps: true
});

const Mark = mongoose.model('Mark', markSchema);

module.exports = Mark;
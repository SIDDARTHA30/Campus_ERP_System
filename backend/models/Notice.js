const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'faculty', 'student']
  }],
  expiryDate: Date,
  category: {
    type: String,
    default: 'general'
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
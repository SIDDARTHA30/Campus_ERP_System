const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['tuition', 'library', 'exam', 'hostel', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  term: String,
  feeType: String,
  paidAmount: {
    type: Number,
    default: 0
  },
  paidDate: Date,
  transactionId: String,
  remarks: String
}, {
  timestamps: true
});

const Fee = mongoose.model('Fee', feeSchema);

module.exports = Fee;
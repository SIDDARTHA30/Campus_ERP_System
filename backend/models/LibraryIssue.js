const mongoose = require('mongoose');

const libraryIssueSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: Date,
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue'],
    default: 'issued'
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  remarks: String
}, {
  timestamps: true
});

const LibraryIssue = mongoose.model('LibraryIssue', libraryIssueSchema);

module.exports = LibraryIssue;
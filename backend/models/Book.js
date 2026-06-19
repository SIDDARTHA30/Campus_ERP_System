const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    trim: true
  },
  category: String,
  copiesTotal: {
    type: Number,
    default: 1
  },
  copiesAvailable: {
    type: Number,
    default: 1
  },
  location: String
}, {
  timestamps: true
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
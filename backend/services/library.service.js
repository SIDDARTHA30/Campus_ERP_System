const AppError = require("../utils/appError");
const Book = require("../models/Book");
const LibraryIssue = require("../models/LibraryIssue");
const Student = require("../models/Student");
const { enforceRoleFilters } = require("../utils/queryHelper");

const { sanitizeQuery } = require('../utils/queryHelper');

async function listBooks(query = {}) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { author, category, availableOnly, sortBy = "createdAt", sortOrder = "desc" } = query;

  if (isAll) console.log(`⚠️ limit=all requested in Library → capped to 10000`);
  const filter = {};

  if (author) filter.author = author;
  if (category) filter.category = category;
  if (availableOnly) filter.copiesAvailable = { $gt: 0 };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
      { isbn: { $regex: search, $options: "i" } }
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Book.find(filter).sort(sort).skip(skip).limit(numericLimit).lean(),
    Book.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / (numericLimit || 1))
    }
  };
}

async function getBookById(id) {
  const book = await Book.findById(id);
  if (!book) throw new AppError("Book not found", 404);
  return book;
}

async function createBook(payload) {
  const isbnDuplicate = await Book.findOne({ isbn: payload.isbn });
  if (isbnDuplicate) {
    throw new AppError("Book ISBN already exists", 409);
  }

  if (payload.copiesAvailable > payload.copiesTotal) {
    throw new AppError("Copies available cannot exceed copies total", 400);
  }

  return Book.create(payload);
}

async function updateBook(id, payload) {
  if (payload.isbn) {
    const isbnDuplicate = await Book.findOne({ isbn: payload.isbn, _id: { $ne: id } });
    if (isbnDuplicate) {
      throw new AppError("Book ISBN already exists", 409);
    }
  }

  const book = await Book.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!book) throw new AppError("Book not found", 404);

  if (book.copiesAvailable > book.copiesTotal) {
    book.copiesAvailable = book.copiesTotal;
    await book.save();
  }

  return book;
}

async function removeBook(id) {
  const book = await Book.findByIdAndDelete(id);
  if (!book) throw new AppError("Book not found", 404);
  return book;
}

async function listIssues(query = {}, user) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { student, book, status, sortBy = "issueDate", sortOrder = "desc" } = query;

  if (isAll) console.log('⚠️ limit=all requested in Library Issues → capped to 10000');
  let filter = {};

  // Enforce Privacy (Double Layer Security)
  filter = enforceRoleFilters(filter, user, query);

  if (book) filter.book = book;
  if (status) filter.status = status;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    LibraryIssue.find(filter).populate("student").populate("book").sort(sort).skip(skip).limit(numericLimit).lean(),
    LibraryIssue.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / (numericLimit || 1))
    }
  };
}

async function issueBook(payload) {
  const book = await Book.findById(payload.book);
  if (!book) throw new AppError("Book not found", 404);

  const student = await Student.findById(payload.student);
  if (!student) throw new AppError("Student not found", 404);

  if (book.copiesAvailable <= 0) {
    throw new AppError("No copies available for issue", 400);
  }

  const issue = await LibraryIssue.create({
    ...payload,
    status: "issued"
  });

  book.copiesAvailable -= 1;
  await book.save();

  return issue;
}

async function returnBook(payload) {
  const issue = await LibraryIssue.findById(payload.issueId);
  if (!issue) throw new AppError("Issue record not found", 404);

  if (issue.status === "returned") {
    throw new AppError("Book already returned", 400);
  }

  const book = await Book.findById(issue.book);

  issue.status = "returned";
  issue.returnDate = payload.returnDate || new Date();
  await issue.save();

  if (book) {
    book.copiesAvailable = Math.min(book.copiesAvailable + 1, book.copiesTotal);
    await book.save();
  }

  return issue;
}

async function getIssueById(id) {
  const issue = await LibraryIssue.findById(id).populate("student").populate("book");
  if (!issue) throw new AppError("Issue record not found", 404);
  return issue;
}

async function removeIssue(id) {
  const issue = await LibraryIssue.findByIdAndDelete(id);
  if (!issue) throw new AppError("Issue record not found", 404);
  return issue;
}

async function bulkUploadBooks(rows) {
  const summary = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // 1. Key Normalization & Validation
      const isbn = (row.isbn || "").toString().trim().toUpperCase();
      if (!isbn) {
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: "Missing ISBN" });
        continue;
      }

      const updateData = { isbn }; // Store normalized key
      if (row.title) updateData.title = row.title.trim();
      if (row.author) updateData.author = row.author.trim();
      if (row.category) updateData.category = row.category.trim();
      if (row.copiesTotal) updateData.copiesTotal = Number(row.copiesTotal);
      if (row.location) updateData.location = row.location.trim();

      const result = await Book.findOneAndUpdate(
        { isbn },
        { $set: updateData },
        { upsert: true, returnDocument: 'after', includeResultMetadata: true, setDefaultsOnInsert: true }
      );

      if (result.lastErrorObject.upserted) {
        summary.created++;
        // For new books, copiesAvailable = copiesTotal
        if (updateData.copiesTotal) {
          await Book.findByIdAndUpdate(result.value._id, { copiesAvailable: updateData.copiesTotal });
        }
      } else {
        summary.updated++;
      }
    } catch (err) {
      summary.skipped++;
      summary.errors.push({ row: i + 1, error: err.message });
    }
  }

  return {
    created: summary.created,
    updated: summary.updated,
    skipped: summary.skipped,
    errors: summary.errors
  };
}

async function removeAllBooks() {
  return Book.deleteMany({});
}

module.exports = {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  removeBook,
  removeAllBooks,
  bulkUploadBooks,
  listIssues,
  issueBook,
  returnBook,
  getIssueById,
  removeIssue
};
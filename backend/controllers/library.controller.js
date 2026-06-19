const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const libraryService = require('../services/library.service');

module.exports = {
  listBooks: asyncHandler(async (req, res) => {
    const data = await libraryService.listBooks(req.query);
    res.json(successResponse('Books fetched successfully', data));
  }),
  getBookById: asyncHandler(async (req, res) => {
    const data = await libraryService.getBookById(req.params.id);
    res.json(successResponse('Book fetched successfully', data));
  }),
  createBook: asyncHandler(async (req, res) => {
    const data = await libraryService.createBook(req.body);
    res.status(201).json(successResponse('Book created successfully', data));
  }),
  updateBook: asyncHandler(async (req, res) => {
    const data = await libraryService.updateBook(req.params.id, req.body);
    res.json(successResponse('Book updated successfully', data));
  }),
  removeBook: asyncHandler(async (req, res) => {
    const data = await libraryService.removeBook(req.params.id);
    res.json(successResponse('Book deleted successfully', data));
  }),
  listIssues: asyncHandler(async (req, res) => {
    const data = await libraryService.listIssues(req.query, req.user);
    res.json(successResponse('Library issues fetched successfully', data));
  }),
  issueBook: asyncHandler(async (req, res) => {
    const data = await libraryService.issueBook(req.body);
    res.status(201).json(successResponse('Book issued successfully', data));
  }),
  returnBook: asyncHandler(async (req, res) => {
    const data = await libraryService.returnBook(req.body);
    res.json(successResponse('Book returned successfully', data));
  }),
  getIssueById: asyncHandler(async (req, res) => {
    const data = await libraryService.getIssueById(req.params.id);
    res.json(successResponse('Issue record fetched successfully', data));
  }),
  removeIssue: asyncHandler(async (req, res) => {
    const data = await libraryService.removeIssue(req.params.id);
    res.json(successResponse('Issue record deleted successfully', data));
  }),
  bulkUploadBooks: asyncHandler(async (req, res) => {
    const csv = require('csv-parser');
    const fs = require('fs');
    if (!req.file) throw new Error('No file uploaded');
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/^\ufeff/, '')
      }))
      .on('data', (data) => {
        results.push({
          isbn: data.isbn,
          title: data.title,
          author: data.author,
          category: data.category || 'general',
          copiesTotal: data.copiestotal || data.copiesTotal || data.copies || 1,
          location: data.location || ''
        });
      })
      .on('end', async () => {
        const summary = await libraryService.bulkUploadBooks(results);
        fs.unlinkSync(req.file.path);
        res.json(successResponse('Books bulk upload completed', summary));
      });
  }),
  removeAllBooks: asyncHandler(async (req, res) => {
    await libraryService.removeAllBooks();
    res.json(successResponse('All books cleared successfully'));
  })
};
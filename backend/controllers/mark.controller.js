const createCrudController = require('./base.controller');
const markService = require('../services/mark.service');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const csv = require('csv-parser');
const fs = require('fs');

const base = createCrudController(markService, {
  entityLabel: 'Mark record',
  listLabel: 'Mark records'
});

module.exports = {
  ...base,
  bulkUpload: asyncHandler(async (req, res) => {
    if (!req.file) throw new Error('No file uploaded');
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/^\ufeff/, '')
      }))
      .on('data', (data) => {
        // Explicitly map keys to lowercase to be safe
        results.push({
          studentid: String(data.studentid || data.studentId || data.admissionno || "").trim(),
          subjectcode: String(data.subjectcode || data.subjectCode || data.code || "").trim(),
          marks: Number(data.marks || data.score || 0),
          maxscore: Number(data.maxscore || data.maxScore || 100),
          examtype: String(data.examtype || data.examType || "Internal").trim()
        });
      })
      .on('end', async () => {
        if (results.length > 0) console.log("Sample Cleaned Row:", results[0]);
        const summary = await markService.bulkUpload(results);
        fs.unlinkSync(req.file.path);
        res.json(successResponse('Bulk upload completed', summary));
      });
  }),
  removeAll: asyncHandler(async (req, res) => {
    await markService.removeAll();
    res.json(successResponse('All marks deleted successfully'));
  }),
  getStudentAnalytics: asyncHandler(async (req, res) => {
    const studentId = req.user.role === 'student' ? req.user.studentId : req.query.studentId;
    if (!studentId) throw new Error('Student ID is required');
    const data = await markService.getStudentAnalytics(studentId);
    res.json(successResponse('Student analytics retrieved', data));
  }),
  getFacultyAnalytics: asyncHandler(async (req, res) => {
    const facultyId = req.user.role === 'faculty' ? req.user.facultyId : req.query.facultyId;
    if (!facultyId) throw new Error('Faculty ID is required');
    const data = await markService.getFacultyAnalytics(facultyId);
    res.json(successResponse('Faculty analytics retrieved', data));
  }),
  getAdminAnalytics: asyncHandler(async (req, res) => {
    const data = await markService.getAdminAnalytics();
    res.json(successResponse('Admin analytics retrieved', data));
  })
};
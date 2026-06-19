const createCrudController = require('./base.controller');
const attendanceService = require('../services/attendance.service');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const csv = require('csv-parser');
const fs = require('fs');

const base = createCrudController(attendanceService, {
  entityLabel: 'Attendance record',
  listLabel: 'Attendance records'
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
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const summary = await attendanceService.bulkUpload(results);
        fs.unlinkSync(req.file.path);
        res.json(successResponse('Bulk upload completed', summary));
      });
  }),
  removeAll: asyncHandler(async (req, res) => {
    await attendanceService.removeAll();
    res.json(successResponse('All attendance records deleted successfully'));
  }),
  getAnalytics: asyncHandler(async (req, res) => {
    const analytics = await attendanceService.getAnalytics(req.query, req.user);
    res.json(successResponse('Attendance analytics fetched successfully', analytics));
  })
};
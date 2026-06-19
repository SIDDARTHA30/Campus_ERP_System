const createCrudController = require('./base.controller');
const facultyService = require('../services/faculty.service');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const csv = require('csv-parser');
const fs = require('fs');

const base = createCrudController(facultyService, {
  entityLabel: 'Faculty',
  listLabel: 'Faculty records'
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
        results.push({
          name: data.name,
          email: data.email,
          employeeCode: data.employeecode || data.employeeCode,
          department: data.department,
          designation: data.designation || 'Lecturer',
          phone: data.phone || ''
        });
      })
      .on('end', async () => {
        const summary = await facultyService.bulkUpload(results);
        fs.unlinkSync(req.file.path);
        res.json(successResponse('Bulk upload completed', summary));
      });
  }),
  removeAll: asyncHandler(async (req, res) => {
    await facultyService.removeAll();
    res.json(successResponse('All faculty records deleted successfully'));
  })
};
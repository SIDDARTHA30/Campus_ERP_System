const createCrudController = require('./base.controller');
const subjectService = require('../services/subject.service');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const csv = require('csv-parser');
const fs = require('fs');

const base = createCrudController(subjectService, {
  entityLabel: 'Subject',
  listLabel: 'Subjects'
});

module.exports = {
  ...base,
  bulkUpload: asyncHandler(async (req, res) => {
    if (!req.file) throw new Error('CSV file is required');
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/^\ufeff/, '')
      }))
      .on('data', (data) => {
        results.push({
          code: data.code,
          name: data.name,
          department: data.department,
          semester: data.semester,
          credits: data.credits,
          facultyId: data.facultyid || data.facultyId,
          className: data.classname || data.className
        });
      })
      .on('end', async () => {
        const summary = await subjectService.bulkUpload(results);
        fs.unlinkSync(req.file.path);
        res.json(successResponse('Bulk upload processed', summary));
      });
  }),
  removeAll: asyncHandler(async (req, res) => {
    await subjectService.removeAll();
    res.json(successResponse('All subjects deleted successfully'));
  })
};
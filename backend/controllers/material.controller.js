const createCrudController = require('./base.controller');
const materialService = require('../services/material.service');

const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const csv = require('csv-parser');
const fs = require('fs');

const base = createCrudController(materialService, {
  entityLabel: 'Material',
  listLabel: 'Materials'
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
          title: data.title,
          description: data.description || '',
          subjectCode: data.subjectcode || data.subjectCode || data.code,
          facultyId: data.facultyid || data.facultyId || data.employeecode,
          classId: data.classid || data.classId || '',
          tags: data.tags || '',
          fileUrl: data.fileurl || data.fileUrl || ''
        });
      })
      .on('end', async () => {
        const summary = await materialService.bulkUpload(results);
        fs.unlinkSync(req.file.path);
        res.json(successResponse('Bulk upload completed', summary));
      });
  }),
  removeAll: asyncHandler(async (req, res) => {
    await materialService.removeAll();
    res.json(successResponse('All materials cleared successfully'));
  })
};
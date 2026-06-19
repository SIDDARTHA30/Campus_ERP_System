const createCrudController = require('./base.controller');
const studentService = require('../services/student.service');

const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

const controller = createCrudController(studentService, {
  entityLabel: 'Student',
  listLabel: 'Students'
});

module.exports = {
  ...controller,
  bulkUpload: asyncHandler(async (req, res) => {
    if (!req.file) throw new Error('No file uploaded');
    const summary = await studentService.bulkUpload(req.file.path);
    res.json(successResponse('Bulk upload completed', summary));
  }),
  removeAll: asyncHandler(async (req, res) => {
    await studentService.removeAll();
    res.json(successResponse('All students deleted successfully'));
  })
};
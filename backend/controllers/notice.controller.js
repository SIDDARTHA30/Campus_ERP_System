const createCrudController = require('./base.controller');
const noticeService = require('../services/notice.service');

const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const csv = require('csv-parser');
const fs = require('fs');

const base = createCrudController(noticeService, {
  entityLabel: 'Notice',
  listLabel: 'Notices'
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
        let roles = data.targetaudience || data.targetRoles || 'student';
        if (roles.toLowerCase() === 'all') roles = 'admin,faculty,student';

        results.push({
          title: data.title,
          content: data.description || data.content,
          targetRoles: roles,
          category: data.category || 'general',
          isPinned: data.ispinned || data.isPinned || false,
          expiryDate: data.date || data.expirydate || data.expiryDate || ''
        });
      })
      .on('end', async () => {
        const summary = await noticeService.bulkUpload(results, req.user._id);
        fs.unlinkSync(req.file.path);
        res.json(successResponse('Bulk upload completed', summary));
      });
  }),
  removeAll: asyncHandler(async (req, res) => {
    await noticeService.removeAll();
    res.json(successResponse('All notices cleared successfully'));
  })
};
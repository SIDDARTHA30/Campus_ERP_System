const createCrudController = require('./base.controller');
const feeService = require('../services/fee.service');

const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const csv = require('csv-parser');
const fs = require('fs');

const base = createCrudController(feeService, {
  entityLabel: 'Fee record',
  listLabel: 'Fee records'
});

module.exports = {
  ...base,
  bulkUpload: asyncHandler(async (req, res) => {
    if (!req.file) throw new Error('No file uploaded');
    const results = [];
    let headersChecked = false;
    let fileStream;
    
    try {
      fileStream = fs.createReadStream(req.file.path);
      fileStream
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/^\ufeff/, '')
        }))
        .on('data', (data) => {
          // Validate CSV structure on first row
          if (!headersChecked) {
            const keys = Object.keys(data);
            const hasStudentId = keys.includes('studentid') || keys.includes('student_id') || keys.includes('admissionno');
            if (!hasStudentId) {
              fileStream.destroy();
              throw new Error('Invalid CSV structure. Missing studentId/admissionNo column.');
            }
            headersChecked = true;
          }

          // Map alternate columns
          const studentId = data.studentid || data.student_id || data.admissionno || '';
          const term = data.term || data.semester || '';
          const feeType = data.feetype || data.fee_type || data.type || '';
          const amountStr = data.amount || data.fee || data.totalfee || data.total_fee || '0';
          const paidAmountStr = data.paidamount || data.paid_amount || data.paid || '0';
          
          results.push({
            studentId: studentId.toString().trim(),
            term: term.toString().trim(),
            feeType: feeType.toString().trim(),
            amount: Number(amountStr.toString().replace(/,/g, '')) || 0,
            paidAmount: Number(paidAmountStr.toString().replace(/,/g, '')) || 0,
            type: data.type || 'tuition',
            status: data.status || 'pending',
            dueDate: data.duedate || data.dueDate,
            remarks: data.remarks || ''
          });
        })
        .on('end', async () => {
          try {
            const summary = await feeService.bulkUpload(results);
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            res.json(successResponse('Bulk upload completed', summary));
          } catch (uploadErr) {
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ success: false, message: uploadErr.message });
          }
        })
        .on('error', (streamErr) => {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          res.status(400).json({ success: false, message: streamErr.message });
        });
    } catch (err) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ success: false, message: err.message });
    }
  }),
  removeAll: asyncHandler(async (req, res) => {
    await feeService.removeAll();
    res.json(successResponse('All fee records cleared successfully'));
  })
};
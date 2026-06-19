const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const filterSelf = require('../middleware/filterSelf');
const { idParamSchema, attendanceSchemas } = require('../validators');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.use(protect, restrictTo('student', 'faculty', 'admin'));

router.get('/analytics', attendanceController.getAnalytics);
router.get('/', filterSelf('student'), validateRequest(attendanceSchemas.list, 'query'), attendanceController.list);
router.get('/:id', validateRequest(idParamSchema, 'params'), attendanceController.getById);

router.post('/', restrictTo('faculty', 'admin'), validateRequest(attendanceSchemas.create), attendanceController.create);
router.post('/bulk-upload', restrictTo('faculty', 'admin'), upload.single('file'), attendanceController.bulkUpload);
router.put('/:id', restrictTo('faculty', 'admin'), validateRequest(idParamSchema, 'params'), validateRequest(attendanceSchemas.update), attendanceController.update);
router.delete('/clear-all', restrictTo('admin'), attendanceController.removeAll);
router.delete('/:id', restrictTo('faculty', 'admin'), validateRequest(idParamSchema, 'params'), attendanceController.remove);

module.exports = router;
const express = require('express');
const marksController = require('../controllers/mark.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const filterSelf = require('../middleware/filterSelf');
const { idParamSchema, markSchemas } = require('../validators');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.use(protect, restrictTo('student', 'faculty', 'admin'));

router.get('/analytics/student', restrictTo('student', 'faculty', 'admin'), marksController.getStudentAnalytics);
router.get('/analytics/faculty', restrictTo('faculty', 'admin'), marksController.getFacultyAnalytics);
router.get('/analytics/admin', restrictTo('admin'), marksController.getAdminAnalytics);

router.get('/', filterSelf('student'), validateRequest(markSchemas.list, 'query'), marksController.list);
router.get('/:id', validateRequest(idParamSchema, 'params'), marksController.getById);

router.post('/', restrictTo('faculty', 'admin'), validateRequest(markSchemas.create), marksController.create);
router.post('/bulk-upload', restrictTo('faculty', 'admin'), upload.single('file'), marksController.bulkUpload);
router.put('/:id', restrictTo('faculty', 'admin'), validateRequest(idParamSchema, 'params'), validateRequest(markSchemas.update), marksController.update);
router.delete('/clear-all', restrictTo('admin'), marksController.removeAll);
router.delete('/:id', restrictTo('faculty', 'admin'), validateRequest(idParamSchema, 'params'), marksController.remove);

module.exports = router;
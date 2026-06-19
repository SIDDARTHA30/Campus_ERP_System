const express = require('express');
const noticesController = require('../controllers/notice.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { idParamSchema, noticeSchemas } = require('../validators');

const multer = require('multer');
const upload = multer({ dest: 'tmp/' });

const router = express.Router();

router.use(protect, restrictTo('student', 'faculty', 'admin'));

router.get('/', validateRequest(noticeSchemas.list, 'query'), noticesController.list);
router.get('/:id', validateRequest(idParamSchema, 'params'), noticesController.getById);

router.use(restrictTo('faculty', 'admin'));
router.post('/bulk-upload', upload.single('file'), noticesController.bulkUpload);
router.post('/', validateRequest(noticeSchemas.create), noticesController.create);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(noticeSchemas.update), noticesController.update);

router.delete('/clear-all', restrictTo('admin'), noticesController.removeAll);
router.delete('/:id', restrictTo('admin'), validateRequest(idParamSchema, 'params'), noticesController.remove);

module.exports = router;
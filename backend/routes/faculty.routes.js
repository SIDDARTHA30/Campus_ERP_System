const express = require('express');
const facultyController = require('../controllers/faculty.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { idParamSchema, facultySchemas } = require('../validators');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.use(protect, restrictTo('faculty', 'admin'));

router.get('/', validateRequest(facultySchemas.list, 'query'), facultyController.list);
router.get('/:id', validateRequest(idParamSchema, 'params'), facultyController.getById);

router.use(restrictTo('admin'));
router.post('/', validateRequest(facultySchemas.create), facultyController.create);
router.post('/bulk-upload', upload.single('file'), facultyController.bulkUpload);
router.delete('/clear-all', facultyController.removeAll);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(facultySchemas.update), facultyController.update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), facultyController.remove);

module.exports = router;
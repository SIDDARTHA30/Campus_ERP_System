const express = require('express');
const subjectController = require('../controllers/subject.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { idParamSchema, subjectSchemas } = require('../validators');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.use(protect, restrictTo('student', 'faculty', 'admin'));

router.get('/', validateRequest(subjectSchemas.list, 'query'), subjectController.list);
router.get('/:id', validateRequest(idParamSchema, 'params'), subjectController.getById);

router.use(restrictTo('admin'));
router.post('/', validateRequest(subjectSchemas.create), subjectController.create);
router.post('/bulk-upload', upload.single('file'), subjectController.bulkUpload);
router.delete('/clear-all', subjectController.removeAll);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(subjectSchemas.update), subjectController.update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), subjectController.remove);

module.exports = router;
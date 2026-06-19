const express = require('express');
const materialsController = require('../controllers/material.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { idParamSchema, materialSchemas } = require('../validators');

const multer = require('multer');
const upload = multer({ dest: 'tmp/' });

const router = express.Router();

router.use(protect, restrictTo('student', 'faculty', 'admin'));

router.get('/', validateRequest(materialSchemas.list, 'query'), materialsController.list);
router.get('/:id', validateRequest(idParamSchema, 'params'), materialsController.getById);

router.use(restrictTo('faculty', 'admin'));
router.post('/bulk-upload', upload.single('file'), materialsController.bulkUpload);
router.post('/', validateRequest(materialSchemas.create), materialsController.create);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(materialSchemas.update), materialsController.update);

router.delete('/clear-all', restrictTo('admin'), materialsController.removeAll);
router.delete('/:id', restrictTo('faculty', 'admin'), validateRequest(idParamSchema, 'params'), materialsController.remove);

module.exports = router;
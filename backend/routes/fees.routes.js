const express = require('express');
const feesController = require('../controllers/fee.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const filterSelf = require('../middleware/filterSelf');
const { idParamSchema, feeSchemas } = require('../validators');

const multer = require('multer');
const upload = multer({ dest: 'tmp/' });

const router = express.Router();

router.use(protect, restrictTo('student', 'faculty', 'admin'));

router.get('/', filterSelf('student'), validateRequest(feeSchemas.list, 'query'), feesController.list);
router.get('/:id', validateRequest(idParamSchema, 'params'), feesController.getById);

router.use(restrictTo('admin'));
router.post('/bulk-upload', upload.single('file'), feesController.bulkUpload);
router.post('/', validateRequest(feeSchemas.create), feesController.create);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(feeSchemas.update), feesController.update);
router.delete('/clear-all', feesController.removeAll);
router.delete('/:id', validateRequest(idParamSchema, 'params'), feesController.remove);

module.exports = router;
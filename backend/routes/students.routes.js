const express = require('express');
const studentsController = require('../controllers/student.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { idParamSchema, studentSchemas } = require('../validators');
const multer = require('multer');
const upload = multer({ 
  dest: 'tmp/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are allowed'), false);
    }
  }
});

const router = express.Router();

router.use(protect, restrictTo('student', 'faculty', 'admin'));

router.get('/', validateRequest(studentSchemas.list, 'query'), studentsController.list);
router.get('/:id', validateRequest(idParamSchema, 'params'), studentsController.getById);

router.use(restrictTo('admin'));
router.post('/bulk-upload', upload.single('file'), studentsController.bulkUpload);
router.post('/', validateRequest(studentSchemas.create), studentsController.create);
router.delete('/clear-all', studentsController.removeAll);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(studentSchemas.update), studentsController.update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), studentsController.remove);

module.exports = router;
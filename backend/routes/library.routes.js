const express = require('express');
const libraryController = require('../controllers/library.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const filterSelf = require('../middleware/filterSelf');
const { idParamSchema, bookSchemas } = require('../validators');

const multer = require('multer');
const upload = multer({ dest: 'tmp/' });

const router = express.Router();

router.use(protect, restrictTo('student', 'faculty', 'admin'));

router.get('/books', validateRequest(bookSchemas.list, 'query'), libraryController.listBooks);
router.get('/books/:id', validateRequest(idParamSchema, 'params'), libraryController.getBookById);

router.get('/issues', filterSelf('student'), validateRequest(bookSchemas.issueList, 'query'), libraryController.listIssues);
router.get('/issues/:id', validateRequest(idParamSchema, 'params'), libraryController.getIssueById);

router.use(restrictTo('admin'));
router.post('/books/bulk-upload', upload.single('file'), libraryController.bulkUploadBooks);
router.post('/books', validateRequest(bookSchemas.create), libraryController.createBook);
router.put('/books/:id', validateRequest(idParamSchema, 'params'), validateRequest(bookSchemas.update), libraryController.updateBook);
router.delete('/books/clear-all', libraryController.removeAllBooks);
router.delete('/books/:id', validateRequest(idParamSchema, 'params'), libraryController.removeBook);

router.post('/issue', validateRequest(bookSchemas.issue), libraryController.issueBook);
router.post('/return', validateRequest(bookSchemas.return), libraryController.returnBook);
router.delete('/issues/:id', validateRequest(idParamSchema, 'params'), libraryController.removeIssue);

module.exports = router;
const express = require('express');
const usersController = require('../controllers/user.controller');
const validateRequest = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { idParamSchema, userSchemas } = require('../validators');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/', validateRequest(userSchemas.list, 'query'), usersController.list);
router.post('/', validateRequest(userSchemas.create), usersController.create);
router.get('/:id', validateRequest(idParamSchema, 'params'), usersController.getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(userSchemas.update), usersController.update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), usersController.remove);

module.exports = router;
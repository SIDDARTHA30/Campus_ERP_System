const createCrudController = require('./base.controller');
const userService = require('../services/user.service');

module.exports = createCrudController(userService, {
  entityLabel: 'User',
  listLabel: 'Users'
});
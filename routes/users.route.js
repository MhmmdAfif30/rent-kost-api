const express = require('express');
const UsersController = require('../controllers/users.controller');
const verifyToken = require('../middleware/verifyToken');
const verifyAccess = require('../middleware/verifyAccess');

const router = express.Router();

router.route('/')
  .get(verifyToken.verifyAccessToken, UsersController.getAll)
  .post(verifyToken.verifyAccessToken, verifyAccess(), UsersController.create);

router.route('/:id')
  .get(verifyToken.verifyAccessToken, UsersController.getById)
  .put(verifyToken.verifyAccessToken, verifyAccess(), UsersController.update)
  .delete(verifyToken.verifyAccessToken, verifyAccess(), UsersController.delete);

router.route('/:id/approve')
  .put(verifyToken.verifyAccessToken, verifyAccess(), UsersController.approve);

router.route('/:id/reject')
  .put(verifyToken.verifyAccessToken, verifyAccess(), UsersController.reject);

module.exports = router;

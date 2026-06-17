const express = require('express');
const KostController = require('../controllers/kost.controller');
const verifyToken = require('../middleware/verifyToken');
const verifyAccess = require('../middleware/verifyAccess');

const router = express.Router();

router.route('/')
  .get(verifyToken.verifyAccessToken, KostController.getAll)
  .post(verifyToken.verifyAccessToken, verifyAccess(), KostController.create);

router.route('/:id')
  .get(verifyToken.verifyAccessToken, KostController.getById)
  .put(verifyToken.verifyAccessToken, verifyAccess(), KostController.update)
  .delete(verifyToken.verifyAccessToken, verifyAccess(), KostController.delete);

module.exports = router;
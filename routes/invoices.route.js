const express = require('express');
const InvoicesController = require('../controllers/invoices.controller');
const verifyToken = require('../middleware/verifyToken');
const verifyAccess = require('../middleware/verifyAccess');

const router = express.Router();

router.route('/')
  .get(verifyToken.verifyAccessToken, InvoicesController.getAll)
  .post(verifyToken.verifyAccessToken, verifyAccess(), InvoicesController.create);

router.route('/:id')
  .get(verifyToken.verifyAccessToken, InvoicesController.getById)
  .put(verifyToken.verifyAccessToken, verifyAccess(), InvoicesController.update)
  .delete(verifyToken.verifyAccessToken, verifyAccess(), InvoicesController.delete);

module.exports = router;
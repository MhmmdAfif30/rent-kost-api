const express = require('express');
const PaymentsController = require('../controllers/payments.controller');
const verifyToken = require('../middleware/verifyToken');
const verifyAccess = require('../middleware/verifyAccess');

const router = express.Router();

router.route('/')
    .get(verifyToken.verifyAccessToken, PaymentsController.getAll)
    .post(verifyToken.verifyAccessToken, verifyAccess(), PaymentsController.create);

router.route('/:id')
    .get(verifyToken.verifyAccessToken, PaymentsController.getById)
    .put(verifyToken.verifyAccessToken, verifyAccess(), PaymentsController.update)
    .delete(verifyToken.verifyAccessToken, verifyAccess(), PaymentsController.delete);

router.route('/:id/approve')
    .put(verifyToken.verifyAccessToken, verifyAccess(), PaymentsController.approve);

router.route('/:id/reject')
    .put(verifyToken.verifyAccessToken, verifyAccess(), PaymentsController.reject);

router.route('/status/:orderId')
    .get(verifyToken.verifyAccessToken, PaymentsController.getTransactionStatus);

router.route('/sync/:orderId')
    .post(verifyToken.verifyAccessToken, PaymentsController.syncPaymentStatus);



module.exports = router;

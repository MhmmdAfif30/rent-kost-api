const PaymentsService = require('../services/payments.service');
const { setResponse } = require('../helpers/utils');

class MidtransController {
    static async handleNotification(req, res) {
        try {
            const notificationData = req.body;
            
            const result = await PaymentsService.handleMidtransNotification(notificationData);
            
            return res.status(200).json(setResponse(result, 'Notification processed successfully'));
        } catch (error) {
            console.error('Midtrans Webhook Error:', error);
            return res.status(500).json(setResponse([], error.message, 500));
        }
    }

    static async getTransactionStatus(req, res) {
        try {
            const { orderId } = req.params;
            
            const status = await PaymentsService.getMidtransTransactionStatus(orderId);
            
            return res.status(200).json(setResponse(status, 'Transaction status retrieved'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(setResponse([], error.message, error.statusCode || 500));
        }
    }
}

module.exports = MidtransController;
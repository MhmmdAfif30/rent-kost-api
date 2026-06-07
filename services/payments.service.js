const {
    getAllPaymentsDb,
    getPaymentsByIdDb,
    insertPaymentsDb,
    updatePaymentsDb,
    deletePaymentsDb,
    approvePaymentsDb,
    rejectPaymentsDb,
    getPaymentsByOrderIdDb,
    updatePaymentStatusDb
} = require('../db/payments.db');

const { ErrorHandler } = require('../helpers/error');
const midtransHelper = require('../helpers/midtrans');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const timeZone = 'Asia/Jakarta';

dayjs.extend(utc);
dayjs.extend(timezone);



class PaymentsService {
    static async getAllPayments(param) {
        try {
            const results = await getAllPaymentsDb(param);
            return results;
        } catch (error) {
            throw new ErrorHandler(error.statusCode || 500, error.message);
        }
    }

    static async getPaymentsById(id) {
        try {
            const result = await getPaymentsByIdDb(id);
            if (!result) {
                throw new ErrorHandler(404, 'Payments not found');
            }
            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode || 500, error.message);
        }
    }

    static async createPayments(data) {
        try {
            if (!data || typeof data !== 'object') {
                data = {};
            }

            if (!data.order_id || !data.gross_amount) {
                throw new ErrorHandler(400, 'order_id and gross_amount are required for Midtrans');
            }

            const grossAmount = parseFloat(data.gross_amount);
            if (isNaN(grossAmount) || grossAmount <= 0) {
                throw new ErrorHandler(400, 'gross_amount must be a valid positive number');
            }

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            // Format dengan timezone +0700 (WIB)
            const formattedStartTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0700`;

            // Siapkan parameter Midtrans dengan expiry yang benar
            const midtransParams = {
                transaction_details: {
                    order_id: data.order_id,
                    gross_amount: grossAmount
                },
                customer_details: data.customer_details || {
                    first_name: data.customer_name || 'Customer',
                    email: data.customer_email || 'customer@example.com',
                    phone: data.customer_phone || '08123456789'
                },
                item_details: data.item_details || [{
                    id: "ITEM001",
                    name: "Payment Item",
                    price: grossAmount,
                    quantity: 1
                }],
                expiry: {
                    start_time: formattedStartTime,  // Format yang benar
                    unit: 'hours',
                    duration: 24
                }
            };

            const midtransTransaction = await midtransHelper.createTransactionWithRetry(midtransParams, 2);


            const midtransTransactionId = midtransTransaction.transaction_id
                || midtransTransaction.transactionId
                || midtransTransaction.order_id
                || `TRX_${data.order_id}_${Date.now()}`;

            if (!midtransTransactionId) {
                throw new ErrorHandler(500, 'Failed to get transaction ID from Midtrans');
            }

            const dataToSave = {
                invoices_id: data.invoices_id,
                type_payment: data.type_payment || 'midtrans',
                photo: data.photo || null,
                is_approve: 0,
                is_active: 1,
                approve_by: 0,
                order_id: data.order_id,
                gross_amount: grossAmount,
                midtrans_token: midtransTransaction.token,
                midtrans_redirect_url: midtransTransaction.redirect_url,
                payment_status: 'pending',
                midtrans_transaction_id: midtransTransactionId
            };

            const result = await insertPaymentsDb(dataToSave);

            return {
                db_result: dataToSave,
                midtrans: {
                    token: midtransTransaction.token,
                    redirect_url: midtransTransaction.redirect_url,
                    transaction_id: midtransTransaction.transaction_id
                }
            };

        } catch (error) {
            console.error('Midtrans Error Details:', error);

            if (error.message && error.message.includes('timeout')) {
                throw new ErrorHandler(504, 'Payment gateway timeout. Silahkan coba lagi.');
            }
            if (error.code === 'ENOTFOUND') {
                throw new ErrorHandler(503, 'Koneksi ke payment gateway gagal. Periksa koneksi internet Anda.');
            }
            if (error.response?.status === 400) {
                const errorMsg = error.response.data?.error_messages?.join(', ') || 'Invalid payment request';
                throw new ErrorHandler(400, errorMsg);
            }

            throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to create payment');
        }
    }

    static async updatePayments(id, data) {
        try {
            const dataExist = await getPaymentsByIdDb(id);
            if (!dataExist) {
                throw new ErrorHandler(404, 'Payments not found');
            }
            const result = await updatePaymentsDb(id, data);
            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode || 500, error.message);
        }
    }

    static async handleMidtransNotification(notificationData) {
        try {
            if (!notificationData || !notificationData.order_id) {
                throw new ErrorHandler(400, 'Invalid notification data');
            }

            const statusResponse = await midtransHelper.handleNotification(notificationData);
            const orderId = statusResponse.order_id;
            const transactionStatus = statusResponse.transaction_status;
            const fraudStatus = statusResponse.fraud_status;

            const payment = await getPaymentsByOrderIdDb(orderId);
            if (!payment) {
                throw new ErrorHandler(404, 'Payment not found for order: ' + orderId);
            }

            let paymentStatus = 'pending';
            switch (transactionStatus) {
                case 'capture':
                    paymentStatus = fraudStatus === 'accept' ? 'success' : 'pending';
                    break;
                case 'settlement':
                    paymentStatus = 'success';
                    break;
                case 'deny':
                case 'cancel':
                case 'expire':

                    paymentStatus = 'failed';
                    break;
                default:
                    paymentStatus = 'pending';
            }

            const updateData = {
                payment_status: paymentStatus,
                midtrans_response: statusResponse
            };

            if (paymentStatus === 'success') {
                updateData.payment_date = formattedStartTime
            }

            await updatePaymentStatusDb(orderId, updateData);

            return { orderId, paymentStatus, transactionStatus, fraudStatus };
        } catch (error) {
            console.error('Midtrans Notification Error:', error);
            throw new ErrorHandler(error.statusCode || 500, error.message);
        }
    }

    static async getMidtransTransactionStatus(orderId) {
        try {
            if (!orderId) {
                throw new ErrorHandler(400, 'Order ID is required');
            }
            const status = await midtransHelper.getTransactionStatus(orderId);
            return status;
        } catch (error) {
            throw new ErrorHandler(error.statusCode || 500, error.message);
        }
    }

   static async approvePayments(paymentsId, approverId) {
    try {
        if (!paymentsId) {
            throw new ErrorHandler(400, 'Payments ID is required');
        }
        
        // if (!approverId) {  // Add this validation
        //     throw new ErrorHandler(400, 'Approver ID is required');
        // }

        const existingPayments = await getPaymentsByIdDb(paymentsId);
        if (!existingPayments) {
            throw new ErrorHandler(404, 'Payments not found');
        }

        if (existingPayments.is_approve === 2) {
            throw new ErrorHandler(400, 'Payments is already approved');
        }

        if (existingPayments.is_approve === 1) {
            throw new ErrorHandler(400, 'Payments is already rejected');
        }

        const updatedPayment = await approvePaymentsDb(paymentsId, approverId);
        return updatedPayment;
    } catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
}

    static async rejectPayments(paymentsId, approverId) {
        try {
            if (!paymentsId) {
                throw new ErrorHandler(400, 'Payments ID is required');
            }

            const existingPayments = await getPaymentsByIdDb(paymentsId);
            if (!existingPayments) {
                throw new ErrorHandler(404, 'Payments not found');
            }

            if (existingPayments.is_approve === 2) {
                throw new ErrorHandler(400, 'Payments is already approved');
            }

            if (existingPayments.is_approve === 0) {
                throw new ErrorHandler(400, 'Payments is already rejected');
            }

            const updatedPayment = await rejectPaymentsDb(paymentsId, approverId);
            return updatedPayment;
        } catch (error) {
            throw new ErrorHandler(error.statusCode || 500, error.message);
        }
    }

    static async deletePayments(id, userId) {
        try {
            const dataExist = await getPaymentsByIdDb(id);
            if (!dataExist) {
                throw new ErrorHandler(404, 'Payments not found');
            }
            const result = await deletePaymentsDb(id, userId);
            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode || 500, error.message);
        }
    }
}

module.exports = PaymentsService;
const ExcelJS = require("exceljs");
const path = require("path");

const PaymentsService = require("../services/payments.service");

const ImageKit = require("imagekit");
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const { getInvoicesByIdDb } = require("../db/invoices.db");

const {
    setResponse,
    setResponsePaging,
    checkValidate,
} = require("../helpers/utils");

const {
    insertPaymentsSchema,
    updatePaymentsSchema,
} = require("../validate/payments.schema");

class PaymentsController {
    static async getAll(req, res) {
        try {
            const queryParams = req.query;
            const results = await PaymentsService.getAllPayments(queryParams);
            const response = await setResponsePaging(
                queryParams,
                results,
                "Payments found"
            );
            res.status(response.statusCode).json(response);
        } catch (error) {
            res.status(error.statusCode || 500).json(setResponse([], error.message, error.statusCode || 500));
        }
    }

    // Get payments by ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const results = await PaymentsService.getPaymentsById(id);
            const response = await setResponse(results, "Payments found");
            res.status(response.statusCode).json(response);
        } catch (error) {
            res.status(error.statusCode || 500).json(setResponse([], error.message, error.statusCode || 500));
        }
    }

    // Create payments with Midtrans
static async create(req, res) {
    try {
        // Set timeout untuk entire request - lebih panjang
        req.setTimeout(180000, () => {
            return res.status(504).json(setResponse([], "Request timeout", 504));
        });

        const { error, value } = await checkValidate(insertPaymentsSchema, req);
        if (error) {
            return res.status(400).json(setResponse(error, "Validation failed", 400));
        }

        if (req.file) {
            try {
                const uploadTimeout = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Image upload timeout')), 15000);
                });
                const uploadPromise = imagekit.upload({
                    file: req.file.buffer,
                    fileName: req.file.originalname,
                    folder: "/payments",
                });
                const upload = await Promise.race([uploadPromise, uploadTimeout]);
                value.photo = upload.url;
            } catch (uploadError) {
                console.warn('Image upload failed, continuing without photo:', uploadError.message);
                value.photo = null;
            }
        }

        value.order_id = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const invoice = await getInvoicesByIdDb(value.invoices_id);
        if (!invoice) {
            return res.status(404).json(setResponse([], "Invoice not found", 404));
        }

        value.gross_amount = invoice.total
        
        if (!value.gross_amount || value.gross_amount <= 0) {
        }

        value.customer_details = {
            first_name: invoice.customer_name,
            email: invoice.customer_email,
            phone: invoice.contact_phone
        };
        
        const startTime = Date.now();
        const results = await PaymentsService.createPayments(value);
        const duration = Date.now() - startTime;

        return res.status(201).json(setResponse({
            payment: results.db_result,
            midtrans: {
                token: results.midtrans.token,
                redirect_url: results.midtrans.redirect_url
            },
            processing_time_ms: duration
        }, "Payments created successfully. Redirect to payment page."));
        
    } catch (err) {
        console.error('Create payment error:', err);
        
        if (err.message && err.message.includes('timeout')) {
            return res.status(504).json(setResponse([], 
                "Payment gateway sedang sibuk. Silahkan coba lagi dalam beberapa saat.", 504));
        }
        
        if (err.message && err.message.includes('ECONNREFUSED')) {
            return res.status(503).json(setResponse([], 
                "Tidak dapat terhubung ke payment gateway. Periksa koneksi internet Anda.", 503));
        }
        
        return res.status(err.statusCode || 500).json(setResponse([], 
            err.message || "Gagal membuat payment. Silahkan coba lagi.", 
            err.statusCode || 500));
    }
}

    // Update payments
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { error, value } = await checkValidate(updatePaymentsSchema, req);
            
            if (error) {
                return res.status(400).json(setResponse(error, "Validation failed", 400));
            }

            if (req.file) {
                const upload = await imagekit.upload({
                    file: req.file.buffer,
                    fileName: req.file.originalname,
                    folder: "/payments",
                });
                value.photo = upload.url;
            }

            value.userId = req.user.users_id;

            const results = await PaymentsService.updatePayments(id, value);
            return res.status(200).json(setResponse(results, "Payments updated successfully"));
            
        } catch (err) {
            return res.status(err.statusCode || 500).json(setResponse([], err.message, err.statusCode || 500));
        }
    }

    static async handleNotification(req, res) {
        try {
            const result = await PaymentsService.handleMidtransNotification(req.body);
            return res.status(200).json(setResponse(result, 'Notification processed successfully'));
        } catch (error) {
            console.error('Notification error:', error);
            return res.status(error.statusCode || 500).json(setResponse([], error.message, error.statusCode || 500));
        }
    }

    // Get transaction status from Midtrans
    static async getTransactionStatus(req, res) {
        try {
            const { orderId } = req.params;
            const result = await PaymentsService.getMidtransTransactionStatus(orderId);
            return res.status(200).json(setResponse(result, 'Transaction status retrieved'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(setResponse([], error.message, error.statusCode || 500));
        }
    }

  static async syncPaymentStatus(req, res) {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id || null; // Ambil dari auth middleware
        const result = await PaymentsService.syncPaymentStatusFromMidtrans(orderId, userId);
        return res.status(200).json(setResponse(result, 'Payment status synced with Midtrans'));
    } catch (error) {
        return res.status(error.statusCode || 500).json(setResponse([], error.message, error.statusCode || 500));
    }
}

    // Export payments to Excel
    static async exportExcel(req, res) {
        try {
            const queryParams = { ...req.query, limit: null };
            const results = await PaymentsService.getAllPayments(queryParams);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Payments Data");

            worksheet.columns = [
                { header: "Payments ID", key: "payments_id", width: 30 },
                { header: "Invoices ID", key: "invoices_id", width: 20 },
                { header: "Type Payments", key: "type_payment", width: 15 },
                { header: "Payment Status", key: "payment_status", width: 20 },
                { header: "Gross Amount", key: "gross_amount", width: 15 },
                { header: "Order ID", key: "order_id", width: 30 },
                { header: "Foto", key: "photo", width: 20 },
            ];

            worksheet.addRows(results.data || []);

            // Style header row
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = { horizontal: "center" };
            });

            const buffer = await workbook.xlsx.writeBuffer();

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=payments_data.xlsx");
            return res.send(buffer);
            
        } catch (error) {
            console.error('Export error:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    // Delete payments
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const results = await PaymentsService.deletePayments(id, req.user.users_id);
            const response = await setResponse(results, "Payments deleted successfully");
            res.status(response.statusCode).json(response);
        } catch (error) {
            res.status(error.statusCode || 500).json(setResponse([], error.message, error.statusCode || 500));
        }
    }

    // Approve payment
    static async approve(req, res) {
        try {
            const { id } = req.params;
            const approverId = req.user.users_id;
            
            const updatedPayment = await PaymentsService.approvePayments(id, approverId);
            const response = await setResponse(updatedPayment, 'Payments approved successfully');
            
            return res.status(response.statusCode).json(response);
        } catch (error) {
            return res.status(error.statusCode || 500).json(setResponse([], error.message, error.statusCode || 500));
        }
    }

    // Reject payments
    static async reject(req, res) {
        try {
            const { id } = req.params;
            const approverId = req.user.users_id;
            
            const updatedPayment = await PaymentsService.rejectPayments(id, approverId);
            const response = await setResponse(updatedPayment, 'Payments rejected successfully');
            
            return res.status(response.statusCode).json(response);
        } catch (error) {
            return res.status(error.statusCode || 500).json(setResponse([], error.message, error.statusCode || 500));
        }
    }
}

module.exports = PaymentsController;
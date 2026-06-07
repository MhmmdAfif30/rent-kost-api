const {
    getAllInvoicesDb,
    getInvoicesByIdDb,
    createInvoicesDb,
    updateInvoicesDb,
    deleteInvoicesDb
} = require('../db/invoices.db');
const { ErrorHandler } = require('../helpers/error');

class PaymentsService {
    // Get all Invoices
    static async getAllInvoices(param) {
        try {
            const results = await getAllInvoicesDb(param);

            results.data.map(element => {
            });

            return results
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Get Invoices by ID
    static async getInvoicesById(id) {
        try {
            const result = await getInvoicesByIdDb(id);

            if (result.length < 1) throw new ErrorHandler(404, 'Invoices not found');

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Create Invoices
    static async createInvoices(data) {
        try {
            if (!data || typeof data !== 'object') data = {};

            const result = await createInvoicesDb(data);

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Update Invoices
    static async updateInvoices(id, data) {
        try {
            if (!data || typeof data !== 'object') data = {};

            const dataExist = await getInvoicesByIdDb(id);

            if (dataExist.length < 1) {
                throw new ErrorHandler(404, 'Invoices not found');
            }

            const result = await updateInvoicesDb(id, data);

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Soft delete Invoices
    static async deleteInvoices(id, userId) {
        try {
            const dataExist = await getInvoicesByIdDb(id);

            if (dataExist.length < 1) {
                throw new ErrorHandler(404, 'Invoices not found');
            }

            const result = await deleteInvoicesDb(id, userId);

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }
}

module.exports = PaymentsService;

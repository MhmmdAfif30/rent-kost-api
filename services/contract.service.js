const {
    getAllContractsDb,
    getContractsByIdDb,
    createContractsDb,
    updateContractsDb,
    deleteContractsDb
} = require('../db/contracts.db');
const { ErrorHandler } = require('../helpers/error');

class PaymentsService {
    // Get all Contracts
    static async getAllContracts(param) {
        try {
            const results = await getAllContractsDb(param);

            results.data.map(element => {
            });

            return results
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Get Contracts by ID
    static async getContractsById(id) {
        try {
            const result = await getContractsByIdDb(id);

            if (result.length < 1) throw new ErrorHandler(404, 'Contracts not found');

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Create Contracts
    static async createContracts(data) {
        try {
            if (!data || typeof data !== 'object') data = {};

            const result = await createContractsDb(data);

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Update Contracts
    static async updateContracts(id, data) {
        try {
            if (!data || typeof data !== 'object') data = {};

            const dataExist = await getContractsByIdDb(id);

            if (dataExist.length < 1) {
                throw new ErrorHandler(404, 'Contracts not found');
            }

            const result = await updateContractsDb(id, data);

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Soft delete Contracts
    static async deleteContracts(id, userId) {
        try {
            const dataExist = await getContractsByIdDb(id);

            if (dataExist.length < 1) {
                throw new ErrorHandler(404, 'Contracts not found');
            }

            const result = await deleteContractsDb(id, userId);

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }
}

module.exports = PaymentsService;

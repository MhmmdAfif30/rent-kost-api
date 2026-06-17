const {
    getAllKostDb,
    getKostByIdDb,
    createKostDb,
    updateKostDb,
    deleteKostDb
} = require('../db/kost.db');
const { ErrorHandler } = require('../helpers/error');

class KostService {
    // Get all Contracts
    static async getAllKost(param) {
        try {
            const results = await getAllKostDb(param);

            results.data.map(element => {
            });

            return results
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Get Kost by ID
    static async getKostById(id) {
        try {
            const result = await getKostByIdDb(id);

            if (result.length < 1) throw new ErrorHandler(404, 'Kost not found');

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Create Kost
    static async createKost(data) {
        try {
            if (!data || typeof data !== 'object') data = {};

            const result = await createKostDb(data);

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Update Kost
    static async updateKost(id, data) {
        try {
            if (!data || typeof data !== 'object') data = {};

            const dataExist = await getKostByIdDb(id);

            if (dataExist.length < 1) {
                throw new ErrorHandler(404, 'Kost not found');
            }

            const result = await updateKostDb(id, data);

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Soft delete Kost
    static async deleteKost(id, userId) {
        try {
            const dataExist = await getKostByIdDb(id);

            if (dataExist.length < 1) {
                throw new ErrorHandler(404, 'Kost not found');
            }

            const result = await deleteKostDb(id, userId);

            return result;
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }
}

module.exports = KostService;

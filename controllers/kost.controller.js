const KostService = require("../services/kost.service");
const { setResponse, setResponsePaging, checkValidate } = require("../helpers/utils");
const { InsertKostSchema, updateKostSchema } = require("../validate/kost.schema");

class KostController {

    // Get all users
    static async getAll(req, res) {
        const queryParams = req.query;

        const results = await KostService.getAllKost(queryParams);
        const response = await setResponsePaging(queryParams, results, 'Kost found');

        res.status(response.statusCode).json(response);
    }

    // Get user by ID
    static async getById(req, res) {
        const { id } = req.params;

        const results = await KostService.getKostById(id);
        const response = await setResponse(results, 'Kost found');

        res.status(response.statusCode).json(response);
    }

    // Create user
    static async create(req, res) {
        const { error, value } = await checkValidate(InsertKostSchema, req);

        if (error) {
            return res.status(400).json(setResponse(error, 'Validation failed', 400));
        }

        value.approved_by = req.users.users_id;

        const results = await KostService.createKost(value);
        const response = await setResponse(results, 'Kost created successfully');

        res.status(response.statusCode).json(response);
    }

    // Update user
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = await checkValidate(updateKostSchema, req);

        if (error) {
            return res.status(400).json(setResponse(error, 'Validation failed', 400));
        }

        value.userId = req.user.users_id;

        const results = await KostService.updateKost(id, value);
        const response = await setResponse(results, 'Kost updated successfully');

        res.status(response.statusCode).json(response);
    }

    //   // Approve user
    //   static async approve(req, res) {
    //     const { id } = req.params;
    //     const approverId = req.users.users_id;

    //     const updatedUser = await KostService.approveUser(id, approverId);
    //     const response = await setResponse(updatedUser, 'Users approved successfully');

    //     return res.status(response.statusCode).json(response);
    //   }

    // Reject user
    //   static async reject(req, res) {
    //     const { id } = req.params;
    //     const approverId = req.users.users_id;

    //     const updatedUser = await KostService.rejectUser(id, approverId);
    //     const response = await setResponse(updatedUser, 'Users rejected successfully');

    //     return res.status(response.statusCode).json(response);
    //   }

    //Delete user
    static async delete(req, res) {
        const { id } = req.params;

        const results = await KostService.deleteKost(id, req.users.users_id);
        const response = await setResponse(results, 'Kost deleted successfully');

        res.status(response.statusCode).json(response);
    }

    // Change password

    // static async changePassword(req, res) {
    //   const { id } = req.params;
    //   const { error, value } = await checkValidate(newPasswordSchema, req);

    //   if (error) {
    //     return res.status(400).json(setResponse(error, 'Validation failed', 400));
    //   }

    //   const results = await KostService.changeUserPassword(id, value.new_password);
    //   const response = await setResponse(results, 'Password changed successfully');

    //   res.status(response.statusCode).json(response);
    // }

}

module.exports = KostController;

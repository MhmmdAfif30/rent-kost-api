const InvoicesService = require("../services/invoices.service");
const { setResponse, setResponsePaging, checkValidate } = require("../helpers/utils");
const {newInvoicesSchema, updateInvoicesSchema } = require("../validate/users.schema");

class InvoicesController {

  // Get all users
  static async getAll(req, res) {
    const queryParams = req.query;

    const results = await InvoicesService.getAllUsers(queryParams);
    const response = await setResponsePaging(queryParams, results, 'Users found');

    res.status(response.statusCode).json(response);
  }

  // Get user by ID
  static async getById(req, res) {
    const { id } = req.params;

    const results = await InvoicesService.getUserById(id);
    const response = await setResponse(results, 'Users found');

    res.status(response.statusCode).json(response);
  }

  // Create user
  static async create(req, res) {
    const { error, value } = await checkValidate(newInvoicesSchema, req);

    if (error) {
      return res.status(400).json(setResponse(error, 'Validation failed', 400));
    }

    const results = await InvoicesService.createInvoices(value);
    const response = await setResponse(results, 'Invoices created successfully');

    res.status(response.statusCode).json(response);
  }

  // Update user
  static async update(req, res) {
    const { id } = req.params;

    const { error, value } = await checkValidate(updateInvoicesSchema, req);

    if (error) {
      return res.status(400).json(setResponse(error, 'Validation failed', 400));
    }

    value.userId = req.user.users_id;

    const results = await InvoicesService.updateInvoices(id, value);
    const response = await setResponse(results, 'Users updated successfully');

    res.status(response.statusCode).json(response);
  }


  //Delete invoices
  static async delete(req, res) {
    const { id } = req.params;

    const results = await InvoicesService.deleteInvoices(id, req.users.users_id);
    const response = await setResponse(results, 'Users deleted successfully');

    res.status(response.statusCode).json(response);
  }

}

module.exports = InvoicesController;

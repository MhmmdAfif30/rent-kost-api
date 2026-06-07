const UsersService = require("../services/users.service");
const { setResponse, setResponsePaging, checkValidate } = require("../helpers/utils");
const { usersSchema, updateUsersSchema } = require("../validate/users.schema");

class UsersController {

  // Get all users
  static async getAll(req, res) {
    const queryParams = req.query;

    const results = await UsersService.getAllUsers(queryParams);
    const response = await setResponsePaging(queryParams, results, 'Users found');

    res.status(response.statusCode).json(response);
  }

  // Get user by ID
  static async getById(req, res) {
    const { id } = req.params;

    const results = await UsersService.getUserById(id);
    const response = await setResponse(results, 'Users found');

    res.status(response.statusCode).json(response);
  }

  // Create user
  static async create(req, res) {
    const { error, value } = await checkValidate(usersSchema, req);

    if (error) {
      return res.status(400).json(setResponse(error, 'Validation failed', 400));
    }

    value.approved_by = req.users.users_id;

    const results = await UsersService.createUser(value);
    const response = await setResponse(results, 'Users created successfully');

    res.status(response.statusCode).json(response);
  }

  // Update user
  static async update(req, res) {
    const { id } = req.params;

    const { error, value } = await checkValidate(updateUsersSchema, req);

    if (error) {
      return res.status(400).json(setResponse(error, 'Validation failed', 400));
    }

    value.userId = req.user.users_id;

    const results = await UsersService.updateUser(id, value);
    const response = await setResponse(results, 'Users updated successfully');

    res.status(response.statusCode).json(response);
  }

  // Approve user
  static async approve(req, res) {
    const { id } = req.params;
    const approverId = req.users.users_id;

    const updatedUser = await UsersService.approveUser(id, approverId);
    const response = await setResponse(updatedUser, 'Users approved successfully');

    return res.status(response.statusCode).json(response);
  }

  // Reject user
  static async reject(req, res) {
    const { id } = req.params;
    const approverId = req.users.users_id;

    const updatedUser = await UsersService.rejectUser(id, approverId);
    const response = await setResponse(updatedUser, 'Users rejected successfully');

    return res.status(response.statusCode).json(response);
  }

  //Delete user
  static async delete(req, res) {
    const { id } = req.params;

    const results = await UsersService.deleteUser(id, req.users.users_id);
    const response = await setResponse(results, 'Users deleted successfully');

    res.status(response.statusCode).json(response);
  }

  // Change password
  
  // static async changePassword(req, res) {
  //   const { id } = req.params;
  //   const { error, value } = await checkValidate(newPasswordSchema, req);

  //   if (error) {
  //     return res.status(400).json(setResponse(error, 'Validation failed', 400));
  //   }

  //   const results = await UsersService.changeUserPassword(id, value.new_password);
  //   const response = await setResponse(results, 'Password changed successfully');

  //   res.status(response.statusCode).json(response);
  // }

}

module.exports = UsersController;

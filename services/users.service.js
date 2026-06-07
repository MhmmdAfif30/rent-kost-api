const {
  getAllUsersDb,
  getUserByIdDb,
  getUserByUserEmailDb,
  getUserByUsernameDb,
  createUserDb,
  updateUserDb,
  approveUserDb,
  rejectUserDb,
  deleteUserDb,
} = require('../db/users.db');
const { hashPassword } = require('../helpers/hashPassword');
const { ErrorHandler } = require('../helpers/error');

class UserService {

  // Get all users
  static async getAllUsers(param) {
    try {
      const results = await getAllUsersDb(param);
      return results;
    } catch (error) {
      throw new ErrorHandler(error.statusCode, error.message);
    }
  }

  // Get user by ID
  static async getUserById(id) {
    try {
      const result = await getUserByIdDb(id);

      if (!result) throw new ErrorHandler(404, 'User not found');

      return result;
    } catch (error) {
      throw new ErrorHandler(error.statusCode, error.message);
    }
  }

  // Create user
  static async createUser(data) {
    try {
      if (!data || typeof data !== 'object') data = {};

      const creatorId = data.userId || null;

      // cek duplikasi username & email
      const [existingUsername, existingEmail] = await Promise.all([
        getUserByUsernameDb(data.username),
        getUserByUserEmailDb(data.email)
      ]);

      if (existingUsername) throw new ErrorHandler(400, 'Username is already taken');
      if (existingEmail) throw new ErrorHandler(400, 'Email is already taken');

      // hash password
      const hashedPassword = await hashPassword(data.user_password);

      // siapkan data untuk insert
      const userData = {
        ...data,
        user_password: hashedPassword,
        is_approve: 2,
        approved_by: creatorId,
        is_sa: 0,
        is_active: 1
      };

      delete userData.userId;

      const result = await createUserDb(userData);
      return result;
    } catch (error) {
      throw new ErrorHandler(error.statusCode || 500, error.message);
    }
  }

  // Update user
  static async updateUser(id, data) {
    try {
      if (!data || typeof data !== 'object') data = {};

      const existingEmail = await getUserByUserEmailDb(data.email);
      const existingUsername = await getUserByUsernameDb(data.username);

      if (existingUsername) {
        throw new ErrorHandler(400, 'Username is already taken');
      }
      if (existingEmail) {
        throw new ErrorHandler(400, 'Email is already taken')
      }

      const userExist = await getUserByIdDb(id);
      if (!userExist) throw new ErrorHandler(404, 'User not found');

      const result = await updateUserDb(id, data);
      return result;
    } catch (error) {
      throw new ErrorHandler(error.statusCode, error.message);
    }
  }

  // Approve user
  static async approveUser(userId, approverId) {
    try {
      if (!userId) {
        throw new ErrorHandler(400, 'User ID is required');
      }

      const existingUser = await getUserByIdDb(userId);
      if (!existingUser) {
        throw new ErrorHandler(404, 'User not found');
      }

      if (existingUser.is_approve === 2) {
        throw new ErrorHandler(400, 'User is already approved');
      }

      if (existingUser.is_approve === 0) {
        throw new ErrorHandler(400, 'User is already rejected');
      }

      const updatedUser = await approveUserDb(userId, approverId);
      return updatedUser;
    } catch (error) {
      throw new ErrorHandler(error.statusCode || 500, error.message);
    }
  }

  // Reject user
  static async rejectUser(userId, approverId) {
    try {
      if (!userId) {
        throw new ErrorHandler(400, 'User ID is required');
      }

      const existingUser = await getUserByIdDb(userId);
      if (!existingUser) {
        throw new ErrorHandler(404, 'User not found');
      }

      if (existingUser.is_approve === 2) {
        throw new ErrorHandler(400, 'User is already approved');
      }

      if (existingUser.is_approve === 0) {
        throw new ErrorHandler(400, 'User is already rejected');
      }

      const updatedUser = await rejectUserDb(userId, approverId);
      return updatedUser;
    } catch (error) {
      throw new ErrorHandler(error.statusCode || 500, error.message);
    }
  }

  // Soft delete user
  static async deleteUser(id, userId) {
    try {
      const userExist = await getUserByIdDb(id);
      if (!userExist) throw new ErrorHandler(404, 'User not found');

      const result = await deleteUserDb(id, userId);
      return result;
    } catch (error) {
      throw new ErrorHandler(error.statusCode, error.message);
    }
  }

  // Change password
  static async changeUserPassword(id, newPassword) {
    try {
      const userExist = await getUserByIdDb(id);
      if (!userExist) throw new ErrorHandler(404, 'User not found');

      const hashedPassword = await hashPassword(newPassword);
      const result = await changeUserPasswordDb(id, hashedPassword);
      return result;
    } catch (error) {
      throw new ErrorHandler(error.statusCode, error.message);
    }
  }
}

module.exports = UserService;

const { ErrorHandler } = require("../helpers/error");
const { getUserByIdDb } = require("../db/users.db");

function isPhoneNumberID(phone) {
  return /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/.test(phone);
}

const verifyAccess = (minLevel = 1, allowUnapprovedReadOnly = false) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) throw new ErrorHandler(401, "Unauthorized: User not found");

      // Super Admin bypass semua
      if (user.is_sa) return next();


      if (!isPhoneNumberID(user.user_id) && user.user_id) {
        const fullUser = await getUserByIdDb(user.user_id);
        if (!fullUser) throw new ErrorHandler(403, "Forbidden: User not found");

        if (!fullUser.is_approve) {
          if (req.method !== "GET") {
            throw new ErrorHandler(403, "Account not approved — read-only access");
          }

          if (allowUnapprovedReadOnly) return next();

          throw new ErrorHandler(403, "Account not approved");
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = verifyAccess;

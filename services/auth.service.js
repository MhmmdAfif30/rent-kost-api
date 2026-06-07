const {
    getUserByUserEmailDb,
    createUserDb,
    getUserByUsernameDb
} = require('../db/users.db');

const { hashPassword, comparePassword } = require('../helpers/hashPassword');
const { ErrorHandler } = require('../helpers/error');
const JWTService = require('../utils/jwt');
const { approve } = require('../controllers/users.controller');

class AuthService {

    // Register
    static async register(data) {

        try {

            const existingEmail = await getUserByUserEmailDb(data.email);
            const existingUsername = await getUserByUsernameDb(data.username);

            if (existingUsername) {
                throw new ErrorHandler(400, 'Username is already taken');
            }
            if (existingEmail) {
                throw new ErrorHandler(400, 'Email is already taken');
            }

            const hashedPassword = await hashPassword(data.password);

            const userId = await createUserDb({
                fullname: data.fullname,
                username: data.username,
                email: data.email,
                address: data.address,
                contact_phone: data.contact_phone,
                password: hashedPassword,
                is_sa: 0,
                is_active: 1,
                is_approve: 0,
                approve_by: 1,
                role_id: 2,
            });

            const newUser = {
                users_id: userId,
                fullname: data.fullname,
                username: data.username,
                address: data.address,
                email: data.email,
                contact_phone: data.contact_phone
            };

            return { user: newUser };
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }

    // Login
    static async login(data) {
        try {
            const { identifier, password, captcha, captchaText } = data;

            if (!captcha || captcha.toLowerCase() !== captchaText.toLowerCase()) {
                throw new ErrorHandler(400, 'Invalid captcha');
            }

            let users = null;

            if (identifier.includes('@')) {
                users = await getUserByUserEmailDb(identifier);
            } else {
                users = await getUserByUsernameDb(identifier);
            }

            if (!users) {
                throw new ErrorHandler(401, 'Invalid credentials');
            }

            const passwordMatch = await comparePassword(password, users.password);
            if (!passwordMatch) {
                throw new ErrorHandler(401, 'Invalid credentials');
            }

            if (!passwordMatch) {
                throw new ErrorHandler(401, 'Invalid credentials');
            }

            if (!users.is_active) throw new ErrorHandler(403, 'User is inactive');
            if (!users.is_approve) throw new ErrorHandler(403, 'User is not approved by admin');

            // Pembuatan payload token
            const payload = {
                users_id: users.users_id,
                fullname: users.fullname,
                username: users.username,
                email: users.email,
                contact_phone: users.contact_phone,
                role_id: users.role_id,
                role_name: users.role_name,
                is_sa: users.is_sa
            };

            const tokens = JWTService.generateTokenPair(payload);
            return { user: payload, tokens };

        } catch (error) {
            const statusCode = error.statusCode || 500;
            throw new ErrorHandler(statusCode, error.message);
        }
    }

    // Refresh Token
    static async refreshToken(refreshToken) {

        try {
            let decoded;
            try {
                decoded = JWTService.verifyRefreshToken(refreshToken);
            } catch (err) {
                if (err.message.includes('expired')) {
                    throw new ErrorHandler(401, 'Refresh token has expired');
                }
                throw new ErrorHandler(401, 'Invalid refresh token');
            }

            const payload = {
                users_id: decoded.users_id,
                fullname: decoded.fullname,
                username: decoded.username,
                email: decoded.email,
                contact_phone: decoded.contact_phone,
                role_id: decoded.role_id,
                role_name: decoded.role_name,
                is_sa: decoded.is_sa
            };

            const accessToken = JWTService.generateAccessToken(payload);

            return {
                accessToken,
                tokenType: 'Bearer',
                expiresIn: 900
            };
        } catch (error) {
            throw new ErrorHandler(error.statusCode, error.message);
        }
    }
}

module.exports = AuthService;

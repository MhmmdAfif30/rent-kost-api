const JWTService = require('../utils/jwt');
const { ErrorHandler } = require('../helpers/error');

function setUsers(req, decoded) {
    req.user = {
        userId: decoded.users_id,
        email: decoded.email,
        password: decoded.password,
        username: decoded.username,
        roleId: decoded.role_id,
    };
}

function verifyAccessToken(req, res, next) {
    try {
        let token = req.cookies?.accessToken;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer')) {
                token = authHeader.split(' ')[1];
            } else {
                token = req.query.token;
            }
        }

        if (!token) {
            throw new ErrorHandler(401, 'Access Token is required');
        }

        const decoded = JWTService.verifyToken(token);

        setUsers(req, decoded);

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new ErrorHandler(401, 'Access token expired'));
        }

        if (error.name === 'JsonWebTokenError') {
            return next(new ErrorHandler(401, 'Invalid access token'));
        }
    }
}

module.exports = {
    verifyAccessToken
};
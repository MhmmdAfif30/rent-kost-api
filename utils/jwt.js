const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const tokenSettings = {
    access: {
        expiresIn: '12h',
        type: 'access',
        secret: process.env.SECRET
    },
    refresh: {
        expiresIn: '7d',
        type: 'refresh',
        secret: process.env.REFRESH_SECRET
    }
};

function generateTokenId() {
    return crypto.randomBytes(32).toString('hex');
}

function generateToken(payload, type) {
    const settings = tokenSettings[type];
    if (!settings) throw new Error(`Invalid token type: ${type}`);

    const tokenPayload = { ...payload, type: settings.type };

    return jwt.sign(tokenPayload, settings.secret, {
        expiresIn: settings.expiresIn,
        jwtid: generateTokenId()
    });
}

function verifyTokenType(token, type) {
    const settings = tokenSettings[type];
    const decoded = jwt.verify(token, settings.secret);
    if (decoded.type !== type) throw new Error('Invalid token type');
    return decoded;
}

function generateAccessToken(payload) {
    return generateToken(payload, 'access');
}

function generateRefreshToken(payload) {
    return generateToken(payload, 'refresh');
}

function verifyToken(token) {
    return verifyTokenType(token, 'access');
}

function verifyRefreshToken(token) {
    return verifyTokenType(token, 'refresh');
}

function generateTokenPair(payload) {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
    };
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken,
    generateTokenPair,
};

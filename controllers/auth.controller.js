const AuthService = require('../services/auth.service');
const { setResponse, checkValidate } = require('../helpers/utils');
const { registerSchema, loginSchema } = require('../validate/auth.schema');
const { createCaptcha } = require('../utils/captcha');
const JWTService = require('../utils/jwt');

const CryptoJS = require('crypto-js');

class AuthController {
  
  // Register
  static async register(req, res) {
    const { error, value } = await checkValidate(registerSchema, req);

    if (error) {
      return res.status(400).json(setResponse(error, 'Validation failed', 400));
    }

    // Format Indonesia
    if (value.contact_phone && value.contact_phone.startsWith('0')) {
      value.contact_phone = '+62' || '08' + value.contact_phone.slice(1);
    }

    const results = await AuthService.register(value);

    const response = await setResponse(
      {
        user: { ...results.user, approved: false },
      },
      'User registered successfully. Waiting for admin approval.'
    );

    res.status(response.statusCode).json(response);
  }

  // Login
  static async login(req, res) {
    const { error, value } = await checkValidate(loginSchema, req);

    if (error) {
      return res.status(400).json(setResponse(error, 'Validation failed', 400));
    }

    const results = await AuthService.login(value);

    // Simpan refresh token di cookie
    res.cookie('refreshToken', results.tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const response = await setResponse(
      {
        user: { ...results.user, approved: true },
        accessToken: results.tokens.accessToken
      },
      'Login successful'
    );

    res.status(response.statusCode).json(response);
  }

  // Refresh Token
  static async refreshToken(req, res) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json(setResponse(null, 'Refresh token is required', 401));
    }

    const results = await AuthService.refreshToken(refreshToken);
    const response = await setResponse(results, 'Token refreshed successfully');

    res.status(response.statusCode).json(response);
  }

  // Logout
  static async logout(req, res) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });

    const response = await setResponse(null, 'Logged out successfully');
    res.status(response.statusCode).json(response);
  }

  // Captcha

  static async generateCaptcha(req, res) {
    const { svg, text } = createCaptcha();

    // Tampilkan captcha di header untuk dev
    res.setHeader('X-Captcha-Text', text);

    const response = await setResponse({ svg, text }, 'Captcha generated');
    res.status(response.statusCode).json(response);
  }

  static async verifyTokenRedirect(req, res) {
    const { tokenRedirect } = req.body;

    const bytes = CryptoJS.AES.decrypt(tokenRedirect, process.env.VITE_KEY_SESSION);
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    console.log("decrypted: ", decrypted);

    const userPhone = decrypted?.contact_phone
    const userName = decrypted?.username
    const idData = decrypted?.id

    const payload = {
      user_phone: userPhone,
      fullname: userName,
    };

    const tokens = JWTService.generateTokenPair(payload);

    // Simpan refresh token di cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const response = await setResponse(
      {
        accessToken: tokens.accessToken,
        idData
      },
      'Verify successful'
    );

    res.status(response.statusCode).json(response);
  }
}

module.exports = AuthController;

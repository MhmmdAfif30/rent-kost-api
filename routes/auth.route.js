const express = require('express');
const AuthController = require("../controllers/auth.controller");

const router = express.Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/generate-captcha', AuthController.generateCaptcha);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/verify-redirect', AuthController.verifyTokenRedirect);

module.exports = router;
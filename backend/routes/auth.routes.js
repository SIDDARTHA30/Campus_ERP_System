const express = require('express');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validate');
const { authSchemas } = require('../validators');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', validateRequest(authSchemas.login), authController.login);
router.get('/verify/:token', authController.verifyEmail);
router.post('/resend-verification', validateRequest(authSchemas.resendVerification), authController.resendVerification);
router.post('/forgot-password', validateRequest(authSchemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password/:token', validateRequest(authSchemas.resetPassword), authController.resetPassword);
router.post('/send-otp', validateRequest(authSchemas.sendOtp), authController.sendOTP);
router.post('/verify-otp', validateRequest(authSchemas.verifyOtp), authController.verifyOTP);

// Protected routes
router.post('/change-password', protect, authController.changePassword);

module.exports = router;
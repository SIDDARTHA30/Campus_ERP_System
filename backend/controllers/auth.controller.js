const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

module.exports = {
  login: asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    res.json(successResponse('Login successful', data));
  }),

  changePassword: asyncHandler(async (req, res) => {
    const data = await authService.changePassword(req.user.id, req.body);
    res.json(successResponse('Password updated successfully', data));
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    const data = await authService.verifyEmail(req.params.token);
    res.json(successResponse('Email verified successfully', data));
  }),

  resendVerification: asyncHandler(async (req, res) => {
    const data = await authService.resendVerification(req.body.email);
    res.json(successResponse('Verification email sent', data));
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const data = await authService.forgotPassword(req.body.email);
    res.json(successResponse('Password reset email sent', data));
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const data = await authService.resetPassword(req.params.token, req.body.newPassword);
    res.json(successResponse('Password reset successfully', data));
  }),

  sendOTP: asyncHandler(async (req, res) => {
    const data = await authService.sendOTP(req.body.email);
    res.json(successResponse('OTP sent successfully', data));
  }),

  verifyOTP: asyncHandler(async (req, res) => {
    const data = await authService.verifyOTP(req.body.email, req.body.otp);
    res.json(successResponse('OTP verified successfully', data));
  })
};
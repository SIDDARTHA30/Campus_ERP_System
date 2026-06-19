const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const AppError = require('../utils/appError');
const userService = require('./user.service');
const emailService = require('./email.service');
const User = require('../models/User');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      studentId: user.studentId,
      facultyId: user.facultyId
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn
    }
  );
}

async function login(payload) {
  const user = await userService.findRawByEmail(payload.email);

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('User account is inactive', 403);
  }

  // Prevent login if not verified (Bypass if EMAIL_VERIFICATION is disabled)
  const isEmailVerificationEnabled = process.env.EMAIL_VERIFICATION !== 'false';
  if (isEmailVerificationEnabled && !user.isVerified) {
    throw new AppError('Please verify your email address before logging in.', 401);
  }

  const isPasswordValid = await user.comparePassword(payload.password);
  
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Convert to object and remove passwordHash
  const userObj = user.toObject();
  delete userObj.passwordHash;

  // Link Student/Faculty ID if applicable
  const Student = require('../models/Student');
  const Faculty = require('../models/Faculty');
  
  if (userObj.role === 'student') {
    const student = await Student.findOne({ user: userObj._id }).select('_id');
    if (student) userObj.studentId = student._id;
  } else if (userObj.role === 'faculty') {
    const faculty = await Faculty.findOne({ user: userObj._id }).select('_id');
    if (faculty) userObj.facultyId = faculty._id;
  }

  const token = generateToken(userObj);

  return {
    user: userObj,
    token
  };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Incorrect current password', 400);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  user.mustChangePassword = false;
  user.passwordChangedAt = Date.now();
  await user.save();

  return { success: true };
}

async function verifyEmail(token) {
  if (process.env.EMAIL_VERIFICATION === 'false') {
    return { success: true, message: 'Email verification is currently disabled. All accounts are auto-verified.' };
  }

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  await user.save();

  return { success: true, message: 'Email verified successfully' };
}

async function resendVerification(email) {
  if (process.env.EMAIL_VERIFICATION === 'false') {
    return { success: true, message: 'Email verification is currently disabled.' };
  }

  const user = await User.findOne({ email });
  if (!user) throw new AppError('User not found', 404);
  if (user.isVerified) throw new AppError('Email is already verified', 400);

  const token = crypto.randomBytes(32).toString('hex');
  user.verificationToken = token;
  user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  await emailService.sendVerificationEmail(user, token, '[Your Current Password]');

  return { success: true, message: 'Verification email sent' };
}

async function forgotPassword(email) {
  if (process.env.FORGOT_PASSWORD_ENABLED === 'false') {
    throw new AppError('Password recovery is temporarily disabled in development mode.', 403);
  }

  const user = await User.findOne({ email });
  if (!user) throw new AppError('No user found with that email address', 404);

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  await emailService.sendResetPasswordEmail(user.email, token);

  return { success: true, message: 'Password reset email sent' };
}

async function resetPassword(token, newPassword) {
  if (process.env.FORGOT_PASSWORD_ENABLED === 'false') {
    throw new AppError('Password recovery is temporarily disabled in development mode.', 403);
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.mustChangePassword = false;
  user.passwordChangedAt = Date.now();
  await user.save();

  return { success: true, message: 'Password reset successful' };
}

async function sendOTP(email) {
  if (process.env.OTP_ENABLED === 'false') {
    return { success: true, message: 'OTP verification is currently disabled.' };
  }

  const user = await User.findOne({ email });
  if (!user) throw new AppError('User not found', 404);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  await emailService.sendOTPEmail(user.email, otp);

  return { success: true, message: 'OTP sent to email' };
}

async function verifyOTP(email, otp) {
  if (process.env.OTP_ENABLED === 'false') {
    return { success: true, message: 'OTP verified successfully (Dev Bypass)' };
  }

  const user = await User.findOne({
    email,
    otp,
    otpExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  return { success: true, message: 'OTP verified successfully' };
}

module.exports = {
  login,
  changePassword,
  generateToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendOTP,
  verifyOTP
};
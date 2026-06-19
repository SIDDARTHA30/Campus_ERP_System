const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/appError');
const User = require('../models/User');

function getTokenFromRequest(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const userObj = user.toObject ? user.toObject() : user;
  const { passwordHash, ...safeUser } = userObj;
  return safeUser;
}

async function protect(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    if (user.status !== 'active') {
      return next(new AppError('User account is inactive', 403));
    }

    const safeUser = sanitizeUser(user);
    if (decoded.studentId) safeUser.studentId = decoded.studentId;
    if (decoded.facultyId) safeUser.facultyId = decoded.facultyId;

    req.user = safeUser;
    req.token = token;
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
}

function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    return next();
  };
}

module.exports = {
  protect,
  restrictTo,
  authorize: restrictTo
};
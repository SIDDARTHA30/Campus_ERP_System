const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

/**
 * Middleware to automatically filter queries based on the user's role.
 * If the user is a student, it adds their Student ID to the query.
 * If the user is faculty, it adds their Faculty ID to the query.
 * Admins are not filtered.
 */
const filterSelf = (idField = 'student') => asyncHandler(async (req, res, next) => {
  if (!req.user) return next();

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'student') {
    if (!req.user.studentId) return next(new AppError('Student profile not found', 404));
    
    // FORCE override any student filter provided by frontend
    req.query[idField] = req.user.studentId.toString();
  } else if (req.user.role === 'faculty' && idField === 'faculty') {
    if (!req.user.facultyId) return next(new AppError('Faculty profile not found', 404));
    
    // FORCE override any faculty filter provided by frontend
    req.query[idField] = req.user.facultyId.toString();
  }

  next();
});

module.exports = filterSelf;

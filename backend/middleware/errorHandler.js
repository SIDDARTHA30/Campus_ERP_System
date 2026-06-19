const { errorResponse } = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const details = err.details || null;

  const payload = errorResponse(message, details);

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('SERVER ERROR:', err);
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
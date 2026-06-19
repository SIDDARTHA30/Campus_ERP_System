const AppError = require('../utils/appError');

function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    if (property === 'body') {
      console.log(`[Validation] Request Body to ${req.originalUrl || ''}:`, req.body);
    }
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      console.error(`[Validation Failed] ${req.originalUrl || ''}:`, error.details.map(d => d.message));
      return next(new AppError('Validation failed', 400, error.details.map((detail) => detail.message)));
    }

    req[property] = value;
    return next();
  };
}

module.exports = validateRequest;
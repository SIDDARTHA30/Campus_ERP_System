require('dotenv').config();

const config = {
  appName: 'Campus ERP API',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'dev',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  emailVerification: process.env.EMAIL_VERIFICATION === 'true',
  pagination: {
    defaultLimit: Number(process.env.DEFAULT_PAGE_SIZE || 10),
    maxLimit: Number(process.env.MAX_PAGE_SIZE || 100)
  }
};

module.exports = config;
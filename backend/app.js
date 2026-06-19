const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { successResponse } = require('./utils/apiResponse');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.logLevel));

app.get('/health', (req, res) => {
  res.json(successResponse('Campus ERP API is healthy', {
    name: config.appName,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  }));
});

app.use(config.apiPrefix, routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
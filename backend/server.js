const app = require('./app');
const config = require('./config');
const { connectDB } = require('./config/db');

// Connect to Database, then start the server
connectDB()
  .then(async () => {
    const { connection } = require('mongoose');
    console.log(`✅ DB Connected: ${connection.name} @ ${connection.host}`);

    // Sync indexes at startup (one-time operation)
    const { syncAllIndexes } = require('./config/init');
    await syncAllIndexes();

    app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`${config.appName} running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to DB connection error:', err);
    process.exit(1);
  });
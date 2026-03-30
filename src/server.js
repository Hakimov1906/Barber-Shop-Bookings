require('dotenv').config();

const { createApp } = require('./app');
const { refreshSeeds } = require('./db/seed');
const { getJwtConfig } = require('./auth/jwt');
const { logger } = require('./utils/logger');

const app = createApp();
const port = Number(process.env.PORT || 4000);

function validateStartupConfig() {
  const { signingSecret } = getJwtConfig();
  if (!signingSecret) {
    logger.warn('JWT secret is not configured. Auth endpoints will return 500.');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD_HASH) {
    throw new Error('ADMIN_PASSWORD_HASH is required in production');
  }
}

async function start() {
  validateStartupConfig();

  if (process.env.SEED_ON_START === 'true') {
    try {
      await refreshSeeds({ resetDemo: process.env.RESET_DEMO === 'true' });
      logger.info('seed.refresh.completed');
    } catch (err) {
      logger.error('seed.refresh.failed', {
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack
      });
    }
  }

  app.listen(port, () => {
    logger.info('server.started', { port });
  });
}

start().catch((err) => {
  logger.error('server.start.failed', {
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack
  });
  process.exit(1);
});

module.exports = { app, start };

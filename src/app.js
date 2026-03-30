const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const openapi = require('./docs/openapi.json');
const { attachRequestId, requestLogger } = require('./middleware/request-context');
const { logger } = require('./utils/logger');

function createApp() {
  const app = express();

  const rawCors = (process.env.CORS_ORIGIN || '').trim();
  const corsOrigin = !rawCors || rawCors === '*'
    ? true
    : rawCors.split(',').map((o) => o.trim());

  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use(attachRequestId);
  app.use(requestLogger);

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));
  app.use('/api', publicRoutes);
  app.use('/api/admin', adminRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, next) => {
    logger.error('request.error', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: 'Server error' });
  });

  return app;
}

module.exports = { createApp };

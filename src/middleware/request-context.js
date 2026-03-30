const { randomUUID } = require('node:crypto');
const { logger } = require('../utils/logger');

function attachRequestId(req, res, next) {
  const incomingHeader = req.headers['x-request-id'];
  const requestId = typeof incomingHeader === 'string' && incomingHeader.trim()
    ? incomingHeader.trim()
    : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info('request.completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
  });

  next();
}

module.exports = { attachRequestId, requestLogger };

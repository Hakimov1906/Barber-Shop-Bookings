const { Pool } = require('pg');
const { logger } = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (err) => {
  logger.error('db.pool.error', {
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack
  });
});

module.exports = { pool };

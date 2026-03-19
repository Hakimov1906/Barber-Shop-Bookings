require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const { refreshSeeds } = require('./db/seed');
const openapi = require('./docs/openapi.json');

const app = express();

const rawCors = (process.env.CORS_ORIGIN || '').trim();
const corsOrigin = !rawCors || rawCors === '*'
  ? true
  : rawCors.split(',').map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const port = process.env.PORT || 4000;

async function start() {
  if (process.env.SEED_ON_START === 'true') {
    try {
      await refreshSeeds({ resetDemo: process.env.RESET_DEMO === 'true' });
      console.log('Seed refresh completed');
    } catch (err) {
      console.error('Seed refresh failed', err);
    }
  }

  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

start();

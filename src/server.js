require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

const rawCors = (process.env.CORS_ORIGIN || '').trim();
const corsOrigin = !rawCors || rawCors === '*'
  ? true
  : rawCors.split(',').map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

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
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

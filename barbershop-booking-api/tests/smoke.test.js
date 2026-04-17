const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
require('dotenv').config({ path: '.env' });

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const { createApp } = require('../src/app');
const { pool } = require('../src/db/pool');

const app = createApp();

test('GET /api/health returns liveness', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('GET /api/ready returns readiness', async () => {
  const response = await request(app).get('/api/ready');
  if (response.statusCode === 200) {
    assert.deepEqual(response.body, { status: 'ready' });
    return;
  }

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { error: 'Database unavailable' });
});

test.after(async () => {
  await pool.end();
});

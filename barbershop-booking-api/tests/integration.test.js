const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
require('dotenv').config({ path: '.env' });

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.ADMIN_USER = process.env.ADMIN_USER || 'admin';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_password';

const { createApp } = require('../src/app');
const { pool } = require('../src/db/pool');

const app = createApp();

function randomTime() {
  const hour = 9 + Math.floor(Math.random() * 8);
  const minute = Math.floor(Math.random() * 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const slotDate = '2099-12-31';
const slotTime = randomTime();
const email = `integration-${Date.now()}@example.com`;
const phone = `+996700${String(Date.now()).slice(-6)}`;
const password = 'password123';

let userToken = '';
let adminToken = '';
let barberId = null;
let serviceId = null;
let bookingId = null;

test.before(async () => {
  const barberResult = await pool.query(
    'SELECT id FROM barbers WHERE is_active = true ORDER BY id LIMIT 1'
  );
  const serviceResult = await pool.query(
    'SELECT id FROM services WHERE is_active = true ORDER BY id LIMIT 1'
  );

  if (!barberResult.rowCount || !serviceResult.rowCount) {
    throw new Error('Missing active barber/service in seed data');
  }

  barberId = barberResult.rows[0].id;
  serviceId = serviceResult.rows[0].id;
});

test('register, login and create booking flow', async () => {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Integration User',
      email,
      phone,
      password
    });

  assert.equal(registerResponse.statusCode, 201);
  assert.equal(registerResponse.body.user.email, email);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  assert.equal(loginResponse.statusCode, 200);
  assert.ok(loginResponse.body.token);
  userToken = loginResponse.body.token;

  const adminLoginResponse = await request(app)
    .post('/api/admin/login')
    .send({
      username: process.env.ADMIN_USER,
      password: process.env.ADMIN_PASSWORD
    });

  assert.equal(adminLoginResponse.statusCode, 200);
  assert.ok(adminLoginResponse.body.token);
  adminToken = adminLoginResponse.body.token;

  const slotCreateResponse = await request(app)
    .post('/api/admin/slots')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      barberId,
      date: slotDate,
      times: [slotTime]
    });

  assert.equal(slotCreateResponse.statusCode, 201);

  const bookingResponse = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      serviceId,
      barberId,
      date: slotDate,
      time: slotTime
    });

  assert.equal(bookingResponse.statusCode, 201);
  assert.ok(Number.isInteger(bookingResponse.body.id));
  bookingId = bookingResponse.body.id;

  const secondBookingResponse = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      serviceId,
      barberId,
      date: slotDate,
      time: slotTime
    });

  assert.equal(secondBookingResponse.statusCode, 409);
});

test('user can create and update own barber review', async () => {
  const createReviewResponse = await request(app)
    .post(`/api/barbers/${barberId}/reviews`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      rating: 5,
      comment: 'Excellent service and clean finish.'
    });

  assert.equal(createReviewResponse.statusCode, 201);
  assert.equal(createReviewResponse.body.review.barber_id, barberId);
  assert.equal(Number(createReviewResponse.body.review.rating), 5);

  const updateReviewResponse = await request(app)
    .post(`/api/barbers/${barberId}/reviews`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      rating: 4,
      comment: 'Updated review: still great, but minor wait.'
    });

  assert.equal(updateReviewResponse.statusCode, 200);
  assert.equal(Number(updateReviewResponse.body.review.rating), 4);
  assert.equal(updateReviewResponse.body.barber.id, barberId);

  const barbersResponse = await request(app).get('/api/barbers');
  assert.equal(barbersResponse.statusCode, 200);

  const targetBarber = barbersResponse.body.find((barber) => barber.id === barberId);
  assert.ok(targetBarber);
  assert.equal(Number(targetBarber.rating), Number(updateReviewResponse.body.barber.rating));
  assert.equal(
    Number(targetBarber.reviews_count),
    Number(updateReviewResponse.body.barber.reviews_count)
  );
});

test('user can view profile, list own bookings and cancel booking', async () => {
  const profileResponse = await request(app)
    .get('/api/users/me')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(profileResponse.statusCode, 200);
  assert.equal(profileResponse.body.email, email);

  const updateResponse = await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      fullName: 'Integration User Updated'
    });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.body.user.full_name, 'Integration User Updated');

  const bookingsResponse = await request(app)
    .get('/api/bookings/me')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(bookingsResponse.statusCode, 200);
  assert.ok(Array.isArray(bookingsResponse.body));
  assert.ok(bookingsResponse.body.some((booking) => booking.id === bookingId));

  const cancelResponse = await request(app)
    .delete(`/api/bookings/${bookingId}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(cancelResponse.statusCode, 200);

  const bookingsAfterCancelResponse = await request(app)
    .get('/api/bookings/me')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(bookingsAfterCancelResponse.statusCode, 200);
  assert.ok(
    !bookingsAfterCancelResponse.body.some((booking) => booking.id === bookingId)
  );
});

test.after(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    const userId = userResult.rowCount ? userResult.rows[0].id : null;

    if (userId) {
      await client.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
    }

    await client.query('DELETE FROM bookings WHERE date = $1 AND barber_id = $2 AND time = $3', [
      slotDate,
      barberId,
      slotTime
    ]);
    await client.query('DELETE FROM slots WHERE date = $1 AND barber_id = $2 AND time = $3', [
      slotDate,
      barberId,
      slotTime
    ]);
    await client.query('DELETE FROM users WHERE email = $1', [email]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
});

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

function randomTimes(count) {
  const result = new Set();
  while (result.size < count) {
    result.add(randomTime());
  }
  return Array.from(result);
}

const slotDate = '2099-12-31';
const slotTimes = randomTimes(4);
const phone = `+996700${String(Date.now()).slice(-6)}`;
const password = 'password123';
const updatedPassword = 'password456';
const tooLongPassword = 'p'.repeat(51);

let userToken = '';
let adminToken = '';
let barberId = null;
let serviceId = null;
let bookingId = null;
let dbReady = false;
let skipReason = '';

function skipIfDbUnavailable(t) {
  if (dbReady) {
    return false;
  }

  t.skip(skipReason || 'Database is not available for integration tests');
  return true;
}

test.before(async () => {
  try {
    await pool.query('SELECT 1');

    const barberResult = await pool.query(
      'SELECT id FROM barbers WHERE is_active = true ORDER BY id LIMIT 1'
    );
    const serviceResult = await pool.query(
      'SELECT id FROM services WHERE is_active = true ORDER BY id LIMIT 1'
    );

    if (!barberResult.rowCount || !serviceResult.rowCount) {
      skipReason = 'Missing active barber/service in seed data';
      return;
    }

    barberId = barberResult.rows[0].id;
    serviceId = serviceResult.rows[0].id;
    dbReady = true;
  } catch (error) {
    skipReason = `Database unavailable: ${error.code || error.message}`;
  }
});

test('register, login and create booking flow', async (t) => {
  if (skipIfDbUnavailable(t)) return;

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Integration User',
      phone,
      password
    });

  assert.equal(registerResponse.statusCode, 201);
  assert.equal(registerResponse.body.user.phone, phone);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ phone, password });

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
      times: slotTimes
    });

  assert.equal(slotCreateResponse.statusCode, 201);

  const bookingResponse = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      serviceId,
      barberId,
      date: slotDate,
      time: slotTimes[0]
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
      time: slotTimes[0]
    });

  assert.equal(secondBookingResponse.statusCode, 409);
});

test('rejects legacy email login payload and invalid phone format', async (t) => {
  if (skipIfDbUnavailable(t)) return;

  const invalidLoginPayloadResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'legacy@example.com', password });

  assert.equal(invalidLoginPayloadResponse.statusCode, 400);

  const invalidPhoneRegisterResponse = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Invalid Phone User',
      phone: '+99670012345',
      password
    });

  assert.equal(invalidPhoneRegisterResponse.statusCode, 400);
});

test('enforces password max length for register and password update', async (t) => {
  if (skipIfDbUnavailable(t)) return;

  const registerTooLongPasswordResponse = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Long Password User',
      phone: '+996700999999',
      password: tooLongPassword
    });

  assert.equal(registerTooLongPasswordResponse.statusCode, 400);

  const passwordTooLongResponse = await request(app)
    .patch('/api/users/me/password')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      currentPassword: password,
      newPassword: tooLongPassword
    });

  assert.equal(passwordTooLongResponse.statusCode, 400);
});

test('enforces max active bookings per user and allows booking after cancel', async (t) => {
  if (skipIfDbUnavailable(t)) return;

  const secondActiveBookingResponse = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      serviceId,
      barberId,
      date: slotDate,
      time: slotTimes[1]
    });

  assert.equal(secondActiveBookingResponse.statusCode, 201);
  assert.ok(Number.isInteger(secondActiveBookingResponse.body.id));
  const secondBookingId = secondActiveBookingResponse.body.id;

  const limitExceededResponse = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      serviceId,
      barberId,
      date: slotDate,
      time: slotTimes[2]
    });

  assert.equal(limitExceededResponse.statusCode, 409);
  assert.match(
    limitExceededResponse.body.error,
    /Maximum 2 active bookings per user reached/i
  );

  const cancelResponse = await request(app)
    .delete(`/api/bookings/${bookingId}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(cancelResponse.statusCode, 200);

  const bookingAfterCancelResponse = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      serviceId,
      barberId,
      date: slotDate,
      time: slotTimes[2]
    });

  assert.equal(bookingAfterCancelResponse.statusCode, 201);
  assert.ok(Number.isInteger(bookingAfterCancelResponse.body.id));
  bookingId = bookingAfterCancelResponse.body.id;

  const cancelSecondBookingResponse = await request(app)
    .delete(`/api/bookings/${secondBookingId}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(cancelSecondBookingResponse.statusCode, 200);
});

test('user can change password and login with new credentials', async (t) => {
  if (skipIfDbUnavailable(t)) return;

  const loginWithCurrentPasswordResponse = await request(app)
    .post('/api/auth/login')
    .send({ phone, password });

  assert.equal(loginWithCurrentPasswordResponse.statusCode, 200);

  const wrongCurrentPasswordResponse = await request(app)
    .patch('/api/users/me/password')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      currentPassword: 'wrong-password',
      newPassword: updatedPassword
    });

  assert.equal(wrongCurrentPasswordResponse.statusCode, 400);

  const shortPasswordResponse = await request(app)
    .patch('/api/users/me/password')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      currentPassword: password,
      newPassword: '123'
    });

  assert.equal(shortPasswordResponse.statusCode, 400);

  const passwordChangeResponse = await request(app)
    .patch('/api/users/me/password')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      currentPassword: password,
      newPassword: updatedPassword
    });

  assert.equal(passwordChangeResponse.statusCode, 200);
  assert.equal(passwordChangeResponse.body.status, 'password_updated');

  const loginWithOldPasswordResponse = await request(app)
    .post('/api/auth/login')
    .send({ phone, password });

  assert.equal(loginWithOldPasswordResponse.statusCode, 401);

  const loginWithNewPasswordResponse = await request(app)
    .post('/api/auth/login')
    .send({ phone, password: updatedPassword });

  assert.equal(loginWithNewPasswordResponse.statusCode, 200);
  assert.ok(loginWithNewPasswordResponse.body.token);
  userToken = loginWithNewPasswordResponse.body.token;
});

test('user can create and update own barber review', async (t) => {
  if (skipIfDbUnavailable(t)) return;

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

  const longComment = 'x'.repeat(151);
  const tooLongCommentResponse = await request(app)
    .post(`/api/barbers/${barberId}/reviews`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      rating: 4,
      comment: longComment
    });

  assert.equal(tooLongCommentResponse.statusCode, 400);

  const barbersResponse = await request(app).get('/api/barbers');
  assert.equal(barbersResponse.statusCode, 200);

  const targetBarber = barbersResponse.body.find((barber) => barber.id === barberId);
  assert.ok(targetBarber);
  assert.equal(Number(targetBarber.rating), Number(updateReviewResponse.body.barber.rating));
  assert.equal(
    Number(targetBarber.reviews_count),
    Number(updateReviewResponse.body.barber.reviews_count)
  );
  assert.ok(Number.isInteger(targetBarber.salon_id));
  assert.ok(targetBarber.salon);
  assert.equal(Number(targetBarber.salon.id), Number(targetBarber.salon_id));

  const filteredBySalonResponse = await request(app)
    .get('/api/barbers')
    .query({ salonId: targetBarber.salon_id });

  assert.equal(filteredBySalonResponse.statusCode, 200);
  assert.ok(Array.isArray(filteredBySalonResponse.body));
  assert.ok(
    filteredBySalonResponse.body.every(
      (barber) => Number(barber.salon_id) === Number(targetBarber.salon_id)
    )
  );
});

test('user can view profile, list own bookings and cancel booking', async (t) => {
  if (skipIfDbUnavailable(t)) return;

  const profileResponse = await request(app)
    .get('/api/users/me')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(profileResponse.statusCode, 200);
  assert.equal(profileResponse.body.phone, phone);

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

test('cart endpoints allow add/update/remove/clear for authorized user', async (t) => {
  if (skipIfDbUnavailable(t)) return;

  const productResult = await pool.query(
    'SELECT id FROM products WHERE is_active = true ORDER BY id LIMIT 1'
  );
  assert.ok(productResult.rowCount);
  const productId = productResult.rows[0].id;

  const setItemResponse = await request(app)
    .put(`/api/cart/me/items/${productId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ quantity: 2 });
  assert.equal(setItemResponse.statusCode, 200);

  const getCartResponse = await request(app)
    .get('/api/cart/me')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(getCartResponse.statusCode, 200);
  assert.ok(Array.isArray(getCartResponse.body.items));
  assert.ok(
    getCartResponse.body.items.some(
      (item) => item.product_id === productId && item.quantity === 2
    )
  );

  const invalidQuantityResponse = await request(app)
    .put(`/api/cart/me/items/${productId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ quantity: 0 });
  assert.equal(invalidQuantityResponse.statusCode, 400);

  const removeItemResponse = await request(app)
    .delete(`/api/cart/me/items/${productId}`)
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(removeItemResponse.statusCode, 200);

  const clearCartResponse = await request(app)
    .delete('/api/cart/me')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(clearCartResponse.statusCode, 200);
});

test('cart endpoints require auth', async (t) => {
  if (skipIfDbUnavailable(t)) return;

  const unauthorizedGetResponse = await request(app).get('/api/cart/me');
  assert.equal(unauthorizedGetResponse.statusCode, 401);
});

test.after(async () => {
  if (!dbReady) {
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query('SELECT id FROM users WHERE phone = $1', [phone]);
    const userId = userResult.rowCount ? userResult.rows[0].id : null;

    if (userId) {
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
    }

    await client.query(
      'DELETE FROM bookings WHERE date = $1 AND barber_id = $2 AND time = ANY($3::time[])',
      [slotDate, barberId, slotTimes]
    );
    await client.query(
      'DELETE FROM slots WHERE date = $1 AND barber_id = $2 AND time = ANY($3::time[])',
      [slotDate, barberId, slotTimes]
    );
    await client.query('DELETE FROM users WHERE phone = $1', [phone]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
});

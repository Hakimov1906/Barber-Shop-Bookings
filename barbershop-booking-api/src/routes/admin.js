const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { signAccessToken, getJwtConfig } = require('../auth/jwt');
const { createRateLimit } = require('../middleware/rate-limit');
const { logger } = require('../utils/logger');
const {
  loginSchema,
  slotCreateSchema,
  slotQuerySchema,
  bookingsQuerySchema,
  usersQuerySchema,
  salonCreateSchema,
  salonUpdateSchema,
  salonsAdminQuerySchema,
  validate
} = require('../utils/validation');

const router = express.Router();

const adminLoginRateLimiter = createRateLimit({
  windowMs: process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS || process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
  max: process.env.ADMIN_LOGIN_RATE_LIMIT_MAX || 5,
  message: 'Too many admin login attempts. Try again later.'
});

router.post('/login', adminLoginRateLimiter, async (req, res) => {
  const { data, error } = validate(loginSchema, req.body);
  if (error) {
    return res.status(400).json({ error: 'Invalid payload', details: error.fieldErrors });
  }

  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !adminPasswordHash) {
    return res.status(500).json({
      error: 'ADMIN_PASSWORD_HASH is required in production'
    });
  }

  if (!adminPassword && !adminPasswordHash) {
    return res.status(500).json({
      error: 'Admin credentials are not configured'
    });
  }

  if (isProduction && adminPassword) {
    logger.warn('ADMIN_PASSWORD is set in production and will be ignored');
  }

  if (data.username !== adminUser) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  let valid = false;
  if (adminPasswordHash) {
    valid = await bcrypt.compare(data.password, adminPasswordHash);
  } else if (!isProduction) {
    valid = data.password === adminPassword;
  }

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!getJwtConfig().signingSecret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  }

  const token = signAccessToken(
    { sub: adminUser, role: 'admin' },
    { expiresIn: process.env.JWT_TTL || '12h' }
  );

  res.json({ token });
});

router.use(requireAuth, requireRole('admin'));

router.get('/salons', async (req, res, next) => {
  const { data, error } = validate(salonsAdminQuerySchema, req.query);
  if (error) {
    return res.status(400).json({ error: 'Invalid query', details: error.fieldErrors });
  }

  try {
    const params = [];
    let sql = `
      SELECT
        id,
        code,
        name,
        address,
        work_hours,
        latitude,
        longitude,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM salons
      WHERE 1=1
    `;

    if (!data.includeInactive) {
      params.push(true);
      sql += ` AND is_active = $${params.length}`;
    }

    sql += ' ORDER BY sort_order ASC, id ASC';

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/salons', async (req, res, next) => {
  const { data, error } = validate(salonCreateSchema, req.body);
  if (error) {
    return res.status(400).json({ error: 'Invalid payload', details: error.fieldErrors });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO salons (
        code, name, address, work_hours, latitude, longitude, sort_order, is_active, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING
        id,
        code,
        name,
        address,
        work_hours,
        latitude,
        longitude,
        is_active,
        sort_order,
        created_at,
        updated_at
      `,
      [
        data.code,
        data.name,
        data.address,
        data.workHours,
        data.latitude,
        data.longitude,
        data.sortOrder || 0,
        typeof data.isActive === 'boolean' ? data.isActive : true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Salon code or name already exists' });
    }
    next(err);
  }
});

router.patch('/salons/:id', async (req, res, next) => {
  const salonId = Number(req.params.id);
  if (!Number.isInteger(salonId) || salonId <= 0) {
    return res.status(400).json({ error: 'Invalid salon id' });
  }

  const { data, error } = validate(salonUpdateSchema, req.body);
  if (error) {
    return res.status(400).json({ error: 'Invalid payload', details: error.fieldErrors });
  }

  const fields = [];
  const params = [];

  if (typeof data.code !== 'undefined') {
    params.push(data.code);
    fields.push(`code = $${params.length}`);
  }
  if (typeof data.name !== 'undefined') {
    params.push(data.name);
    fields.push(`name = $${params.length}`);
  }
  if (typeof data.address !== 'undefined') {
    params.push(data.address);
    fields.push(`address = $${params.length}`);
  }
  if (typeof data.workHours !== 'undefined') {
    params.push(data.workHours);
    fields.push(`work_hours = $${params.length}`);
  }
  if (typeof data.latitude !== 'undefined') {
    params.push(data.latitude);
    fields.push(`latitude = $${params.length}`);
  }
  if (typeof data.longitude !== 'undefined') {
    params.push(data.longitude);
    fields.push(`longitude = $${params.length}`);
  }
  if (typeof data.sortOrder !== 'undefined') {
    params.push(data.sortOrder);
    fields.push(`sort_order = $${params.length}`);
  }
  if (typeof data.isActive !== 'undefined') {
    params.push(data.isActive);
    fields.push(`is_active = $${params.length}`);
  }

  fields.push('updated_at = NOW()');
  params.push(salonId);

  try {
    const result = await pool.query(
      `
      UPDATE salons
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING
        id,
        code,
        name,
        address,
        work_hours,
        latitude,
        longitude,
        is_active,
        sort_order,
        created_at,
        updated_at
      `,
      params
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Salon code or name already exists' });
    }
    next(err);
  }
});

router.get('/bookings', async (req, res, next) => {
  const { data, error } = validate(bookingsQuerySchema, req.query);
  if (error) {
    return res.status(400).json({ error: 'Invalid query', details: error.fieldErrors });
  }

  try {
    const params = [];
    let sql = `
      SELECT b.id, b.client_name, b.client_phone, b.date, b.time,
             s.name AS service_name, br.name AS barber_name
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      JOIN barbers br ON br.id = b.barber_id
      WHERE 1=1
    `;

    if (data.date) {
      params.push(data.date);
      sql += ` AND b.date = $${params.length}`;
    }

    if (data.barberId) {
      params.push(data.barberId);
      sql += ` AND b.barber_id = $${params.length}`;
    }

    sql += ' ORDER BY b.date, b.time';

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  const { data, error } = validate(usersQuerySchema, req.query);
  if (error) {
    return res.status(400).json({ error: 'Invalid query', details: error.fieldErrors });
  }

  const limit = data.limit || 50;
  const offset = data.offset || 0;

  try {
    const result = await pool.query(
      `
      SELECT id, full_name, email, phone, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    res.json({ items: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
});

router.delete('/bookings/:id', async (req, res, next) => {
  const bookingId = Number(req.params.id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({ error: 'Invalid booking id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookingRes = await client.query(
      'SELECT id, slot_id FROM bookings WHERE id = $1 FOR UPDATE',
      [bookingId]
    );

    if (!bookingRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const slotId = bookingRes.rows[0].slot_id;
    await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
    await client.query('UPDATE slots SET status = $1 WHERE id = $2', ['available', slotId]);
    await client.query('COMMIT');

    res.json({ status: 'deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.get('/slots', async (req, res, next) => {
  const { data, error } = validate(slotQuerySchema, req.query);
  if (error) {
    return res.status(400).json({ error: 'Invalid query', details: error.fieldErrors });
  }

  try {
    const params = [data.date];
    let sql = 'SELECT id, barber_id, date, time, status FROM slots WHERE date = $1';

    if (data.barberId) {
      params.push(data.barberId);
      sql += ` AND barber_id = $${params.length}`;
    }

    if (data.status) {
      params.push(data.status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY time';

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/slots', async (req, res, next) => {
  const { data, error } = validate(slotCreateSchema, req.body);
  if (error) {
    return res.status(400).json({ error: 'Invalid payload', details: error.fieldErrors });
  }

  const times = Array.from(new Set(data.times));
  const status = data.status || 'available';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const barberRes = await client.query(
      `
      SELECT b.id
      FROM barbers b
      LEFT JOIN salons s ON s.id = b.salon_id
      WHERE b.id = $1
        AND b.is_active = true
        AND (b.salon_id IS NULL OR s.is_active = true)
      `,
      [data.barberId]
    );
    if (!barberRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Barber not found' });
    }

    const insertRes = await client.query(
      `
      INSERT INTO slots (barber_id, date, time, status)
      SELECT $1, $2, UNNEST($3::time[]), $4
      ON CONFLICT DO NOTHING
      RETURNING id, time, status
      `,
      [data.barberId, data.date, times, status]
    );

    await client.query('COMMIT');

    res.status(201).json({
      created: insertRes.rows,
      skipped: times.length - insertRes.rowCount
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.delete('/slots/:id', async (req, res, next) => {
  const slotId = Number(req.params.id);
  if (!Number.isInteger(slotId) || slotId <= 0) {
    return res.status(400).json({ error: 'Invalid slot id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const slotRes = await client.query(
      'SELECT id, status FROM slots WHERE id = $1 FOR UPDATE',
      [slotId]
    );

    if (!slotRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (slotRes.rows[0].status === 'booked') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Cannot delete a booked slot' });
    }

    await client.query('DELETE FROM slots WHERE id = $1', [slotId]);
    await client.query('COMMIT');

    res.json({ status: 'deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;

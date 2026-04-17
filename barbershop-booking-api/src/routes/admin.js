const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { signAccessToken, getJwtConfig } = require('../auth/jwt');
const { createRateLimit } = require('../middleware/rate-limit');

const router = express.Router();

const adminLoginRateLimiter = createRateLimit({
  windowMs: process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS || process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
  max: process.env.ADMIN_LOGIN_RATE_LIMIT_MAX || 5,
  message: 'Too many admin login attempts. Try again later.'
});

const phoneRegex = /^\+996\d{9}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

function normalizePhone(value) {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return `+${digits}`;
}

function normalizeTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.length === 5 ? `${raw}:00` : raw;
}

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data };
  return { error: result.error.flatten().fieldErrors };
}

function parseId(raw, label) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return { error: `Invalid ${label}` };
  return { id };
}

function sendValidationError(res, parsed, source = 'payload') {
  if (!parsed.error) return false;
  res.status(400).json({ error: `Invalid ${source}`, details: parsed.error });
  return true;
}

function handleKnownErrors(res, err) {
  if (err.statusCode) {
    res.status(err.statusCode).json({ error: err.message });
    return true;
  }
  if (err.code === '23505') {
    res.status(409).json({ error: 'Conflict: entity already exists' });
    return true;
  }
  return false;
}

function ensureNonEmptyPatch(value) {
  return Object.keys(value).length > 0;
}

async function ensureEntityExists(client, table, id, label = 'Entity') {
  const result = await client.query(`SELECT id FROM ${table} WHERE id = $1`, [id]);
  if (!result.rowCount) {
    const err = new Error(`${label} not found`);
    err.statusCode = 404;
    throw err;
  }
}

async function getUserById(client, userId) {
  const result = await client.query('SELECT id, full_name, phone FROM users WHERE id = $1', [userId]);
  if (!result.rowCount) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
}

async function recalcBarberStats(client, barberId) {
  const statsRes = await client.query(
    `
    SELECT
      COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0) AS avg_rating,
      COUNT(*)::int AS total_count
    FROM reviews
    WHERE barber_id = $1
    `,
    [barberId]
  );

  const stats = statsRes.rows[0] || { avg_rating: 5.0, total_count: 0 };
  await client.query(
    'UPDATE barbers SET rating = $2, reviews_count = $3 WHERE id = $1',
    [barberId, Number(stats.avg_rating), Number(stats.total_count)]
  );
}

async function setSlotAvailable(client, slotId) {
  await client.query('UPDATE slots SET status = $1 WHERE id = $2', ['available', slotId]);
}

async function lockOrCreateSlotForBooking(client, barberId, date, time) {
  const normalizedTime = normalizeTime(time);
  const slotRes = await client.query(
    `
    SELECT id, status
    FROM slots
    WHERE barber_id = $1
      AND date = $2
      AND date_trunc('minute', time) = date_trunc('minute', $3::time)
    FOR UPDATE
    `,
    [barberId, date, normalizedTime]
  );

  if (!slotRes.rowCount) {
    const insertRes = await client.query(
      `
      INSERT INTO slots (barber_id, date, time, status)
      VALUES ($1, $2, $3, 'booked')
      RETURNING id
      `,
      [barberId, date, normalizedTime]
    );
    return { slotId: insertRes.rows[0].id, time: normalizedTime };
  }

  const slot = slotRes.rows[0];
  if (slot.status !== 'available') {
    const err = new Error('Selected time slot is not available');
    err.statusCode = 409;
    throw err;
  }

  await client.query('UPDATE slots SET status = $1 WHERE id = $2', ['booked', slot.id]);
  return { slotId: slot.id, time: normalizedTime };
}

async function createBookingTx(client, payload) {
  const user = await getUserById(client, payload.userId);
  await ensureEntityExists(client, 'services', payload.serviceId, 'Service');
  await ensureEntityExists(client, 'barbers', payload.barberId, 'Barber');

  const lockedSlot = await lockOrCreateSlotForBooking(client, payload.barberId, payload.date, payload.time);

  const bookingRes = await client.query(
    `
    INSERT INTO bookings (user_id, client_name, client_phone, service_id, barber_id, slot_id, date, time)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, user_id, client_name, client_phone, service_id, barber_id, slot_id, date, time, created_at
    `,
    [
      user.id,
      user.full_name,
      user.phone,
      payload.serviceId,
      payload.barberId,
      lockedSlot.slotId,
      payload.date,
      lockedSlot.time
    ]
  );

  return bookingRes.rows[0];
}

async function updateBookingTx(client, bookingId, patch) {
  const bookingRes = await client.query(
    'SELECT id, user_id, service_id, barber_id, slot_id, date, time FROM bookings WHERE id = $1 FOR UPDATE',
    [bookingId]
  );
  if (!bookingRes.rowCount) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  const current = bookingRes.rows[0];
  const oldSlotRes = await client.query(
    'SELECT id, barber_id, date, time FROM slots WHERE id = $1 FOR UPDATE',
    [current.slot_id]
  );
  if (!oldSlotRes.rowCount) {
    const err = new Error('Slot not found');
    err.statusCode = 404;
    throw err;
  }

  const oldSlot = oldSlotRes.rows[0];
  const next = {
    userId: typeof patch.userId === 'number' ? patch.userId : Number(current.user_id),
    serviceId: typeof patch.serviceId === 'number' ? patch.serviceId : Number(current.service_id),
    barberId: typeof patch.barberId === 'number' ? patch.barberId : Number(current.barber_id),
    date: typeof patch.date === 'string' ? patch.date : String(current.date).slice(0, 10),
    time: typeof patch.time === 'string' ? normalizeTime(patch.time) : normalizeTime(current.time)
  };

  const user = await getUserById(client, next.userId);
  await ensureEntityExists(client, 'services', next.serviceId, 'Service');
  await ensureEntityExists(client, 'barbers', next.barberId, 'Barber');

  const slotChanged =
    Number(oldSlot.barber_id) !== Number(next.barberId) ||
    String(oldSlot.date).slice(0, 10) !== String(next.date).slice(0, 10) ||
    normalizeTime(oldSlot.time) !== next.time;

  let nextSlotId = Number(current.slot_id);

  if (slotChanged) {
    const target = await lockOrCreateSlotForBooking(client, next.barberId, next.date, next.time);
    nextSlotId = target.slotId;
    await setSlotAvailable(client, Number(current.slot_id));
  } else {
    await client.query('UPDATE slots SET status = $1 WHERE id = $2', ['booked', Number(current.slot_id)]);
  }

  const updatedRes = await client.query(
    `
    UPDATE bookings
    SET
      user_id = $2,
      client_name = $3,
      client_phone = $4,
      service_id = $5,
      barber_id = $6,
      slot_id = $7,
      date = $8,
      time = $9
    WHERE id = $1
    RETURNING id, user_id, client_name, client_phone, service_id, barber_id, slot_id, date, time, created_at
    `,
    [
      bookingId,
      user.id,
      user.full_name,
      user.phone,
      next.serviceId,
      next.barberId,
      nextSlotId,
      next.date,
      next.time
    ]
  );

  return updatedRes.rows[0];
}

async function deleteBookingTx(client, bookingId) {
  const bookingRes = await client.query('SELECT id, slot_id FROM bookings WHERE id = $1 FOR UPDATE', [bookingId]);
  if (!bookingRes.rowCount) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }
  await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
  await setSlotAvailable(client, Number(bookingRes.rows[0].slot_id));
}

async function deleteUserCascadeTx(client, userId) {
  const userLock = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
  if (!userLock.rowCount) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const bookingSlots = await client.query('SELECT slot_id FROM bookings WHERE user_id = $1 FOR UPDATE', [userId]);
  const slotIds = bookingSlots.rows.map((row) => Number(row.slot_id));
  await client.query('DELETE FROM bookings WHERE user_id = $1', [userId]);
  if (slotIds.length) {
    await client.query('UPDATE slots SET status = $1 WHERE id = ANY($2::int[])', ['available', slotIds]);
  }

  const reviewBarbers = await client.query('SELECT DISTINCT barber_id FROM reviews WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
  for (const row of reviewBarbers.rows) {
    await recalcBarberStats(client, Number(row.barber_id));
  }

  await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM users WHERE id = $1', [userId]);
}

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const adminLoginSchema = z.object({
  phone: z
    .string()
    .transform((value) => normalizePhone(value))
    .refine((value) => phoneRegex.test(value), 'Invalid phone number'),
  password: z.string().min(1)
});

const adminCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .transform((value) => normalizePhone(value))
    .refine((value) => phoneRegex.test(value), 'Invalid phone number'),
  password: z.string().min(6).max(50)
});

const adminUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z
    .string()
    .transform((value) => normalizePhone(value))
    .refine((value) => phoneRegex.test(value), 'Invalid phone number')
    .optional(),
  password: z.string().min(6).max(50).optional()
});

const userCreateSchema = adminCreateSchema;
const userUpdateSchema = adminUpdateSchema;

const salonCreateSchema = z.object({
  code: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{1,49}$/),
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(240),
  workHours: z.string().trim().min(5).max(60),
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isActive: z.coerce.boolean().optional()
});

const salonUpdateSchema = z.object({
  code: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{1,49}$/).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  address: z.string().trim().min(3).max(240).optional(),
  workHours: z.string().trim().min(5).max(60).optional(),
  latitude: z.coerce.number().gte(-90).lte(90).optional(),
  longitude: z.coerce.number().gte(-180).lte(180).optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isActive: z.coerce.boolean().optional()
});

const barberCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(1).max(80).optional(),
  experienceYears: z.coerce.number().int().min(1).max(80).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewsCount: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().trim().url().or(z.literal('')).optional(),
  isAvailable: z.coerce.boolean().optional(),
  specialties: z.array(z.string().trim().min(1).max(80)).optional(),
  salonId: z.coerce.number().int().positive().nullable().optional(),
  location: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(5000).optional(),
  isActive: z.coerce.boolean().optional()
});

const barberUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.string().trim().min(1).max(80).optional(),
  experienceYears: z.coerce.number().int().min(1).max(80).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewsCount: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().trim().url().or(z.literal('')).optional(),
  isAvailable: z.coerce.boolean().optional(),
  specialties: z.array(z.string().trim().min(1).max(80)).optional(),
  salonId: z.coerce.number().int().positive().nullable().optional(),
  location: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(5000).optional(),
  isActive: z.coerce.boolean().optional()
});

const serviceCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  durationMinutes: z.coerce.number().int().min(1).max(480),
  price: z.coerce.number().gte(0),
  isActive: z.coerce.boolean().optional()
});

const serviceUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(480).optional(),
  price: z.coerce.number().gte(0).optional(),
  isActive: z.coerce.boolean().optional()
});

const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(5000),
  price: z.coerce.number().gte(0),
  imageUrl: z.string().trim().url().or(z.literal('')).optional(),
  category: z.enum(['men', 'women', 'unisex']),
  type: z.string().trim().min(1).max(60),
  stockQty: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean().optional()
});

const productUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(2).max(5000).optional(),
  price: z.coerce.number().gte(0).optional(),
  imageUrl: z.string().trim().url().or(z.literal('')).optional(),
  category: z.enum(['men', 'women', 'unisex']).optional(),
  type: z.string().trim().min(1).max(60).optional(),
  stockQty: z.coerce.number().int().min(0).optional(),
  isActive: z.coerce.boolean().optional()
});

const slotCreateSchema = z.object({
  barberId: z.coerce.number().int().positive(),
  date: z.string().regex(dateRegex),
  times: z.array(z.string().regex(timeRegex)).min(1),
  status: z.enum(['available', 'booked', 'blocked']).optional()
});

const slotUpdateSchema = z.object({
  barberId: z.coerce.number().int().positive().optional(),
  date: z.string().regex(dateRegex).optional(),
  time: z.string().regex(timeRegex).optional(),
  status: z.enum(['available', 'booked', 'blocked']).optional()
});

const slotListQuerySchema = z.object({
  date: z.string().regex(dateRegex).optional(),
  barberId: z.coerce.number().int().positive().optional(),
  status: z.enum(['available', 'booked', 'blocked']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const bookingCreateSchema = z.object({
  userId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive(),
  barberId: z.coerce.number().int().positive(),
  date: z.string().regex(dateRegex),
  time: z.string().regex(timeRegex)
});

const bookingUpdateSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  serviceId: z.coerce.number().int().positive().optional(),
  barberId: z.coerce.number().int().positive().optional(),
  date: z.string().regex(dateRegex).optional(),
  time: z.string().regex(timeRegex).optional()
});

const bookingListQuerySchema = z.object({
  date: z.string().regex(dateRegex).optional(),
  barberId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const reviewCreateSchema = z.object({
  barberId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive().nullable().optional(),
  authorName: z.string().trim().min(2).max(120).optional(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(2).max(150)
});

const reviewUpdateSchema = z.object({
  barberId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().nullable().optional(),
  authorName: z.string().trim().min(2).max(120).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  comment: z.string().trim().min(2).max(150).optional()
});

const reviewListQuerySchema = z.object({
  barberId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const cartItemCreateSchema = z.object({
  userId: z.coerce.number().int().positive(),
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive()
});

const cartItemUpdateSchema = z.object({
  quantity: z.coerce.number().int().positive()
});

const cartItemListQuerySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  productId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

router.post('/login', adminLoginRateLimiter, async (req, res, next) => {
  const parsed = validate(adminLoginSchema, req.body);
  if (sendValidationError(res, parsed)) return;

  if (!getJwtConfig().signingSecret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  }

  try {
    const adminRes = await pool.query(
      'SELECT id, full_name, phone, password_hash FROM admins WHERE phone = $1',
      [parsed.data.phone]
    );
    if (!adminRes.rowCount) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = adminRes.rows[0];
    const ok = await bcrypt.compare(parsed.data.password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signAccessToken({ sub: admin.id, role: 'admin' }, { expiresIn: process.env.JWT_TTL || '12h' });
    return res.json({ token, admin: { id: admin.id, full_name: admin.full_name, phone: admin.phone } });
  } catch (err) {
    return next(err);
  }
});

router.use(requireAuth, requireRole('admin'));

function buildPatchSet(allowedMap, data, params, fields) {
  for (const [srcKey, dbField] of allowedMap) {
    if (typeof data[srcKey] !== 'undefined') {
      params.push(data[srcKey]);
      fields.push(`${dbField} = $${params.length}`);
    }
  }
}

router.get('/admins', async (req, res, next) => {
  const parsed = validate(paginationSchema, req.query);
  if (sendValidationError(res, parsed, 'query')) return;
  const limit = parsed.data.limit || 50;
  const offset = parsed.data.offset || 0;
  try {
    const result = await pool.query(
      'SELECT id, full_name, phone, created_at, updated_at FROM admins ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({ items: result.rows, limit, offset });
  } catch (err) { next(err); }
});

router.get('/admins/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'admin id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('SELECT id, full_name, phone, created_at, updated_at FROM admins WHERE id = $1', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Admin not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/admins', async (req, res, next) => {
  const parsed = validate(adminCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  try {
    const hash = await bcrypt.hash(parsed.data.password, 10);
    const result = await pool.query(
      'INSERT INTO admins (full_name, phone, password_hash, updated_at) VALUES ($1, $2, $3, NOW()) RETURNING id, full_name, phone, created_at, updated_at',
      [parsed.data.fullName, parsed.data.phone, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (handleKnownErrors(res, err)) return;
    next(err);
  }
});

router.patch('/admins/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'admin id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const parsed = validate(adminUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  if (!ensureNonEmptyPatch(parsed.data)) return res.status(400).json({ error: 'At least one field is required' });
  try {
    const params = [];
    const fields = [];
    buildPatchSet(
      [['fullName', 'full_name'], ['phone', 'phone']],
      parsed.data,
      params,
      fields
    );
    if (typeof parsed.data.password !== 'undefined') {
      params.push(await bcrypt.hash(parsed.data.password, 10));
      fields.push(`password_hash = $${params.length}`);
    }
    fields.push('updated_at = NOW()');
    params.push(idr.id);
    const result = await pool.query(
      `UPDATE admins SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id, full_name, phone, created_at, updated_at`,
      params
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Admin not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (handleKnownErrors(res, err)) return;
    next(err);
  }
});

router.delete('/admins/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'admin id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('DELETE FROM admins WHERE id = $1 RETURNING id', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Admin not found' });
    res.json({ status: 'deleted' });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  const parsed = validate(paginationSchema, req.query);
  if (sendValidationError(res, parsed, 'query')) return;
  const limit = parsed.data.limit || 50;
  const offset = parsed.data.offset || 0;
  try {
    const result = await pool.query('SELECT id, full_name, phone, created_at FROM users ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ items: result.rows, limit, offset });
  } catch (err) { next(err); }
});

router.get('/users/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'user id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('SELECT id, full_name, phone, created_at FROM users WHERE id = $1', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/users', async (req, res, next) => {
  const parsed = validate(userCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  try {
    const hash = await bcrypt.hash(parsed.data.password, 10);
    const result = await pool.query(
      'INSERT INTO users (full_name, phone, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, phone, created_at',
      [parsed.data.fullName, parsed.data.phone, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (handleKnownErrors(res, err)) return;
    next(err);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'user id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const parsed = validate(userUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  if (!ensureNonEmptyPatch(parsed.data)) return res.status(400).json({ error: 'At least one field is required' });
  try {
    const params = [];
    const fields = [];
    buildPatchSet([['fullName', 'full_name'], ['phone', 'phone']], parsed.data, params, fields);
    if (typeof parsed.data.password !== 'undefined') {
      params.push(await bcrypt.hash(parsed.data.password, 10));
      fields.push(`password_hash = $${params.length}`);
    }
    params.push(idr.id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id, full_name, phone, created_at`,
      params
    );
    if (!result.rowCount) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (handleKnownErrors(res, err)) return;
    next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'user id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await deleteUserCascadeTx(client, idr.id);
    await client.query('COMMIT');
    res.json({ status: 'deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.get('/salons', async (req, res, next) => {
  const includeInactive = String(req.query.includeInactive || '').toLowerCase() === 'true';
  try {
    const params = [];
    let sql = 'SELECT id, code, name, address, work_hours, latitude, longitude, is_active, sort_order, created_at, updated_at FROM salons WHERE 1=1';
    if (!includeInactive) {
      params.push(true);
      sql += ` AND is_active = $${params.length}`;
    }
    sql += ' ORDER BY sort_order ASC, id ASC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.get('/salons/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'salon id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('SELECT id, code, name, address, work_hours, latitude, longitude, is_active, sort_order, created_at, updated_at FROM salons WHERE id = $1', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Salon not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/salons', async (req, res, next) => {
  const parsed = validate(salonCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  try {
    const result = await pool.query(
      `INSERT INTO salons (code, name, address, work_hours, latitude, longitude, sort_order, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, code, name, address, work_hours, latitude, longitude, is_active, sort_order, created_at, updated_at`,
      [
        parsed.data.code,
        parsed.data.name,
        parsed.data.address,
        parsed.data.workHours,
        parsed.data.latitude,
        parsed.data.longitude,
        parsed.data.sortOrder || 0,
        typeof parsed.data.isActive === 'boolean' ? parsed.data.isActive : true
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { if (handleKnownErrors(res, err)) return; next(err); }
});

router.patch('/salons/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'salon id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const parsed = validate(salonUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  if (!ensureNonEmptyPatch(parsed.data)) return res.status(400).json({ error: 'At least one field is required' });
  try {
    const params = [];
    const fields = [];
    buildPatchSet(
      [['code', 'code'], ['name', 'name'], ['address', 'address'], ['workHours', 'work_hours'], ['latitude', 'latitude'], ['longitude', 'longitude'], ['sortOrder', 'sort_order'], ['isActive', 'is_active']],
      parsed.data,
      params,
      fields
    );
    fields.push('updated_at = NOW()');
    params.push(idr.id);
    const result = await pool.query(
      `UPDATE salons SET ${fields.join(', ')} WHERE id = $${params.length}
       RETURNING id, code, name, address, work_hours, latitude, longitude, is_active, sort_order, created_at, updated_at`,
      params
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Salon not found' });
    res.json(result.rows[0]);
  } catch (err) { if (handleKnownErrors(res, err)) return; next(err); }
});

router.delete('/salons/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'salon id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('DELETE FROM salons WHERE id = $1 RETURNING id', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Salon not found' });
    res.json({ status: 'deleted' });
  } catch (err) { next(err); }
});

router.get('/barbers', async (req, res, next) => {
  const includeInactive = String(req.query.includeInactive || '').toLowerCase() === 'true';
  const salonId = typeof req.query.salonId !== 'undefined' ? parseId(req.query.salonId, 'salon id') : null;
  if (salonId && salonId.error) return res.status(400).json({ error: salonId.error });
  try {
    const params = [];
    let sql = 'SELECT id, name, role, experience_years, rating, reviews_count, image_url, is_available, specialties, salon_id, location, bio, is_active, created_at FROM barbers WHERE 1=1';
    if (!includeInactive) { params.push(true); sql += ` AND is_active = $${params.length}`; }
    if (salonId && salonId.id) { params.push(salonId.id); sql += ` AND salon_id = $${params.length}`; }
    sql += ' ORDER BY id DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.get('/barbers/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'barber id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('SELECT id, name, role, experience_years, rating, reviews_count, image_url, is_available, specialties, salon_id, location, bio, is_active, created_at FROM barbers WHERE id = $1', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Barber not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/barbers', async (req, res, next) => {
  const parsed = validate(barberCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (typeof parsed.data.salonId === 'number') await ensureEntityExists(client, 'salons', parsed.data.salonId, 'Salon');
    const result = await client.query(
      `INSERT INTO barbers (name, role, experience_years, rating, reviews_count, image_url, is_available, specialties, salon_id, location, bio, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10, $11, $12)
       RETURNING id, name, role, experience_years, rating, reviews_count, image_url, is_available, specialties, salon_id, location, bio, is_active, created_at`,
      [
        parsed.data.name,
        parsed.data.role || 'Barber',
        parsed.data.experienceYears || 1,
        typeof parsed.data.rating === 'number' ? parsed.data.rating : 5,
        typeof parsed.data.reviewsCount === 'number' ? parsed.data.reviewsCount : 0,
        parsed.data.imageUrl || null,
        typeof parsed.data.isAvailable === 'boolean' ? parsed.data.isAvailable : true,
        parsed.data.specialties || [],
        typeof parsed.data.salonId === 'number' ? parsed.data.salonId : null,
        parsed.data.location || null,
        parsed.data.bio || null,
        typeof parsed.data.isActive === 'boolean' ? parsed.data.isActive : true
      ]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.patch('/barbers/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'barber id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const parsed = validate(barberUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  if (!ensureNonEmptyPatch(parsed.data)) return res.status(400).json({ error: 'At least one field is required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (typeof parsed.data.salonId === 'number') await ensureEntityExists(client, 'salons', parsed.data.salonId, 'Salon');
    const params = [];
    const fields = [];
    buildPatchSet([['name', 'name'], ['role', 'role'], ['experienceYears', 'experience_years'], ['rating', 'rating'], ['reviewsCount', 'reviews_count'], ['isAvailable', 'is_available'], ['salonId', 'salon_id'], ['location', 'location'], ['bio', 'bio'], ['isActive', 'is_active']], parsed.data, params, fields);
    if (typeof parsed.data.imageUrl !== 'undefined') { params.push(parsed.data.imageUrl || null); fields.push(`image_url = $${params.length}`); }
    if (typeof parsed.data.specialties !== 'undefined') { params.push(parsed.data.specialties); fields.push(`specialties = $${params.length}::text[]`); }
    params.push(idr.id);
    const result = await client.query(
      `UPDATE barbers SET ${fields.join(', ')} WHERE id = $${params.length}
       RETURNING id, name, role, experience_years, rating, reviews_count, image_url, is_available, specialties, salon_id, location, bio, is_active, created_at`,
      params
    );
    if (!result.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Barber not found' }); }
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.delete('/barbers/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'barber id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const barber = await client.query('SELECT id FROM barbers WHERE id = $1 FOR UPDATE', [idr.id]);
    if (!barber.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Barber not found' }); }
    await client.query('DELETE FROM bookings WHERE barber_id = $1', [idr.id]);
    await client.query('DELETE FROM barbers WHERE id = $1', [idr.id]);
    await client.query('COMMIT');
    res.json({ status: 'deleted' });
  } catch (err) { await client.query('ROLLBACK'); next(err); } finally { client.release(); }
});

router.get('/services', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, duration_minutes, price, is_active, created_at FROM services ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.get('/services/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'service id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('SELECT id, name, duration_minutes, price, is_active, created_at FROM services WHERE id = $1', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/services', async (req, res, next) => {
  const parsed = validate(serviceCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  try {
    const result = await pool.query(
      'INSERT INTO services (name, duration_minutes, price, is_active) VALUES ($1, $2, $3, $4) RETURNING id, name, duration_minutes, price, is_active, created_at',
      [parsed.data.name, parsed.data.durationMinutes, parsed.data.price, typeof parsed.data.isActive === 'boolean' ? parsed.data.isActive : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { if (handleKnownErrors(res, err)) return; next(err); }
});

router.patch('/services/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'service id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const parsed = validate(serviceUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  if (!ensureNonEmptyPatch(parsed.data)) return res.status(400).json({ error: 'At least one field is required' });
  try {
    const params = [];
    const fields = [];
    buildPatchSet([['name', 'name'], ['durationMinutes', 'duration_minutes'], ['price', 'price'], ['isActive', 'is_active']], parsed.data, params, fields);
    params.push(idr.id);
    const result = await pool.query(
      `UPDATE services SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id, name, duration_minutes, price, is_active, created_at`,
      params
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) { if (handleKnownErrors(res, err)) return; next(err); }
});

router.delete('/services/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'service id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const lock = await client.query('SELECT id FROM services WHERE id = $1 FOR UPDATE', [idr.id]);
    if (!lock.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Service not found' }); }
    const slots = await client.query('SELECT slot_id FROM bookings WHERE service_id = $1 FOR UPDATE', [idr.id]);
    const slotIds = slots.rows.map((r) => Number(r.slot_id));
    await client.query('DELETE FROM bookings WHERE service_id = $1', [idr.id]);
    if (slotIds.length) await client.query('UPDATE slots SET status = $1 WHERE id = ANY($2::int[])', ['available', slotIds]);
    await client.query('DELETE FROM services WHERE id = $1', [idr.id]);
    await client.query('COMMIT');
    res.json({ status: 'deleted' });
  } catch (err) { await client.query('ROLLBACK'); next(err); } finally { client.release(); }
});

router.get('/products', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, description, price, image_url, category, type, stock_qty, is_active, created_at FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.get('/products/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'product id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('SELECT id, name, description, price, image_url, category, type, stock_qty, is_active, created_at FROM products WHERE id = $1', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/products', async (req, res, next) => {
  const parsed = validate(productCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, image_url, category, type, stock_qty, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, description, price, image_url, category, type, stock_qty, is_active, created_at',
      [parsed.data.name, parsed.data.description, parsed.data.price, parsed.data.imageUrl || null, parsed.data.category, parsed.data.type, parsed.data.stockQty, typeof parsed.data.isActive === 'boolean' ? parsed.data.isActive : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { if (handleKnownErrors(res, err)) return; next(err); }
});

router.patch('/products/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'product id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const parsed = validate(productUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  if (!ensureNonEmptyPatch(parsed.data)) return res.status(400).json({ error: 'At least one field is required' });
  try {
    const params = [];
    const fields = [];
    buildPatchSet([['name', 'name'], ['description', 'description'], ['price', 'price'], ['category', 'category'], ['type', 'type'], ['stockQty', 'stock_qty'], ['isActive', 'is_active']], parsed.data, params, fields);
    if (typeof parsed.data.imageUrl !== 'undefined') { params.push(parsed.data.imageUrl || null); fields.push(`image_url = $${params.length}`); }
    params.push(idr.id);
    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id, name, description, price, image_url, category, type, stock_qty, is_active, created_at`,
      params
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { if (handleKnownErrors(res, err)) return; next(err); }
});

router.delete('/products/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'product id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Product not found' });
    res.json({ status: 'deleted' });
  } catch (err) { next(err); }
});

router.get('/slots', async (req, res, next) => {
  const parsed = validate(slotListQuerySchema, req.query);
  if (sendValidationError(res, parsed, 'query')) return;
  const limit = parsed.data.limit || 200;
  const offset = parsed.data.offset || 0;
  try {
    const params = [];
    let sql = 'SELECT id, barber_id, date, time, status, created_at FROM slots WHERE 1=1';
    if (parsed.data.date) { params.push(parsed.data.date); sql += ` AND date = $${params.length}`; }
    if (parsed.data.barberId) { params.push(parsed.data.barberId); sql += ` AND barber_id = $${params.length}`; }
    if (parsed.data.status) { params.push(parsed.data.status); sql += ` AND status = $${params.length}`; }
    params.push(limit); params.push(offset);
    sql += ` ORDER BY date DESC, time DESC, id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(sql, params);
    res.json({ items: result.rows, limit, offset });
  } catch (err) { next(err); }
});

router.get('/slots/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'slot id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('SELECT id, barber_id, date, time, status, created_at FROM slots WHERE id = $1', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Slot not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/slots', async (req, res, next) => {
  const parsed = validate(slotCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureEntityExists(client, 'barbers', parsed.data.barberId, 'Barber');
    const times = Array.from(new Set(parsed.data.times.map((t) => normalizeTime(t))));
    const status = parsed.data.status || 'available';
    const insertRes = await client.query(
      `INSERT INTO slots (barber_id, date, time, status)
       SELECT $1, $2, UNNEST($3::time[]), $4
       ON CONFLICT DO NOTHING
       RETURNING id, barber_id, date, time, status, created_at`,
      [parsed.data.barberId, parsed.data.date, times, status]
    );
    await client.query('COMMIT');
    res.status(201).json({ created: insertRes.rows, skipped: times.length - insertRes.rowCount });
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.patch('/slots/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'slot id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const parsed = validate(slotUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  if (!ensureNonEmptyPatch(parsed.data)) return res.status(400).json({ error: 'At least one field is required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const slotRes = await client.query('SELECT id, status, barber_id, date, time FROM slots WHERE id = $1 FOR UPDATE', [idr.id]);
    if (!slotRes.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Slot not found' }); }
    const slot = slotRes.rows[0];
    if (slot.status === 'booked') {
      const onlyBookedNoop = Object.keys(parsed.data).length === 1 && parsed.data.status === 'booked';
      if (!onlyBookedNoop) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Cannot modify a booked slot directly' });
      }
    }
    if (typeof parsed.data.barberId === 'number') await ensureEntityExists(client, 'barbers', parsed.data.barberId, 'Barber');
    const next = {
      barberId: typeof parsed.data.barberId === 'number' ? parsed.data.barberId : Number(slot.barber_id),
      date: typeof parsed.data.date === 'string' ? parsed.data.date : String(slot.date).slice(0, 10),
      time: typeof parsed.data.time === 'string' ? normalizeTime(parsed.data.time) : normalizeTime(slot.time),
      status: typeof parsed.data.status === 'string' ? parsed.data.status : slot.status
    };
    const result = await client.query(
      `UPDATE slots SET barber_id = $2, date = $3, time = $4, status = $5 WHERE id = $1 RETURNING id, barber_id, date, time, status, created_at`,
      [idr.id, next.barberId, next.date, next.time, next.status]
    );
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.delete('/slots/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'slot id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const slotRes = await client.query('SELECT id FROM slots WHERE id = $1 FOR UPDATE', [idr.id]);
    if (!slotRes.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Slot not found' }); }
    await client.query('DELETE FROM bookings WHERE slot_id = $1', [idr.id]);
    await client.query('DELETE FROM slots WHERE id = $1', [idr.id]);
    await client.query('COMMIT');
    res.json({ status: 'deleted' });
  } catch (err) { await client.query('ROLLBACK'); next(err); } finally { client.release(); }
});

router.get('/bookings', async (req, res, next) => {
  const parsed = validate(bookingListQuerySchema, req.query);
  if (sendValidationError(res, parsed, 'query')) return;
  const limit = parsed.data.limit || 200;
  const offset = parsed.data.offset || 0;
  try {
    const params = [];
    let sql = `
      SELECT b.id, b.user_id, b.client_name, b.client_phone, b.service_id, s.name AS service_name, b.barber_id, br.name AS barber_name, b.slot_id, b.date, b.time, b.created_at
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      JOIN barbers br ON br.id = b.barber_id
      WHERE 1=1
    `;
    if (parsed.data.date) { params.push(parsed.data.date); sql += ` AND b.date = $${params.length}`; }
    if (parsed.data.barberId) { params.push(parsed.data.barberId); sql += ` AND b.barber_id = $${params.length}`; }
    if (parsed.data.userId) { params.push(parsed.data.userId); sql += ` AND b.user_id = $${params.length}`; }
    params.push(limit); params.push(offset);
    sql += ` ORDER BY b.date DESC, b.time DESC, b.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(sql, params);
    res.json({ items: result.rows, limit, offset });
  } catch (err) { next(err); }
});

router.get('/bookings/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'booking id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query(
      `SELECT b.id, b.user_id, b.client_name, b.client_phone, b.service_id, s.name AS service_name, b.barber_id, br.name AS barber_name, b.slot_id, b.date, b.time, b.created_at
       FROM bookings b JOIN services s ON s.id = b.service_id JOIN barbers br ON br.id = b.barber_id WHERE b.id = $1`,
      [idr.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/bookings', async (req, res, next) => {
  const parsed = validate(bookingCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const booking = await createBookingTx(client, parsed.data);
    await client.query('COMMIT');
    res.status(201).json(booking);
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.patch('/bookings/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'booking id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const parsed = validate(bookingUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  if (!ensureNonEmptyPatch(parsed.data)) return res.status(400).json({ error: 'At least one field is required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const booking = await updateBookingTx(client, idr.id, parsed.data);
    await client.query('COMMIT');
    res.json(booking);
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.delete('/bookings/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'booking id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await deleteBookingTx(client, idr.id);
    await client.query('COMMIT');
    res.json({ status: 'deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.get('/reviews', async (req, res, next) => {
  const parsed = validate(reviewListQuerySchema, req.query);
  if (sendValidationError(res, parsed, 'query')) return;
  const limit = parsed.data.limit || 200;
  const offset = parsed.data.offset || 0;
  try {
    const params = [];
    let sql = 'SELECT id, barber_id, user_id, author_name, rating, comment, created_at FROM reviews WHERE 1=1';
    if (parsed.data.barberId) { params.push(parsed.data.barberId); sql += ` AND barber_id = $${params.length}`; }
    if (parsed.data.userId) { params.push(parsed.data.userId); sql += ` AND user_id = $${params.length}`; }
    params.push(limit); params.push(offset);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(sql, params);
    res.json({ items: result.rows, limit, offset });
  } catch (err) { next(err); }
});

router.get('/reviews/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'review id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  try {
    const result = await pool.query('SELECT id, barber_id, user_id, author_name, rating, comment, created_at FROM reviews WHERE id = $1', [idr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Review not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/reviews', async (req, res, next) => {
  const parsed = validate(reviewCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureEntityExists(client, 'barbers', parsed.data.barberId, 'Barber');
    let userId = null;
    let authorName = '';
    if (typeof parsed.data.userId === 'number') {
      const user = await getUserById(client, parsed.data.userId);
      userId = user.id;
      authorName = user.full_name;
    } else {
      authorName = String(parsed.data.authorName || '').trim();
      if (!authorName) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'authorName is required when userId is not provided' });
      }
    }
    const result = await client.query(
      'INSERT INTO reviews (barber_id, user_id, author_name, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING id, barber_id, user_id, author_name, rating, comment, created_at',
      [parsed.data.barberId, userId, authorName, parsed.data.rating, parsed.data.comment]
    );
    await recalcBarberStats(client, parsed.data.barberId);
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.patch('/reviews/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'review id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const parsed = validate(reviewUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  if (!ensureNonEmptyPatch(parsed.data)) return res.status(400).json({ error: 'At least one field is required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingRes = await client.query('SELECT id, barber_id, user_id, author_name, rating, comment FROM reviews WHERE id = $1 FOR UPDATE', [idr.id]);
    if (!existingRes.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Review not found' }); }
    const existing = existingRes.rows[0];
    const nextBarberId = typeof parsed.data.barberId === 'number' ? parsed.data.barberId : Number(existing.barber_id);
    await ensureEntityExists(client, 'barbers', nextBarberId, 'Barber');
    let nextUserId = existing.user_id;
    let nextAuthorName = existing.author_name;
    if (typeof parsed.data.userId === 'number') {
      const user = await getUserById(client, parsed.data.userId);
      nextUserId = user.id;
      nextAuthorName = user.full_name;
    } else if (parsed.data.userId === null) {
      nextUserId = null;
      if (!parsed.data.authorName || !parsed.data.authorName.trim()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'authorName is required when userId is null' });
      }
      nextAuthorName = parsed.data.authorName.trim();
    } else if (typeof parsed.data.authorName === 'string') {
      nextAuthorName = parsed.data.authorName.trim();
    }
    const nextRating = typeof parsed.data.rating === 'number' ? parsed.data.rating : Number(existing.rating);
    const nextComment = typeof parsed.data.comment === 'string' ? parsed.data.comment : existing.comment;
    const result = await client.query(
      'UPDATE reviews SET barber_id = $2, user_id = $3, author_name = $4, rating = $5, comment = $6 WHERE id = $1 RETURNING id, barber_id, user_id, author_name, rating, comment, created_at',
      [idr.id, nextBarberId, nextUserId, nextAuthorName, nextRating, nextComment]
    );
    await recalcBarberStats(client, Number(existing.barber_id));
    if (Number(existing.barber_id) !== Number(nextBarberId)) await recalcBarberStats(client, nextBarberId);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.delete('/reviews/:id', async (req, res, next) => {
  const idr = parseId(req.params.id, 'review id');
  if (idr.error) return res.status(400).json({ error: idr.error });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingRes = await client.query('SELECT id, barber_id FROM reviews WHERE id = $1 FOR UPDATE', [idr.id]);
    if (!existingRes.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Review not found' }); }
    const barberId = Number(existingRes.rows[0].barber_id);
    await client.query('DELETE FROM reviews WHERE id = $1', [idr.id]);
    await recalcBarberStats(client, barberId);
    await client.query('COMMIT');
    res.json({ status: 'deleted' });
  } catch (err) { await client.query('ROLLBACK'); next(err); } finally { client.release(); }
});

router.get('/cart-items', async (req, res, next) => {
  const parsed = validate(cartItemListQuerySchema, req.query);
  if (sendValidationError(res, parsed, 'query')) return;
  const limit = parsed.data.limit || 200;
  const offset = parsed.data.offset || 0;
  try {
    const params = [];
    let sql = `
      SELECT ci.user_id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at, u.full_name AS user_full_name, p.name AS product_name
      FROM cart_items ci
      JOIN users u ON u.id = ci.user_id
      JOIN products p ON p.id = ci.product_id
      WHERE 1=1
    `;
    if (parsed.data.userId) { params.push(parsed.data.userId); sql += ` AND ci.user_id = $${params.length}`; }
    if (parsed.data.productId) { params.push(parsed.data.productId); sql += ` AND ci.product_id = $${params.length}`; }
    params.push(limit); params.push(offset);
    sql += ` ORDER BY ci.updated_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(sql, params);
    res.json({ items: result.rows, limit, offset });
  } catch (err) { next(err); }
});

router.get('/cart-items/:userId/:productId', async (req, res, next) => {
  const ur = parseId(req.params.userId, 'user id');
  const pr = parseId(req.params.productId, 'product id');
  if (ur.error) return res.status(400).json({ error: ur.error });
  if (pr.error) return res.status(400).json({ error: pr.error });
  try {
    const result = await pool.query('SELECT user_id, product_id, quantity, created_at, updated_at FROM cart_items WHERE user_id = $1 AND product_id = $2', [ur.id, pr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Cart item not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/cart-items', async (req, res, next) => {
  const parsed = validate(cartItemCreateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureEntityExists(client, 'users', parsed.data.userId, 'User');
    await ensureEntityExists(client, 'products', parsed.data.productId, 'Product');
    const result = await client.query(
      'INSERT INTO cart_items (user_id, product_id, quantity, updated_at) VALUES ($1, $2, $3, NOW()) RETURNING user_id, product_id, quantity, created_at, updated_at',
      [parsed.data.userId, parsed.data.productId, parsed.data.quantity]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (handleKnownErrors(res, err)) return;
    next(err);
  } finally { client.release(); }
});

router.patch('/cart-items/:userId/:productId', async (req, res, next) => {
  const ur = parseId(req.params.userId, 'user id');
  const pr = parseId(req.params.productId, 'product id');
  if (ur.error) return res.status(400).json({ error: ur.error });
  if (pr.error) return res.status(400).json({ error: pr.error });
  const parsed = validate(cartItemUpdateSchema, req.body);
  if (sendValidationError(res, parsed)) return;
  try {
    const result = await pool.query(
      'UPDATE cart_items SET quantity = $3, updated_at = NOW() WHERE user_id = $1 AND product_id = $2 RETURNING user_id, product_id, quantity, created_at, updated_at',
      [ur.id, pr.id, parsed.data.quantity]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Cart item not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/cart-items/:userId/:productId', async (req, res, next) => {
  const ur = parseId(req.params.userId, 'user id');
  const pr = parseId(req.params.productId, 'product id');
  if (ur.error) return res.status(400).json({ error: ur.error });
  if (pr.error) return res.status(400).json({ error: pr.error });
  try {
    const result = await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 RETURNING user_id', [ur.id, pr.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ status: 'deleted' });
  } catch (err) { next(err); }
});

module.exports = router;

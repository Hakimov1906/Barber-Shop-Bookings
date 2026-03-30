const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const phoneRegex = /^\+?[0-9]{7,20}$/;

function normalizeFullName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizePhone(value) {
  const raw = String(value || '').trim();
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return hasPlus ? `+${digits}` : digits;
}

function normalizeRegisterPayload(payload = {}) {
  return {
    ...payload,
    fullName: normalizeFullName(payload.fullName),
    email: normalizeEmail(payload.email),
    phone: normalizePhone(payload.phone)
  };
}

function normalizeUserLoginPayload(payload = {}) {
  return {
    ...payload,
    email: normalizeEmail(payload.email)
  };
}

function normalizeUserProfileUpdatePayload(payload = {}) {
  const normalized = { ...payload };

  if (typeof payload.fullName !== 'undefined') {
    normalized.fullName = normalizeFullName(payload.fullName);
  }
  if (typeof payload.email !== 'undefined') {
    normalized.email = normalizeEmail(payload.email);
  }
  if (typeof payload.phone !== 'undefined') {
    normalized.phone = normalizePhone(payload.phone);
  }

  return normalized;
}

function isValidDateString(value) {
  if (!dateRegex.test(value)) {
    return false;
  }

  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

const dateStringSchema = z
  .string()
  .regex(dateRegex, 'Invalid date format')
  .refine(isValidDateString, 'Invalid date value');

const timeStringSchema = z.string().regex(timeRegex, 'Invalid time format');

const bookingSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  barberId: z.coerce.number().int().positive(),
  date: dateStringSchema,
  time: timeStringSchema
});

const reviewCreateSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1000)
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  password: z.string().min(6)
});

const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const userProfileUpdateSchema = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(phoneRegex, 'Invalid phone number').optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });

const slotCreateSchema = z.object({
  barberId: z.coerce.number().int().positive(),
  date: dateStringSchema,
  times: z.array(timeStringSchema).min(1),
  status: z.enum(['available', 'blocked']).optional()
});

const slotQuerySchema = z.object({
  date: dateStringSchema,
  barberId: z.coerce.number().int().positive().optional(),
  status: z.enum(['available', 'booked', 'blocked']).optional()
});

const bookingsQuerySchema = z.object({
  date: dateStringSchema.optional(),
  barberId: z.coerce.number().int().positive().optional()
});

const usersQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional()
});

const productsQuerySchema = z.object({
  category: z.enum(['men', 'women', 'unisex']).optional(),
  type: z.string().min(1).max(60).optional()
});

const barbersQuerySchema = z.object({
  salonId: z.coerce.number().int().positive().optional()
});

const salonCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]{1,49}$/, 'Invalid salon code');

const salonCreateSchema = z.object({
  code: salonCodeSchema,
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(240),
  workHours: z.string().trim().min(5).max(60),
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isActive: z.coerce.boolean().optional()
});

const salonUpdateSchema = z
  .object({
    code: salonCodeSchema.optional(),
    name: z.string().trim().min(2).max(120).optional(),
    address: z.string().trim().min(3).max(240).optional(),
    workHours: z.string().trim().min(5).max(60).optional(),
    latitude: z.coerce.number().gte(-90).lte(90).optional(),
    longitude: z.coerce.number().gte(-180).lte(180).optional(),
    sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
    isActive: z.coerce.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });

const salonsAdminQuerySchema = z.object({
  includeInactive: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return false;
    })
});

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data };
  }
  return { error: result.error.flatten() };
}

module.exports = {
  bookingSchema,
  loginSchema,
  registerSchema,
  userLoginSchema,
  userProfileUpdateSchema,
  slotCreateSchema,
  slotQuerySchema,
  bookingsQuerySchema,
  usersQuerySchema,
  productsQuerySchema,
  barbersQuerySchema,
  salonCreateSchema,
  salonUpdateSchema,
  salonsAdminQuerySchema,
  reviewCreateSchema,
  normalizeFullName,
  normalizeEmail,
  normalizePhone,
  normalizeRegisterPayload,
  normalizeUserLoginPayload,
  normalizeUserProfileUpdatePayload,
  validate
};

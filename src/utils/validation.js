const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const phoneRegex = /^[0-9+()\-\s]{7,20}$/;

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
  slotCreateSchema,
  slotQuerySchema,
  bookingsQuerySchema,
  usersQuerySchema,
  productsQuerySchema,
  validate
};

const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;
const phoneRegex = /^[0-9+()\-\s]{7,20}$/;

const bookingSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  barberId: z.coerce.number().int().positive(),
  date: z.string().regex(dateRegex, 'Invalid date format'),
  time: z.string().regex(timeRegex, 'Invalid time format')
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
  date: z.string().regex(dateRegex, 'Invalid date format'),
  times: z.array(z.string().regex(timeRegex, 'Invalid time format')).min(1),
  status: z.enum(['available', 'blocked']).optional()
});

const slotQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date format'),
  barberId: z.coerce.number().int().positive().optional(),
  status: z.enum(['available', 'booked', 'blocked']).optional()
});

const bookingsQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date format').optional(),
  barberId: z.coerce.number().int().positive().optional()
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
  validate
};

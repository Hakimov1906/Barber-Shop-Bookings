# Barbershop Booking API

Express + PostgreSQL backend for:

1. Public catalog (`barbers`, `services`, `products`)
2. User auth and booking
3. Admin auth and booking/slot management

## Local Start

```powershell
npm install
Copy-Item .env.example .env
```

Recommended `.env` for local development:

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barbershop
PGSSL=false

JWT_SECRET=12345678901234567890
JWT_TTL=12h
MAX_ACTIVE_BOOKINGS_PER_USER=2

AUTH_LOGIN_RATE_LIMIT_WINDOW_MS=900000
AUTH_LOGIN_RATE_LIMIT_MAX=10
ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS=900000
ADMIN_LOGIN_RATE_LIMIT_MAX=5

LOG_LEVEL=info
```

Then run:

```powershell
npm run migrate:up
npm run seed:refresh
npm run dev
```

API URL: `http://localhost:4000`
Swagger: `http://localhost:4000/api/docs`

## Database

Migrations are the source of truth.

1. Apply migrations: `npm run migrate:up`
2. Rollback one migration: `npm run migrate:down`
3. Create migration file: `npm run migrate:create -- <name>`
4. Refresh demo data: `npm run seed:refresh`

Notes:

1. `db/schema.sql` is a schema snapshot/bootstrap reference.
2. `bookings.slot_id` is unique at DB level (one slot cannot be booked twice).

## Health and Readiness

1. `GET /api/health` - liveness
2. `GET /api/ready` - readiness (`SELECT 1` to DB)

Use `/api/ready` for deploy checks.

## Security

1. Login rate limiting is enabled on:
   `POST /api/auth/login`, `POST /api/admin/login`
2. JWT rotation is supported via:
   `JWT_SECRETS` or `JWT_SECRET_CURRENT` + `JWT_SECRET_PREVIOUS`
3. Booking limit is configurable via `MAX_ACTIVE_BOOKINGS_PER_USER` (default: `2`).

## Logging

Structured JSON logs with request metadata and request id.

## Tests

```powershell
npm run test:smoke
npm run test:integration
npm test
```

## Endpoints

Public:

1. `GET /api/health`
2. `GET /api/ready`
3. `GET /api/barbers`
4. `GET /api/barbers/:id/reviews`
5. `GET /api/services`
6. `GET /api/products`
7. `GET /api/slots`
8. `POST /api/auth/register`
9. `POST /api/auth/login`
10. `POST /api/bookings` (user bearer token)

Admin:

1. `POST /api/admin/login` (`phone` + `password`)
2. `GET /api/admin/bookings`
3. `DELETE /api/admin/bookings/:id`
4. `GET /api/admin/slots`
5. `POST /api/admin/slots`
6. `DELETE /api/admin/slots/:id`
7. `GET /api/admin/users`

Admin accounts are now stored in the `admins` table. The first admin should be created manually in SQL, for example:

```sql
INSERT INTO admins (full_name, phone, password_hash)
VALUES (
  'Super Admin',
  '+996700000001',
  '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);
```

## Demo Data from Seed

After `npm run seed:refresh`:

1. Demo users are inserted
2. Barbers/services/products/reviews are inserted
3. Available slots are generated for active barbers for the next 14 days

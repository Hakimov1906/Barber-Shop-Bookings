# Manual Testing Checklist

## Environment

1. Base URL is set (`http://localhost:4000` or Render URL)
2. `/api/health` returns `200`
3. `/api/ready` returns `200`
4. DB has seed data (barbers/services/slots)

## Public API

1. `GET /api/barbers` returns non-empty list
2. `GET /api/services` returns non-empty list
3. `GET /api/products` returns non-empty list
4. `GET /api/slots` with valid date returns available slots
5. `GET /api/barbers/:id/reviews` returns list (can be empty)

## User Auth

1. Register new user -> `201`
2. Login with created user -> `200` + token
3. Login with wrong password -> `401`
4. Duplicate register (same phone) -> `409`

## Booking Flow

1. Create booking with user token -> `201`
2. Rebook same slot -> `409`
3. Slot disappears from public available slots after booking
4. Booking request without token -> `401`

## Admin Auth

1. Admin login with correct creds -> `200` + token
2. Admin login with wrong creds -> `401`
3. Repeated wrong admin login eventually -> `429` (rate limit)

## Admin Operations

1. `GET /api/admin/bookings` with admin token -> `200`
2. `GET /api/admin/users` with admin token -> `200`
3. `POST /api/admin/slots` creates slots -> `201`
4. `DELETE /api/admin/bookings/:id` -> `200` and slot returns to `available`
5. `DELETE /api/admin/slots/:id` for free slot -> `200`
6. `DELETE` non-existing booking/slot -> `404`

## Authorization

1. User token on admin endpoint -> `403`
2. Missing auth header on admin endpoint -> `401`

## Deployment Checks

1. Frontend origin is allowed by CORS (`access-control-allow-origin` header exists)
2. Swagger opens at `/api/docs`
3. No 5xx errors in basic smoke run

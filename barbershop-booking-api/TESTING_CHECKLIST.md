**Manual Test Checklist**

**Base URL**
`https://barbershop-booking-api.onrender.com`

**Preconditions**
1. The service is deployed and `/api/health` returns `200`.
2. Database has at least 1 barber and 1 service.
3. Admin credentials are available from Render env vars.

**Data Formats**
1. Date: `YYYY-MM-DD`
2. Time: `HH:MM` (24h)
3. Phone: 7–20 chars, digits and `+() -` allowed

**Checklist**
1. Open `/api/health` and confirm `200`.
2. Open `/api/barbers` and confirm list is not empty.
3. Open `/api/services` and confirm list is not empty.
4. Register a new user at `/api/auth/register`.
5. Login at `/api/auth/login` and copy `token` as `USER_TOKEN`.
6. Admin login at `/api/admin/login` and copy `token` as `ADMIN_TOKEN`.
7. Create slots via `/api/admin/slots` for a future date.
8. Check `/api/slots` and confirm created times are visible.
9. Create booking via `/api/bookings` with `USER_TOKEN`.
10. Check `/api/slots` and confirm booked time is gone.
11. List bookings via `/api/admin/bookings` with `ADMIN_TOKEN`.
12. Delete booking via `/api/admin/bookings/:id`.
13. Check `/api/slots` and confirm time returns to available.

**Negative Checks**
1. `POST /api/bookings` without token returns `401`.
2. `GET /api/admin/bookings` with user token returns `403`.
3. Invalid `date` or `time` returns `400`.
4. Duplicate user register returns `409`.
5. Booking an occupied slot returns `409`.
6. Deleting nonexistent booking or slot returns `404`.

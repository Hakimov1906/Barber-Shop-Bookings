**Barbershop Booking API — Test Guide**

**Base URL**
`https://barbershop-booking-api.onrender.com`

**Preconditions**
1. The service is deployed and `/api/health` responds `200`.
2. Database has at least 1 barber and 1 service.
If `/api/barbers` or `/api/services` returns an empty array, ask the developer to seed demo data.
3. Admin credentials are available in Render env vars: `ADMIN_USER`, `ADMIN_PASSWORD`, `JWT_SECRET`.

**Formats**
1. Date: `YYYY-MM-DD`
2. Time: `HH:MM` (24h)
3. Phone: 7–20 characters, digits and `+() -` allowed

**Smoke Test**
```bash
curl -i https://barbershop-booking-api.onrender.com/api/health
curl -i https://barbershop-booking-api.onrender.com/api/barbers
curl -i https://barbershop-booking-api.onrender.com/api/services
```

**User Auth**
1. Register user
```bash
curl -i -X POST https://barbershop-booking-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test.user+1@example.com",
    "phone": "+996700000001",
    "password": "password123"
  }'
```
Expected: `201` with user object.

2. Login user
```bash
curl -i -X POST https://barbershop-booking-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user+1@example.com",
    "password": "password123"
  }'
```
Expected: `200` with `token`. Save as `USER_TOKEN`.

**Admin Auth**
```bash
curl -i -X POST https://barbershop-booking-api.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "<ADMIN_USER>",
    "password": "<ADMIN_PASSWORD>"
  }'
```
Expected: `200` with `token`. Save as `ADMIN_TOKEN`.

**Create Slots (Admin)**
```bash
curl -i -X POST https://barbershop-booking-api.onrender.com/api/admin/slots \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "barberId": 1,
    "date": "2026-03-20",
    "times": ["10:00", "10:30", "11:00"],
    "status": "available"
  }'
```
Expected: `201` with `created` and `skipped`.

**Check Available Slots (Public)**
```bash
curl -i "https://barbershop-booking-api.onrender.com/api/slots?date=2026-03-20&barberId=1"
```
Expected: `200` with available slots.

**Create Booking (User)**
```bash
curl -i -X POST https://barbershop-booking-api.onrender.com/api/bookings \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "barberId": 1,
    "date": "2026-03-20",
    "time": "10:30"
  }'
```
Expected: `201` with booking `id` and `createdAt`.

**Verify Slot Is Gone**
```bash
curl -i "https://barbershop-booking-api.onrender.com/api/slots?date=2026-03-20&barberId=1"
```
Expected: booked time is not present.

**List Bookings (Admin)**
```bash
curl -i "https://barbershop-booking-api.onrender.com/api/admin/bookings?date=2026-03-20&barberId=1" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
Expected: list with service and barber names.

**Delete Booking (Admin)**
```bash
curl -i -X DELETE https://barbershop-booking-api.onrender.com/api/admin/bookings/<BOOKING_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
Expected: `200 {"status":"deleted"}` and the slot becomes `available` again.

**Delete Slot (Admin)**
```bash
curl -i -X DELETE https://barbershop-booking-api.onrender.com/api/admin/slots/<SLOT_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
Expected: `200 {"status":"deleted"}` unless slot is booked, then `409`.

**Negative Checks**
1. `POST /api/bookings` without token returns `401`.
2. User token on `/api/admin/*` returns `403`.
3. Invalid date/time formats return `400`.
4. Duplicate register (email/phone) returns `409`.
5. Booking an occupied slot returns `409`.
6. Deleting nonexistent booking/slot returns `404`.

**PowerShell Commands (Windows)**

Smoke:
```powershell
Invoke-RestMethod https://barbershop-booking-api.onrender.com/api/health
Invoke-RestMethod https://barbershop-booking-api.onrender.com/api/barbers
Invoke-RestMethod https://barbershop-booking-api.onrender.com/api/services
```

Register user:
```powershell
$body = @{
  fullName = "Test User"
  email = "test.user+1@example.com"
  phone = "+996700000001"
  password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri https://barbershop-booking-api.onrender.com/api/auth/register `
  -ContentType "application/json" `
  -Body $body
```

Login user:
```powershell
$body = @{
  email = "test.user+1@example.com"
  password = "password123"
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post `
  -Uri https://barbershop-booking-api.onrender.com/api/auth/login `
  -ContentType "application/json" `
  -Body $body

$USER_TOKEN = $login.token
```

Admin login:
```powershell
$body = @{
  username = "<ADMIN_USER>"
  password = "<ADMIN_PASSWORD>"
} | ConvertTo-Json

$adminLogin = Invoke-RestMethod -Method Post `
  -Uri https://barbershop-booking-api.onrender.com/api/admin/login `
  -ContentType "application/json" `
  -Body $body

$ADMIN_TOKEN = $adminLogin.token
```

Create slots (admin):
```powershell
$body = @{
  barberId = 1
  date = "2026-03-20"
  times = @("10:00","10:30","11:00")
  status = "available"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri https://barbershop-booking-api.onrender.com/api/admin/slots `
  -Headers @{ Authorization = "Bearer $ADMIN_TOKEN" } `
  -ContentType "application/json" `
  -Body $body
```

Check slots (public):
```powershell
Invoke-RestMethod "https://barbershop-booking-api.onrender.com/api/slots?date=2026-03-20&barberId=1"
```

Create booking (user):
```powershell
$body = @{
  serviceId = 1
  barberId = 1
  date = "2026-03-20"
  time = "10:30"
} | ConvertTo-Json

$booking = Invoke-RestMethod -Method Post `
  -Uri https://barbershop-booking-api.onrender.com/api/bookings `
  -Headers @{ Authorization = "Bearer $USER_TOKEN" } `
  -ContentType "application/json" `
  -Body $body

$BOOKING_ID = $booking.id
```

List bookings (admin):
```powershell
Invoke-RestMethod `
  -Uri "https://barbershop-booking-api.onrender.com/api/admin/bookings?date=2026-03-20&barberId=1" `
  -Headers @{ Authorization = "Bearer $ADMIN_TOKEN" }
```

Delete booking (admin):
```powershell
Invoke-RestMethod -Method Delete `
  -Uri "https://barbershop-booking-api.onrender.com/api/admin/bookings/$BOOKING_ID" `
  -Headers @{ Authorization = "Bearer $ADMIN_TOKEN" }
```

Delete slot (admin):
```powershell
$SLOT_ID = 1 # replace with a real slot id
Invoke-RestMethod -Method Delete `
  -Uri "https://barbershop-booking-api.onrender.com/api/admin/slots/$SLOT_ID" `
  -Headers @{ Authorization = "Bearer $ADMIN_TOKEN" }
```

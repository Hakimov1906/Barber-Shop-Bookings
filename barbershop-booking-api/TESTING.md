# Barbershop Booking API - Manual Test Guide

## Base URL

Set once in PowerShell:

```powershell
$base = "https://test-4p5l.onrender.com"
```

For local testing use:

```powershell
$base = "http://localhost:4000"
```

## Preconditions

1. Service is deployed and reachable
2. Database is connected
3. Demo data exists (barbers + services + slots)
4. At least one admin exists in DB table `admins`

## Data Formats

1. Date: `YYYY-MM-DD`
2. Time: `HH:MM` (24h)
3. Phone: `+996XXXXXXXXX`

## Smoke Checks

```powershell
Invoke-RestMethod "$base/api/health"
Invoke-RestMethod "$base/api/ready"
(Invoke-RestMethod "$base/api/barbers").Count
(Invoke-RestMethod "$base/api/services").Count
```

Expected:

1. `/api/health` -> `status = ok`
2. `/api/ready` -> `status = ready`
3. Barbers count > 0
4. Services count > 0

## End-to-End User Booking Flow

```powershell
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$phone = ("+996555$stamp").Substring(0,13)
$password = "password123"

$barberId = (Invoke-RestMethod "$base/api/barbers")[0].id
$serviceId = (Invoke-RestMethod "$base/api/services")[0].id
$date = (Get-Date).ToString("yyyy-MM-dd")
$time = ([string](Invoke-RestMethod "$base/api/slots?date=$date&barberId=$barberId")[0].time).Substring(0,5)

$registerBody = @{
  fullName = "QA User $stamp"
  phone = $phone
  password = $password
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "$base/api/auth/register" `
  -ContentType "application/json" `
  -Body $registerBody

$loginBody = @{
  phone = $phone
  password = $password
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post `
  -Uri "$base/api/auth/login" `
  -ContentType "application/json" `
  -Body $loginBody

$userToken = $login.token

$bookingBody = @{
  serviceId = $serviceId
  barberId = $barberId
  date = $date
  time = $time
} | ConvertTo-Json

$booking = Invoke-RestMethod -Method Post `
  -Uri "$base/api/bookings" `
  -Headers @{ Authorization = "Bearer $userToken" } `
  -ContentType "application/json" `
  -Body $bookingBody

$booking
```

Expected:

1. Register -> `201`
2. Login -> `200` + token
3. Create booking -> `201` + booking id

## Duplicate Slot Protection (Must Return 409)

```powershell
try {
  Invoke-RestMethod -Method Post `
    -Uri "$base/api/bookings" `
    -Headers @{ Authorization = "Bearer $userToken" } `
    -ContentType "application/json" `
    -Body $bookingBody
} catch {
  "Expected conflict status: " + $_.Exception.Response.StatusCode.value__
}
```

Expected: `409`

## Active Booking Limit (2 Future Bookings Per User)

Create two future bookings for the same user with different times, then try a third one:

Expected on third request:

1. Status `409`
2. Error contains `Maximum 2 active bookings per user reached`
3. After cancelling one of existing future bookings, the next create request succeeds with `201`

## Admin Flow

```powershell
$adminBody = @{
  phone = "+996700000001"
  password = "admin_password_123"
} | ConvertTo-Json

$adminLogin = Invoke-RestMethod -Method Post `
  -Uri "$base/api/admin/login" `
  -ContentType "application/json" `
  -Body $adminBody

$adminToken = $adminLogin.token

$bookings = Invoke-RestMethod `
  -Uri "$base/api/admin/bookings?date=$date" `
  -Headers @{ Authorization = "Bearer $adminToken" }

$bookings
```

Expected:

1. Admin login -> `200`
2. Bookings list includes created booking

Delete booking:

```powershell
$bookingId = $bookings[0].id
Invoke-RestMethod -Method Delete `
  -Uri "$base/api/admin/bookings/$bookingId" `
  -Headers @{ Authorization = "Bearer $adminToken" }
```

Expected: `{"status":"deleted"}`

## Negative Checks

1. `POST /api/bookings` without token -> `401`
2. User token on `/api/admin/*` -> `403`
3. Invalid `date` or `time` -> `400`
4. Duplicate register by phone -> `409`
5. Booking already occupied slot -> `409`
6. Delete non-existing booking/slot -> `404`

## CORS Check

```powershell
curl.exe -si `
  -H "Origin: https://barber-shop-bookings-shared.vercel.app" `
  "$base/api/health"
```

Expected header:

`access-control-allow-origin: https://barber-shop-bookings-shared.vercel.app`

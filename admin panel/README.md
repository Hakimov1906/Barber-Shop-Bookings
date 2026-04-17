# HairLine Admin Panel

Separate frontend app for administering `barbershop-booking-api`.

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

## Environment

- `VITE_API_BASE_URL` - backend base URL (example: `https://test-4p5l.onrender.com`)

## Features

- Admin login by `phone + password` via `POST /api/admin/login`
- Full CRUD access for:
  - `admins`
  - `users`
  - `salons`
  - `barbers`
  - `services`
  - `products`
  - `slots`
  - `bookings`
  - `reviews`
  - `cart_items`
- Route guard with token persistence in `localStorage`
- Generic JSON-based create/patch forms and list filtering via query params

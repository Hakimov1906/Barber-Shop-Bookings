# Barber Shop Bookings (Frontend + Backend)

Monorepo with:

1. Frontend in root (`Vite + React + TypeScript`)
2. Backend in `barbershop-booking-api/` (`Express + PostgreSQL`)

## Project Structure

1. `src/` - frontend app code
2. `public/` - static frontend assets
3. `barbershop-booking-api/src/` - backend API code
4. `barbershop-booking-api/db/` - migrations, schema snapshot, and seed SQL
5. `barbershop-booking-api/tests/` - backend smoke and integration tests

## Local Run (Full Stack)

### One-command PowerShell launcher (Windows)

From repo root:

```powershell
npm run local:up
```

This command:

1. starts local Postgres in Docker (`barbershop-postgres-local`)
2. prepares `.env` files
3. runs backend migrations (+ seed)
4. generates frontend API types
5. starts backend and frontend

Useful variants:

```powershell
npm run local:up:detached   # start both apps in separate terminals
npm run local:down          # stop/remove local Postgres container
```

## 1) Start local Postgres (Docker, PowerShell)

```powershell
docker rm -f barbershop-postgres-local 2>$null
docker run --name barbershop-postgres-local `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=barbershop `
  -p 5432:5432 -d postgres:15
```

## 2) Run backend

```powershell
cd .\barbershop-booking-api
npm install
Copy-Item .env.example .env
```

Set `barbershop-booking-api/.env`:

```env
PORT=4000
CORS_ORIGIN=http://localhost:8080,https://barber-shop-bookings-shared.vercel.app
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barbershop
PGSSL=false
ADMIN_USER=admin_user
ADMIN_PASSWORD=admin_password
JWT_SECRET=12345678901234567890
JWT_TTL=12h
```

Then:

```powershell
npm run migrate:up
npm run seed:refresh
npm run dev
```

Backend: `http://localhost:4000`
Swagger: `http://localhost:4000/api/docs`

## 3) Run frontend

In repo root:

```powershell
cd ..
npm install --legacy-peer-deps
Copy-Item .env.example .env
```

Set root `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_MOCK_MODE=false
```

Then:

```powershell
npm run api:types
npm run dev
```

Frontend: `http://localhost:8080`

## Frontend Only (No Backend)

If you want UI only:

```env
VITE_MOCK_MODE=true
VITE_API_BASE_URL=http://localhost:4000
```

## API Contract

OpenAPI source: `barbershop-booking-api/src/docs/openapi.json`

Generate typed API client:

```powershell
npm run api:types
```

Generated file: `src/api/generated/openapi.ts`

## Production URLs (Current)

1. Frontend: `https://barber-shop-bookings-shared.vercel.app`
2. Backend: `https://test-4p5l.onrender.com`
3. Swagger: `https://test-4p5l.onrender.com/api/docs`

## Quick Health Checks

```powershell
$base = "https://test-4p5l.onrender.com"
Invoke-RestMethod "$base/api/health"
Invoke-RestMethod "$base/api/ready"
Invoke-RestMethod "$base/api/barbers"
Invoke-RestMethod "$base/api/services"
```

## Common Issues

1. CORS error in browser:
Set backend `CORS_ORIGIN` to your frontend URL and redeploy backend.
2. Port 4000 is busy:
Stop process on that port before `npm run dev`.
3. Backend starts but `/api/ready` fails:
Check `DATABASE_URL`, `PGSSL`, and DB availability.

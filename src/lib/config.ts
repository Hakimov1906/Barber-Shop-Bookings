const PROD_API_BASE_URL = "https://barbershop-booking-api.onrender.com"; // Render.com API

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isLocalhostBaseUrl(value: string) {
  return /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(value);
}

function resolveApiBaseUrl() {
  const envValue = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");

  if (!envValue) {
    return PROD_API_BASE_URL;
  }

  if (!import.meta.env.DEV && isLocalhostBaseUrl(envValue)) {
    console.error(
      `[config] Invalid VITE_API_BASE_URL for production: "${envValue}". Falling back to "${PROD_API_BASE_URL}".`,
    );
    return PROD_API_BASE_URL;
  }

  return envValue;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const USE_MOCK_API = import.meta.env.VITE_MOCK_MODE === "true";

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export const MAX_ACTIVE_BOOKINGS_PER_USER = parsePositiveInt(
  import.meta.env.VITE_MAX_ACTIVE_BOOKINGS_PER_USER,
  2,
);

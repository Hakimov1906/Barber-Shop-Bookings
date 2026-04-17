import type { EntityRecord, ListParams, ListPayload, ResourceAdapter } from "./types";

const DEFAULT_REMOTE_API_BASE_URL = "https://test-4p5l.onrender.com";
const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:4000";

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function detectApiBaseUrl() {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (fromEnv) return stripTrailingSlash(fromEnv);

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return DEFAULT_LOCAL_API_BASE_URL;
    }
  }

  return DEFAULT_REMOTE_API_BASE_URL;
}

export const API_BASE_URL = detectApiBaseUrl();

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type CrudAdapterOptions = {
  key: string;
  label: string;
  basePath: string;
  idKeys: string[];
  supportsServerPagination: boolean;
  staticQuery?: Record<string, string | number | boolean>;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function toQueryString(query: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "undefined") continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeListPayload<T extends EntityRecord>(
  payload: unknown,
  limit: number,
  offset: number,
  serverPaginated: boolean,
): ListPayload<T> {
  if (Array.isArray(payload)) {
    const typed = payload as T[];
    const paged = typed.slice(offset, offset + limit);
    const total = typed.length;
    return {
      items: paged,
      limit,
      offset,
      total,
      hasMore: offset + paged.length < total,
      serverPaginated: false,
    };
  }

  if (isObject(payload) && Array.isArray(payload.items)) {
    const items = payload.items as T[];
    const normalizedLimit = typeof payload.limit === "number" ? payload.limit : limit;
    const normalizedOffset = typeof payload.offset === "number" ? payload.offset : offset;

    if (serverPaginated) {
      const totalFromApi = typeof payload.total === "number" ? payload.total : null;
      const hasMoreFromApi = typeof payload.hasMore === "boolean" ? payload.hasMore : null;
      const hasMore =
        hasMoreFromApi ??
        (totalFromApi !== null
          ? normalizedOffset + items.length < totalFromApi
          : items.length >= normalizedLimit && items.length > 0);
      const total =
        totalFromApi ??
        (hasMore
          ? normalizedOffset + items.length + normalizedLimit
          : normalizedOffset + items.length);
      return {
        items,
        limit: normalizedLimit,
        offset: normalizedOffset,
        total,
        hasMore,
        serverPaginated: true,
      };
    }

    const paged = items.slice(offset, offset + limit);
    const total = items.length;
    return {
      items: paged,
      limit,
      offset,
      total,
      hasMore: offset + paged.length < total,
      serverPaginated: false,
    };
  }

  throw new ApiError("Invalid list payload format", 500, payload);
}

function buildEntityPath(basePath: string, idKeys: string[], ids: Record<string, string | number>) {
  const parts = idKeys.map((key) => {
    const value = ids[key];
    if (value === null || typeof value === "undefined" || String(value).trim() === "") {
      throw new ApiError(`Missing id field: ${key}`, 400);
    }
    return encodeURIComponent(String(value));
  });
  return `${basePath}/${parts.join("/")}`;
}

async function parseResponsePayload(response: Response) {
  if (response.status === 204) return undefined;

  const raw = await response.text();
  if (!raw.trim()) return undefined;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      // Fallback for invalid JSON responses from upstream proxies.
      return raw;
    }
  }

  return raw;
}

function extractErrorMessage(payload: unknown, status: number) {
  if (!payload) return `Request failed (${status})`;
  if (typeof payload === "string") return payload;

  if (isObject(payload)) {
    const candidates = [payload.error, payload.message, payload.detail];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) return candidate;
    }
  }

  return `Request failed (${status})`;
}

async function request<T>(
  path: string,
  method: HttpMethod,
  token?: string | null,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const headers = new Headers();
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Сетевая ошибка. Не удалось связаться с API.", 0, error);
  }

  const payload = await parseResponsePayload(response);
  if (!response.ok) {
    const message = extractErrorMessage(payload, response.status);
    throw new ApiError(message, response.status, payload);
  }
  if (typeof payload === "undefined") return {} as T;
  return payload as T;
}

export type AdminLoginResponse = {
  token: string;
  admin: {
    id: number;
    full_name: string;
    phone: string;
  };
};

export async function adminLogin(payload: { phone: string; password: string }) {
  return request<AdminLoginResponse>("/api/admin/login", "POST", null, payload);
}

export async function rawApiGet<T>(path: string, token: string, signal?: AbortSignal) {
  return request<T>(path, "GET", token, undefined, signal);
}

export function createCrudAdapter<T extends EntityRecord>(options: CrudAdapterOptions): ResourceAdapter<T> {
  return {
    key: options.key,
    label: options.label,
    idKeys: options.idKeys,
    supportsServerPagination: options.supportsServerPagination,
    async list(token: string, params: ListParams, signal?: AbortSignal) {
      const query = {
        ...(options.staticQuery || {}),
        ...(params.query || {}),
      } as Record<string, string | number | boolean | undefined>;
      if (options.supportsServerPagination) {
        query.limit = params.limit;
        query.offset = params.offset;
      }
      const path = `${options.basePath}${toQueryString(query)}`;
      const payload = await request<unknown>(path, "GET", token, undefined, signal);
      return normalizeListPayload<T>(payload, params.limit, params.offset, options.supportsServerPagination);
    },
    async get(token: string, ids: Record<string, string | number>) {
      const path = buildEntityPath(options.basePath, options.idKeys, ids);
      return request<T>(path, "GET", token);
    },
    async create(token: string, payload: Record<string, unknown>) {
      return request<T | EntityRecord>(options.basePath, "POST", token, payload);
    },
    async update(token: string, ids: Record<string, string | number>, payload: Record<string, unknown>) {
      const path = buildEntityPath(options.basePath, options.idKeys, ids);
      return request<T | EntityRecord>(path, "PATCH", token, payload);
    },
    async remove(token: string, ids: Record<string, string | number>) {
      const path = buildEntityPath(options.basePath, options.idKeys, ids);
      return request<EntityRecord>(path, "DELETE", token);
    },
  };
}


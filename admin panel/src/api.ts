export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  || "https://test-4p5l.onrender.com";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, method: HttpMethod, token?: string | null, body?: unknown): Promise<T> {
  const headers = new Headers();
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }
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

export async function apiGet(path: string, token: string) {
  return request<unknown>(path, "GET", token);
}

export async function apiPost(path: string, token: string, payload: unknown) {
  return request<unknown>(path, "POST", token, payload);
}

export async function apiPatch(path: string, token: string, payload: unknown) {
  return request<unknown>(path, "PATCH", token, payload);
}

export async function apiDelete(path: string, token: string) {
  return request<unknown>(path, "DELETE", token);
}

import createClient from "openapi-fetch";
import { API_BASE_URL } from "@/lib/config";
import type { paths } from "@/api/generated/openapi";

export interface HttpApiErrorPayload {
  error?: string;
}

export class HttpApiError extends Error {
  status: number;

  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "HttpApiError";
    this.status = status;
    this.payload = payload;
  }
}

const client = createClient<paths>({
  baseUrl: API_BASE_URL,
});

console.log("[Client] API_BASE_URL:", API_BASE_URL);

export async function unwrapOpenApiResponse<T>(
  operation: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await operation;
  if (typeof data !== "undefined") {
    return data;
  }

  const message =
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as HttpApiErrorPayload).error === "string"
      ? (error as HttpApiErrorPayload).error!
      : `Request failed with status ${response.status}`;

  throw new HttpApiError(message, response.status, error);
}

export { client };

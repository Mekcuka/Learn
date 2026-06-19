import type { ApiErrorPayload } from "../types/api";

export const API_BASE = import.meta.env.VITE_API_URL ?? "";
export const REQUEST_TIMEOUT_MS = 20_000;

export function parseApiError(payload: ApiErrorPayload): { message: string; code?: string } {
  if (payload.message && typeof payload.detail === "string") {
    return { message: payload.message, code: payload.detail };
  }
  if (payload.message) {
    const code =
      typeof payload.detail === "string"
        ? payload.detail
        : typeof payload.detail === "object" && payload.detail?.detail
          ? payload.detail.detail
          : undefined;
    return { message: payload.message, code };
  }
  if (payload.detail && typeof payload.detail === "object") {
    return {
      message: payload.detail.message ?? "Не удалось выполнить запрос",
      code: payload.detail.detail,
    };
  }
  if (typeof payload.detail === "string") {
    if (payload.detail === "invalid_credentials") {
      return { message: "Неверный email или пароль", code: payload.detail };
    }
    return { message: payload.detail, code: payload.detail };
  }
  return { message: "Не удалось выполнить запрос" };
}

export class LearnApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type HttpRequestOptions = RequestInit & {
  auth?: boolean;
  timeout?: boolean;
};

export async function httpRequest<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const { auth = true, timeout = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  const body = fetchOptions.body;

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = localStorage.getItem("learn_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
      signal: fetchOptions.signal ?? (timeout ? AbortSignal.timeout(REQUEST_TIMEOUT_MS) : undefined),
    });
  } catch (err) {
    if (timeout && err instanceof DOMException && err.name === "TimeoutError") {
      throw new LearnApiError(
        0,
        "Сервер не отвечает. Запустите backend и выполните alembic upgrade head.",
      );
    }
    throw new LearnApiError(0, "Не удалось подключиться к серверу");
  }

  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    const { message, code } = parseApiError(payload);
    throw new LearnApiError(response.status, message, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

import { clearToken, getToken } from "./session";

// Set VITE_API_URL in .env.local when the API is not on this machine (e.g. testing on an iPhone)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5255/api";

/** Fired when the API rejects our token, so the app can go back to the sign-in screen. */
export const AUTH_EXPIRED_EVENT = "auth:expired";

// The free API host sleeps when idle and can take about a minute to wake up
const TIMEOUT_MS = 90_000;
const RETRY_DELAY_MS = 2_000;
const WAKING_UP = new Set([502, 503, 504]);

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, path: string) {
    super(`${path} failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

async function send<T>(path: string, init: RequestInit, token: string | null): Promise<T> {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(API_BASE + path, { ...init, headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    if (response.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, path);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// Reads are safe to repeat, so a host that is still waking up gets a second chance
async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const url = query ? `${path}?${query}` : path;
  try {
    return await send<T>(url, { method: "GET" }, getToken());
  } catch (error) {
    const worthRetrying = error instanceof TypeError || (error instanceof ApiError && WAKING_UP.has(error.status));
    if (!worthRetrying) throw error;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return send<T>(url, { method: "GET" }, getToken());
  }
}

const post = <T = void>(path: string, body: unknown): Promise<T> =>
  send<T>(path, { method: "POST", body: JSON.stringify(body) }, getToken());

// Signing in carries no token of ours, so a 401 here doesn't mean a session expired
const postAnonymous = <T>(path: string, body: unknown): Promise<T> =>
  send<T>(path, { method: "POST", body: JSON.stringify(body) }, null);

export const api = { get, post, postAnonymous };

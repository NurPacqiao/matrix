// The signed-in session: our own API token, kept in localStorage so the app stays signed in.

const TOKEN_KEY = "jwt";

interface Claims {
  email?: string;
  exp?: number; // seconds since epoch
}

// No verification needed client-side: the API checks the signature on every request
function readClaims(token: string): Claims | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "="))) as Claims;
  } catch {
    return null;
  }
}

/** The stored token, or null when there is none or it has expired. */
export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const expiresAt = (readClaims(token)?.exp ?? 0) * 1000;
  return expiresAt > Date.now() ? token : null;
}

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const emailFromToken = (token: string): string | null => readClaims(token)?.email ?? null;

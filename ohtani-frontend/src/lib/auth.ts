// Reads the email claim from our own JWT (no verification needed client-side)
export function emailFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")));
    return (
      claims.email ??
      claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ??
      null
    );
  } catch {
    return null;
  }
}

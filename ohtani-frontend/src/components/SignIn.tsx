import { useState } from "react";
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google";
import { api, ApiError } from "../lib/api";
import AppMark from "./AppMark";

function messageFor(error: unknown): string {
  const status = error instanceof ApiError ? error.status : null;
  if (status === 403) return "This is a private app, and that account isn't on its list.";
  if (status === 429) return "Too many attempts. Wait a minute and try again.";
  return "Couldn't sign you in. Is the API running?";
}

// The Google provider sits here, not around the whole app, so Google's script only loads
// when someone actually needs to sign in.
export default function SignIn({ onSignedIn }: { onSignedIn: (token: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSuccess = async ({ credential }: CredentialResponse) => {
    setError(null);
    setBusy(true);
    try {
      const { token } = await api.postAnonymous<{ token: string }>("/auth/login", { token: credential });
      onSignedIn(token);
    } catch (e) {
      console.error("Login failed", e);
      setError(messageFor(e));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <AppMark className="w-12 h-12 mb-8" />
        <h1 className="text-4xl font-semibold tracking-tight">Matrix</h1>
        <p className="mt-3 text-bone-muted leading-relaxed">One goal. Eight directions. A few clear steps every day.</p>
        <div className="mt-10">
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError("Google sign-in was cancelled or failed.")}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
            />
          </GoogleOAuthProvider>
        </div>
        {busy && <p className="mt-4 text-sm text-bone-muted">Signing in… this can take up to a minute after a quiet spell.</p>}
        {error && (
          <p role="alert" className="mt-4 text-sm text-accent-soft">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

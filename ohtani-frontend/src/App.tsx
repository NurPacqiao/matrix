import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Shell from "./components/Shell";
import SignIn from "./components/SignIn";
import { AUTH_EXPIRED_EVENT } from "./lib/api";
import { clearToken, emailFromToken, getToken, setToken } from "./lib/session";

export default function App() {
  const [token, setCurrentToken] = useState<string | null>(getToken);

  useEffect(() => {
    const onExpired = () => setCurrentToken(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const signIn = (newToken: string) => {
    setToken(newToken);
    setCurrentToken(newToken);
  };

  const signOut = () => {
    clearToken();
    setCurrentToken(null);
  };

  return (
    <ErrorBoundary>
      {token ? <Shell email={emailFromToken(token)} onSignOut={signOut} /> : <SignIn onSignedIn={signIn} />}
    </ErrorBoundary>
  );
}

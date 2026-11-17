import { useEffect, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import axios from "axios";
import { API_BASE, AUTH_EXPIRED_EVENT } from "./api";
import Matrix from "./components/Matrix";
import TaskGenerator from "./components/TaskGenerator";
import Stats from "./components/Stats";
import ProfilePanel from "./components/ProfilePanel";
import NineMark from "./components/NineMark";
import { emailFromToken } from "./lib/auth";

type Tab = "today" | "matrix" | "stats";

const TABS: { id: Tab; label: string; icon: string }[] = [
  {
    id: "today",
    label: "Today",
    icon: "M9 12.5l2 2 4-4.5M12 21a9 9 0 100-18 9 9 0 000 18z",
  },
  {
    id: "matrix",
    label: "Grid",
    icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  },
  {
    id: "stats",
    label: "Balance",
    icon: "M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9L12 3zM12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9",
  },
];

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("jwt"));
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const onExpired = () => setToken(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoginError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        token: credentialResponse.credential,
      });
      localStorage.setItem("jwt", res.data.token);
      setToken(res.data.token);
    } catch (error) {
      console.error("Login failed to reach backend", error);
      setLoginError("Couldn't sign you in. Is the API running?");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setProfileOpen(false);
    setToken(null);
  };

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 pt-safe pb-safe">
        <div className="w-full max-w-sm">
          <NineMark className="w-10 h-10 text-accent mb-8" />
          <h1 className="text-4xl font-semibold tracking-tight">Nine</h1>
          <p className="mt-3 text-bone-muted leading-relaxed">
            One goal. Eight directions. Four steps a day.
          </p>
          <div className="mt-10">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setLoginError("Google sign-in was cancelled or failed.")}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
            />
          </div>
          {loginError && <p className="mt-4 text-sm text-accent-soft">{loginError}</p>}
        </div>
      </div>
    );
  }

  const email = emailFromToken(token);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-20 bg-ink-950/95 backdrop-blur border-b border-ink-800 pt-safe">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setProfileOpen(true)}
            aria-label="Open profile"
            className="w-9 h-9 rounded-full bg-ink-800 border border-ink-700 text-sm font-semibold text-bone hover:border-accent/60 transition-colors"
          >
            {(email?.[0] ?? "?").toUpperCase()}
          </button>
          <span className="font-semibold tracking-tight">Nine</span>
          <span className="ml-auto font-mono text-xs text-bone-faint">
            {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </header>

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 pt-6 pb-28">
        {activeTab === "today" && <TaskGenerator />}
        {activeTab === "matrix" && <Matrix />}
        {activeTab === "stats" && <Stats />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-ink-950/95 backdrop-blur border-t border-ink-800 pb-safe">
        <div className="max-w-3xl mx-auto flex h-16">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-accent-soft" : "text-bone-faint hover:text-bone-muted"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <ProfilePanel
        open={profileOpen}
        email={email}
        onClose={() => setProfileOpen(false)}
        onSignOut={handleLogout}
      />
    </div>
  );
}

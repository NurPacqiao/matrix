import { useState } from "react";
import { useToday } from "../hooks/useToday";
import Balance from "./balance/Balance";
import Matrix from "./Matrix";
import ProfilePanel from "./ProfilePanel";
import TabBar, { type Tab } from "./TabBar";
import Today from "./today/Today";

/** Everything a signed-in user sees. Unmounting it on sign-out drops all loaded data. */
export default function Shell({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [profileOpen, setProfileOpen] = useState(false);
  const today = useToday();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-20 bg-ink-950 border-b border-ink-800 pt-safe">
        <div className="max-w-3xl mx-auto px-4 pt-2 h-[60px] flex items-center gap-3">
          <button
            onClick={() => setProfileOpen(true)}
            aria-label="Open profile"
            className="w-9 h-9 rounded-full bg-ink-800 border border-ink-700 text-sm font-semibold text-bone hover:border-accent/60 transition-colors"
          >
            {(email?.[0] ?? "?").toUpperCase()}
          </button>
          <span className="ml-auto text-sm font-medium tabular-nums text-bone-muted">
            {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </header>

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 pt-6 pb-28">
        {activeTab === "today" && <Today today={today} />}
        {activeTab === "matrix" && <Matrix />}
        {activeTab === "balance" && <Balance history={today.history} loadError={today.loadError} />}
      </main>

      <TabBar active={activeTab} onSelect={setActiveTab} />

      <ProfilePanel open={profileOpen} email={email} onClose={() => setProfileOpen(false)} onSignOut={onSignOut} />
    </div>
  );
}

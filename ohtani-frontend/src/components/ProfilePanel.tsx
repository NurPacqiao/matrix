import { useEffect } from "react";
import AppMark from "./AppMark";

interface ProfilePanelProps {
  open: boolean;
  email: string | null;
  onClose: () => void;
  onSignOut: () => void;
}

export default function ProfilePanel({ open, email, onClose, onSignOut }: ProfilePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Profile"
        className={`absolute inset-y-0 left-0 w-[85%] max-w-xs bg-ink-900 border-r border-ink-800 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <AppMark className="w-6 h-6" />
            <span className="text-lg font-semibold tracking-tight text-bone">Matrix</span>
          </span>
          <button onClick={onClose} aria-label="Close" className="text-bone-faint hover:text-bone p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-6 border-b border-ink-800">
          <div className="w-12 h-12 rounded-full bg-ink-800 border border-ink-700 flex items-center justify-center text-lg font-semibold">
            {(email?.[0] ?? "?").toUpperCase()}
          </div>
          <p className="mt-3 text-xs text-bone-faint">Signed in as</p>
          <p className="text-sm text-bone break-all">{email ?? "Unknown account"}</p>
        </div>

        <div className="px-5 py-5 space-y-4 text-sm">
          <p className="text-bone-muted leading-relaxed">
            Each day Matrix builds an 8-9 task plan on a fixed weekly schedule. University comes first
            until mid-February: the thesis and exam questions every day, plus the course with the next
            lab. Then typing, job applications, reading, your daily standards, and a light workout
            or a stretch.
          </p>
          <p className="text-bone-faint text-xs leading-relaxed">
            Days follow this device's clock, so a new day starts at your midnight.
          </p>
        </div>

        <div className="mt-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-ink-800">
          <button
            onClick={onSignOut}
            className="w-full py-2.5 rounded-lg border border-ink-700 text-sm font-medium text-bone hover:bg-ink-800 transition-colors"
          >
            Sign out
          </button>
          <p className="mt-4 text-center font-mono text-[11px] text-bone-faint">Matrix v{__APP_VERSION__}</p>
        </div>
      </aside>
    </div>
  );
}

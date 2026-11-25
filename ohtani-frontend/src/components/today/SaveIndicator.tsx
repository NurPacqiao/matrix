import type { SaveState } from "../../types";

export default function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "error") {
    return (
      <button onClick={onRetry} className="font-mono text-xs text-accent-soft underline underline-offset-4">
        Not saved · retry
      </button>
    );
  }
  const label = state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "";
  return <span className="font-mono text-xs text-bone-faint h-4">{label}</span>;
}

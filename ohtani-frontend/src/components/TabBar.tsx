export type Tab = "today" | "matrix" | "balance";

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
    id: "balance",
    label: "Balance",
    icon: "M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9L12 3zM12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9",
  },
];

export default function TabBar({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-ink-950 border-t border-ink-800 pb-safe">
      <div className="max-w-3xl mx-auto flex h-16">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            aria-current={tab.id === active ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              tab.id === active ? "text-accent-soft" : "text-bone-faint hover:text-bone-muted"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            <span className="text-[11px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// − / + for counted tasks, sitting on the right edge of the task row
export default function Stepper({ value, unit, onChange }: { value: number; unit: string; onChange: (sign: 1 | -1) => void }) {
  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center rounded-lg border border-ink-700 bg-ink-950">
      <button
        onClick={() => onChange(-1)}
        disabled={value === 0}
        aria-label={`Fewer ${unit}`}
        className="w-9 h-9 flex items-center justify-center text-bone-muted disabled:text-ink-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M6 12h12" />
        </svg>
      </button>
      <span className="w-8 text-center font-mono text-sm tabular-nums text-bone">{value}</span>
      <button
        onClick={() => onChange(1)}
        aria-label={`More ${unit}`}
        className="w-9 h-9 flex items-center justify-center text-bone-muted"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M12 6v12M6 12h12" />
        </svg>
      </button>
    </div>
  );
}

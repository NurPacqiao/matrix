export default function Check({ checked }: { checked: boolean }) {
  return (
    <span
      className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
        checked ? "bg-accent border-accent" : "border-ink-600"
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-ink-950" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
    </span>
  );
}

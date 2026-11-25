export default function Tile({ label, value, unit }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="rounded-xl bg-ink-900 border border-ink-800 p-3">
      <p className="text-[11px] text-bone-faint">{label}</p>
      <p className="mt-1">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {unit && <span className="ml-1 text-xs text-bone-faint">{unit}</span>}
      </p>
    </div>
  );
}

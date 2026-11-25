import { classesFor, type Timetable } from "../../data/timetable";

export default function ClassesToday({ timetable, label }: { timetable: Timetable; label?: string }) {
  const classes = classesFor(timetable);
  if (classes.length === 0) return null;

  return (
    <section className="mt-4 rounded-xl border border-ink-800 px-4 py-3">
      <h2 className="text-[11px] font-medium text-bone-faint">Classes today{label ? ` · ${label}` : ""}</h2>
      <ul className="mt-2 space-y-1.5">
        {classes.map((c) => (
          <li key={c.start + c.subject} className="flex items-baseline gap-3 text-sm">
            <span className="font-mono text-xs text-bone-muted w-[92px] flex-shrink-0">
              {c.start}–{c.end}
            </span>
            <span className="text-bone truncate">{c.subject}</span>
            <span className="ml-auto flex-shrink-0 text-[11px] text-bone-faint">
              {c.kind}
              {c.remote ? " · online" : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

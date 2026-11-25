import { useMemo, useState } from "react";
import { DIRECTIONS } from "../../data/matrix";
import { POMODORO_MINUTES, pomosByMonth, summarize, windowTasks, type Tally } from "../../lib/summary";
import type { DayLog } from "../../types";
import { CHART } from "./chartColors";
import MonthBars from "./MonthBars";

type PeriodId = "day" | "week" | "month" | "year";

const PERIODS: { id: PeriodId; label: string; days: number; title: string; prev?: string }[] = [
  { id: "day", label: "Day", days: 1, title: "Today", prev: "yesterday" },
  { id: "week", label: "Week", days: 7, title: "Last 7 days", prev: "the 7 before" },
  { id: "month", label: "Month", days: 30, title: "Last 30 days", prev: "the 30 before" },
  // History goes back about 400 days, so a full previous year isn't there to compare with
  { id: "year", label: "Year", days: 365, title: "Last 12 months" },
];

export default function Summary({ byDate }: { byDate: Map<string, DayLog> }) {
  const [periodId, setPeriodId] = useState<PeriodId>("week");
  const period = PERIODS.find((p) => p.id === periodId)!;

  const { now, before } = useMemo(
    () => ({
      now: summarize(windowTasks(byDate, period.days)),
      before: period.prev ? summarize(windowTasks(byDate, period.days, period.days)) : null,
    }),
    [byDate, period],
  );
  const months = useMemo(() => pomosByMonth(byDate), [byDate]);

  const directions = DIRECTIONS.map((d) => ({ ...d, pomos: now.pomosByDirection.get(d.id) ?? 0 }))
    .filter((d) => d.pomos > 0)
    .sort((a, b) => b.pomos - a.pomos || a.id - b.id);
  const maxPomos = Math.max(...directions.map((d) => d.pomos), 1);
  const delta = before ? now.pomos - before.pomos : null;

  const rows: { label: string; tally: Tally; prev?: Tally; unit?: string }[] = [
    { label: "Thesis Pomodoros", tally: now.thesis, prev: before?.thesis },
    { label: "Pages read", tally: now.pages, prev: before?.pages },
    { label: "Job applications", tally: now.applications, prev: before?.applications },
    { label: "Workouts", tally: now.workouts, prev: before?.workouts },
    { label: "Stretching", tally: now.stretches, prev: before?.stretches },
    { label: "Clean days", tally: now.clean, prev: before?.clean },
    { label: "Prayers", tally: now.prayers, prev: before?.prayers },
    { label: "Dhikr", tally: now.dhikr, prev: before?.dhikr },
    { label: "Whole plan", tally: now.plan, prev: before?.plan, unit: "tasks" },
  ];

  return (
    <section className="mt-4 rounded-xl bg-ink-900 border border-ink-800 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-bone">Summary</h2>
        <div className="flex rounded-lg bg-ink-950 border border-ink-800 p-0.5" role="tablist">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === periodId}
              onClick={() => setPeriodId(p.id)}
              className={`px-2.5 h-7 rounded-md text-xs font-medium transition-colors ${
                p.id === periodId ? "bg-ink-800 text-bone" : "text-bone-faint"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 font-mono text-[11px] text-bone-faint">{period.title}</p>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums leading-none">{now.pomos}</span>
        <span className="text-sm text-bone-muted">Pomodoros</span>
        <span className="text-xs text-bone-faint">≈ {((now.pomos * POMODORO_MINUTES) / 60).toFixed(1)} h</span>
        {delta !== null && before && before.days > 0 && (
          <span className="ml-auto text-xs text-bone-muted tabular-nums">
            {delta >= 0 ? "+" : "−"}
            {Math.abs(delta)} vs {period.prev}
          </span>
        )}
      </div>

      {directions.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {directions.map((d) => (
            <li key={d.id} className="grid grid-cols-[84px_1fr_28px] items-center gap-3 text-xs">
              <span className="text-bone-muted truncate">{d.short}</span>
              <span className="h-2">
                <span
                  className="block h-full rounded-r"
                  style={{ width: `${(d.pomos / maxPomos) * 100}%`, background: CHART.thisWeek }}
                />
              </span>
              <span className="text-right font-mono text-bone tabular-nums">{d.pomos}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-bone-faint">No Pomodoros finished in this period yet.</p>
      )}

      {periodId === "year" && <MonthBars months={months} />}

      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] text-bone-faint">
            <th className="font-medium pb-2" />
            <th className="font-medium pb-2 text-right">Done</th>
            {period.prev && <th className="font-medium pb-2 text-right pl-3">Before</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="py-2 text-bone-muted">{r.label}</td>
              <td className="py-2 text-right font-mono tabular-nums">
                {r.tally.planned ? (
                  <>
                    <span className="text-bone">{r.tally.done}</span>
                    <span className="text-bone-faint"> / {r.tally.planned}</span>
                    {r.unit && <span className="text-bone-faint"> · {Math.round((r.tally.done / r.tally.planned) * 100)}%</span>}
                  </>
                ) : (
                  <span className="text-bone-faint">–</span>
                )}
              </td>
              {period.prev && (
                <td className="py-2 pl-3 text-right font-mono tabular-nums text-bone-faint">
                  {r.prev?.planned ? r.prev.done : "–"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-bone-faint leading-relaxed">
        Done / planned. Thesis Pomodoros, pages, applications and prayers count what you logged on the counter;
        other Pomodoros count once the task is ticked.
      </p>
    </section>
  );
}

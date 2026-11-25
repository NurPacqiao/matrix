import { useMemo } from "react";
import { computeBalance, pct } from "../../lib/balance";
import type { DayLog } from "../../types";
import { CHART } from "./chartColors";
import Radar from "./Radar";
import Summary from "./Summary";
import Tile from "./Tile";

export default function Balance({ history, loadError }: { history: DayLog[] | null; loadError: boolean }) {
  const stats = useMemo(() => (history ? computeBalance(history) : null), [history]);
  const byDate = useMemo(() => new Map(history?.map((d) => [d.date, d])), [history]);

  return (
    <div>
      <p className="font-mono text-xs text-bone-faint">Last 7 days vs the 7 before</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Balance</h1>

      {loadError && (
        <p role="alert" className="mt-4 text-sm text-accent-soft">
          Couldn't load your history. Check that the API is running.
        </p>
      )}

      {!stats ? (
        !loadError && <div className="mt-6 h-80 rounded-xl bg-ink-900 border border-ink-800 animate-pulse" />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <Tile
              label="Streak"
              value={stats.streak}
              unit={stats.best > stats.streak ? `best ${stats.best}` : stats.streak === 1 ? "day" : "days"}
            />
            <Tile label="Done this week" value={stats.doneThisWeek} unit={stats.plannedThisWeek ? `/ ${stats.plannedThisWeek}` : undefined} />
            <Tile
              label="vs last week"
              value={
                stats.plannedLastWeek
                  ? `${stats.rateThis >= stats.rateLast ? "+" : "−"}${Math.abs(Math.round((stats.rateThis - stats.rateLast) * 100))}`
                  : "–"
              }
              unit={stats.plannedLastWeek ? "pts" : undefined}
            />
          </div>

          <section className="mt-4 rounded-xl bg-ink-900 border border-ink-800 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-bone">Completion by direction</h2>
              <div className="flex gap-4 text-[11px] text-bone-muted">
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="8" aria-hidden="true">
                    <line x1="0" y1="4" x2="16" y2="4" stroke={CHART.thisWeek} strokeWidth="2" />
                  </svg>
                  This week
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="8" aria-hidden="true">
                    <line x1="0" y1="4" x2="16" y2="4" stroke={CHART.lastWeek} strokeWidth="2" strokeDasharray="4 3" />
                  </svg>
                  Last week
                </span>
              </div>
            </div>
            <Radar scores={stats.scores} />
            {stats.plannedThisWeek + stats.plannedLastWeek === 0 && (
              <p className="text-center text-sm text-bone-faint -mt-2">
                Finish some of your daily plan and this fills in.
              </p>
            )}
          </section>

          <Summary byDate={byDate} />

          {stats.weakest.length === 2 && (
            <section className="mt-4 rounded-xl border border-ink-800 p-4 sm:p-6">
              <h2 className="text-sm font-medium text-bone">Needs attention</h2>
              <p className="mt-2 text-sm text-bone-muted leading-relaxed">
                Lowest completion this week: <span className="text-bone">{stats.weakest[0].name}</span> (
                {pct(stats.weakest[0].thisWeek)}) and <span className="text-bone">{stats.weakest[1].name}</span> (
                {pct(stats.weakest[1].thisWeek)}). Their next steps stay in the plan until they're done.
              </p>
            </section>
          )}

          <details className="mt-4 group">
            <summary className="cursor-pointer text-xs text-bone-faint hover:text-bone-muted">Show as table</summary>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-bone-faint">
                  <th className="font-medium py-2">Direction</th>
                  <th className="font-medium py-2 text-right">This week</th>
                  <th className="font-medium py-2 text-right">Last week</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {stats.scores.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 text-bone-muted">{s.name}</td>
                    <td className="py-2 text-right font-mono text-bone">
                      {s.doneThis}/{s.plannedThis}
                    </td>
                    <td className="py-2 text-right font-mono text-bone-muted">
                      {s.doneLast}/{s.plannedLast}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
}

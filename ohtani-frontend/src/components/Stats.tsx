import { useEffect, useMemo, useState } from "react";
import { DIRECTIONS } from "../data/matrix";
import { utcDateKey } from "../lib/dates";
import { loadHistory } from "../lib/history";
import { computeStreak } from "../lib/streak";
import type { DayLog } from "../types";
import Summary from "./Summary";

// Validated (dataviz validate_palette, dark mode on #16171a): both pass band, chroma, CVD, contrast.
const THIS_WEEK = "#5b8bd6";
const LAST_WEEK = "#d07090";

interface DirectionScore {
  id: number;
  short: string;
  name: string;
  thisWeek: number; // completion rate 0-1 (0 when nothing was scheduled)
  lastWeek: number;
  doneThis: number;
  plannedThis: number;
  doneLast: number;
  plannedLast: number;
}

const pct = (rate: number) => `${Math.round(rate * 100)}%`;

function computeStats(history: DayLog[]) {
  const byDate = new Map(history.map((d) => [d.date, d]));
  const thisWeekKeys = Array.from({ length: 7 }, (_, i) => utcDateKey(6 - i)); // oldest → today
  const lastWeekKeys = Array.from({ length: 7 }, (_, i) => utcDateKey(13 - i));

  // Per direction: how many plan tasks were scheduled and how many got done
  const tally = (keys: string[]) => {
    const planned = new Map<number, number>();
    const done = new Map<number, number>();
    for (const key of keys) {
      for (const task of byDate.get(key)?.lockedTasks ?? []) {
        if (!task.directionId) continue;
        planned.set(task.directionId, (planned.get(task.directionId) ?? 0) + 1);
        if (task.isCompleted) done.set(task.directionId, (done.get(task.directionId) ?? 0) + 1);
      }
    }
    return { planned, done };
  };

  const thisWeek = tally(thisWeekKeys);
  const lastWeek = tally(lastWeekKeys);

  const scores: DirectionScore[] = DIRECTIONS.map((d) => {
    const doneThis = thisWeek.done.get(d.id) ?? 0;
    const plannedThis = thisWeek.planned.get(d.id) ?? 0;
    const doneLast = lastWeek.done.get(d.id) ?? 0;
    const plannedLast = lastWeek.planned.get(d.id) ?? 0;
    return {
      id: d.id,
      short: d.short,
      name: d.name,
      thisWeek: plannedThis ? doneThis / plannedThis : 0,
      lastWeek: plannedLast ? doneLast / plannedLast : 0,
      doneThis,
      plannedThis,
      doneLast,
      plannedLast,
    };
  });

  const { streak, best } = computeStreak(history);

  const doneThisWeek = scores.reduce((s, d) => s + d.doneThis, 0);
  const plannedThisWeek = scores.reduce((s, d) => s + d.plannedThis, 0);
  const doneLastWeek = scores.reduce((s, d) => s + d.doneLast, 0);
  const plannedLastWeek = scores.reduce((s, d) => s + d.plannedLast, 0);
  const rateThis = plannedThisWeek ? doneThisWeek / plannedThisWeek : 0;
  const rateLast = plannedLastWeek ? doneLastWeek / plannedLastWeek : 0;
  const weakest = scores
    .filter((s) => s.plannedThis > 0)
    .sort((a, b) => a.thisWeek - b.thisWeek || a.id - b.id)
    .slice(0, 2);

  return { byDate, scores, streak, best, doneThisWeek, plannedThisWeek, rateThis, rateLast, plannedLastWeek, weakest };
}

export default function Stats() {
  const [history, setHistory] = useState<DayLog[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadHistory(400) // a year for the summary
      .then((h) => !cancelled && setHistory(h))
      .catch((e) => {
        console.error("Failed to load history", e);
        if (!cancelled) {
          setError(true);
          setHistory([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => (history ? computeStats(history) : null), [history]);

  return (
    <div>
      <p className="font-mono text-xs text-bone-faint">Last 7 days vs the 7 before</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Balance</h1>

      {error && <p className="mt-4 text-sm text-accent-soft">Couldn't load your history. Check that the API is running.</p>}

      {!stats ? (
        <div className="mt-6 h-80 rounded-xl bg-ink-900 border border-ink-800 animate-pulse" />
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
                    <line x1="0" y1="4" x2="16" y2="4" stroke={THIS_WEEK} strokeWidth="2" />
                  </svg>
                  This week
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="8" aria-hidden="true">
                    <line x1="0" y1="4" x2="16" y2="4" stroke={LAST_WEEK} strokeWidth="2" strokeDasharray="4 3" />
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

          <Summary byDate={stats.byDate} />

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

function Tile({ label, value, unit }: { label: string; value: number | string; unit?: string }) {
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

// ---------- Radar ----------

const W = 400;
const H = 330;
const CX = W / 2;
const CY = H / 2;
const R = 112;
const LABEL_R = R + 18;

// Spokes mirror where each direction sits on the grid: Frontend at the top, Career top-right, …
const angleFor = (directionId: number) => ((-90 + (directionId - 2) * 45) * Math.PI) / 180;
const point = (directionId: number, radius: number) => {
  const a = angleFor(directionId);
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)] as const;
};

function Radar({ scores }: { scores: DirectionScore[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = 1; // rates, 0-100%
  const rings = [0.25, 0.5, 0.75, 1];

  // Directions with nothing planned in either week are paused. Their wedge is hatched out
  // and the shape detours through the center, so it never covers a paused wedge and a
  // paused direction doesn't read as 0%. (With fewer than 3 in play, nothing is paused.)
  const inPlay = scores.filter((s) => s.plannedThis + s.plannedLast > 0);
  const isPaused = (s: DirectionScore) => inPlay.length >= 3 && !inPlay.includes(s);
  const center = `${CX},${CY}`;

  const polygon = (key: "thisWeek" | "lastWeek") => {
    const points: string[] = [];
    for (const s of scores) {
      const p = isPaused(s) ? center : point(s.id, (s[key] / max) * R).join(",");
      if (p !== center || points[points.length - 1] !== center) points.push(p);
    }
    if (points.length > 1 && points[0] === center && points[points.length - 1] === center) points.pop();
    return points.join(" ");
  };

  // The slice of the web a direction owns: out to its outer corner, halfway along the edges to each neighbour
  const wedge = (directionId: number, radius: number) => {
    const [x, y] = point(directionId, radius);
    const half = (neighbour: number) => {
      const [nx, ny] = point(neighbour, radius);
      return `${(x + nx) / 2},${(y + ny) / 2}`;
    };
    return `M${CX},${CY} L${half(((directionId + 6) % 8) + 1)} L${x},${y} L${half((directionId % 8) + 1)} Z`;
  };

  const activeScore = scores.find((s) => s.id === active);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Radar chart of completion rate per direction">
        {rings.map((f) => (
          <polygon
            key={f}
            points={scores.map((s) => point(s.id, f * R).join(",")).join(" ")}
            fill="none"
            stroke="#2c2f35"
            strokeWidth="1"
          />
        ))}
        {scores.map((s) => {
          const [x, y] = point(s.id, R);
          return (
            <line
              key={s.id}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke={active === s.id ? "#75767a" : "#2c2f35"}
              strokeWidth="1"
            />
          );
        })}

        <defs>
          <pattern id="radar-paused" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#2c2f35" strokeWidth="1.5" />
          </pattern>
        </defs>
        {scores.filter(isPaused).map((s) => (
          <g key={s.id}>
            <path d={wedge(s.id, R + 2)} fill="#16171a" />
            <path d={wedge(s.id, R)} fill="url(#radar-paused)" />
          </g>
        ))}


        <polygon
          points={polygon("lastWeek")}
          fill={LAST_WEEK}
          fillOpacity="0.08"
          stroke={LAST_WEEK}
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />
        <polygon
          points={polygon("thisWeek")}
          fill={THIS_WEEK}
          fillOpacity="0.2"
          stroke={THIS_WEEK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {scores.filter((s) => !isPaused(s)).map((s) => {
          const [x, y] = point(s.id, (s.thisWeek / max) * R);
          return (
            <circle
              key={s.id}
              cx={x}
              cy={y}
              r={active === s.id ? 5 : 4}
              fill={THIS_WEEK}
              stroke="#16171a"
              strokeWidth="2"
            />
          );
        })}

        {scores.map((s) => {
          const [x, y] = point(s.id, LABEL_R);
          const anchor = x > CX + 4 ? "start" : x < CX - 4 ? "end" : "middle";
          const dy = y < CY - R + 10 ? -2 : y > CY + R - 10 ? 10 : 4;
          return (
            <text
              key={s.id}
              x={x}
              y={y + dy}
              textAnchor={anchor}
              fontSize="12"
              fill={active === s.id ? "#e9e5dc" : isPaused(s) ? "#75767a" : "#a3a29d"}
              fontFamily="Instrument Sans, system-ui, sans-serif"
            >
              {s.short}
              {isPaused(s) && <tspan fontSize="10"> · paused</tspan>}
            </text>
          );
        })}

        {/* Hit areas: one wedge per direction, bigger than the marks */}
        {scores.map((s) => {
          const a = angleFor(s.id);
          const span = Math.PI / 8;
          const r = LABEL_R + 30;
          const p1 = [CX + r * Math.cos(a - span), CY + r * Math.sin(a - span)];
          const p2 = [CX + r * Math.cos(a + span), CY + r * Math.sin(a + span)];
          return (
            <path
              key={s.id}
              d={`M${CX},${CY} L${p1.join(",")} A${r},${r} 0 0 1 ${p2.join(",")} Z`}
              fill="transparent"
              onMouseEnter={() => setActive(s.id)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(active === s.id ? null : s.id)}
            />
          );
        })}
      </svg>

      {activeScore && (
        <div className="pointer-events-none absolute top-0 left-0 rounded-lg bg-ink-950 border border-ink-700 px-3 py-2 text-xs shadow-lg">
          <p className="font-medium text-bone">{activeScore.name}</p>
          <p className="mt-1 flex items-center gap-2 text-bone-muted">
            <span className="w-2 h-2 rounded-full" style={{ background: THIS_WEEK }} />
            This week{" "}
            <span className="ml-auto pl-3 font-mono text-bone">
              {activeScore.plannedThis ? `${activeScore.doneThis}/${activeScore.plannedThis} · ${pct(activeScore.thisWeek)}` : "nothing planned"}
            </span>
          </p>
          <p className="flex items-center gap-2 text-bone-muted">
            <span className="w-2 h-2 rounded-full" style={{ background: LAST_WEEK }} />
            Last week{" "}
            <span className="ml-auto pl-3 font-mono text-bone">
              {activeScore.plannedLast ? `${activeScore.doneLast}/${activeScore.plannedLast} · ${pct(activeScore.lastWeek)}` : "nothing planned"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

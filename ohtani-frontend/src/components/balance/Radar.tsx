import { useState } from "react";
import { pct, type DirectionScore } from "../../lib/balance";
import { CHART } from "./chartColors";

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

export default function Radar({ scores }: { scores: DirectionScore[] }) {
  const [active, setActive] = useState<number | null>(null);
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
      const p = isPaused(s) ? center : point(s.id, s[key] * R).join(",");
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
            stroke={CHART.grid}
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
              stroke={active === s.id ? CHART.textFaint : CHART.grid}
              strokeWidth="1"
            />
          );
        })}

        <defs>
          <pattern id="radar-paused" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={CHART.grid} strokeWidth="1.5" />
          </pattern>
        </defs>
        {scores.filter(isPaused).map((s) => (
          <g key={s.id}>
            <path d={wedge(s.id, R + 2)} fill={CHART.surface} />
            <path d={wedge(s.id, R)} fill="url(#radar-paused)" />
          </g>
        ))}

        <polygon
          points={polygon("lastWeek")}
          fill={CHART.lastWeek}
          fillOpacity="0.08"
          stroke={CHART.lastWeek}
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />
        <polygon
          points={polygon("thisWeek")}
          fill={CHART.thisWeek}
          fillOpacity="0.2"
          stroke={CHART.thisWeek}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {scores.filter((s) => !isPaused(s)).map((s) => {
          const [x, y] = point(s.id, s.thisWeek * R);
          return (
            <circle
              key={s.id}
              cx={x}
              cy={y}
              r={active === s.id ? 5 : 4}
              fill={CHART.thisWeek}
              stroke={CHART.surface}
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
              fill={active === s.id ? CHART.text : isPaused(s) ? CHART.textFaint : CHART.textMuted}
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
            <span className="w-2 h-2 rounded-full" style={{ background: CHART.thisWeek }} />
            This week{" "}
            <span className="ml-auto pl-3 font-mono text-bone">
              {activeScore.plannedThis ? `${activeScore.doneThis}/${activeScore.plannedThis} · ${pct(activeScore.thisWeek)}` : "nothing planned"}
            </span>
          </p>
          <p className="flex items-center gap-2 text-bone-muted">
            <span className="w-2 h-2 rounded-full" style={{ background: CHART.lastWeek }} />
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

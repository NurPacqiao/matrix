import { useState } from "react";
import { CHART } from "./chartColors";

export default function MonthBars({ months }: { months: { month: string; pomos: number }[] }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(...months.map((m) => m.pomos), 1);
  const name = (month: string, style: "narrow" | "long") =>
    new Date(`${month}-15T12:00:00`).toLocaleDateString("en-GB", { month: style });

  return (
    <div className="mt-5">
      <p className="text-[11px] text-bone-faint">Pomodoros by month</p>
      <div className="mt-2 grid grid-cols-12 gap-1.5">
        {months.map((m) => (
          <div
            key={m.month}
            className="flex flex-col items-center"
            onMouseEnter={() => setActive(m.month)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(active === m.month ? null : m.month)}
          >
            <span className={`h-4 font-mono text-[10px] ${active === m.month ? "text-bone" : "text-transparent"}`}>
              {m.pomos}
            </span>
            <div className="mt-1 w-full h-16 flex flex-col justify-end">
              {m.pomos > 0 ? (
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${(m.pomos / max) * 100}%`,
                    background: CHART.thisWeek,
                    opacity: active && active !== m.month ? 0.5 : 1,
                  }}
                />
              ) : (
                <div className="w-full h-px bg-ink-600" />
              )}
            </div>
            <span className={`mt-1.5 text-[10px] ${active === m.month ? "text-bone" : "text-bone-faint"}`}>
              {name(m.month, "narrow")}
            </span>
          </div>
        ))}
      </div>
      {active && (
        <p className="mt-1 text-[11px] text-bone-muted">
          {name(active, "long")}: {months.find((m) => m.month === active)?.pomos} Pomodoros
        </p>
      )}
    </div>
  );
}

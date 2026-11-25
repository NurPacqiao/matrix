import { weekdayShort } from "../../lib/dates";
import { streakMinDone, type Streak } from "../../lib/streak";
import type { Task } from "../../types";

export default function StreakCard({ streak, plan }: { streak: Streak; plan: Task[] }) {
  const minDone = streakMinDone(plan.length);
  const doneToday = plan.filter((t) => t.isCompleted).length;
  const left = Math.max(minDone - doneToday, 0);
  const hint = streak.todayDone
    ? "Today counts. Keep going."
    : streak.streak > 0
      ? `${left} more today to make it ${streak.streak + 1}.`
      : `Finish ${minDone} of ${plan.length} today to start a streak.`;

  return (
    <div className="mt-6 rounded-xl bg-ink-900 border border-ink-800 p-4 flex items-center gap-4">
      <div className="min-w-[64px]">
        <p className="text-3xl font-semibold tabular-nums leading-none">{streak.streak}</p>
        <p className="mt-1 text-[11px] text-bone-faint">day streak</p>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex gap-1.5">
          {streak.last7.map((day, i) => {
            const isToday = i === streak.last7.length - 1;
            return (
              <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
                <span
                  className={`w-full h-2 rounded-full ${
                    day.counts ? "bg-accent" : isToday ? "bg-ink-700 ring-1 ring-accent/50" : "bg-ink-700"
                  }`}
                />
                <span className={`text-[9px] ${isToday ? "text-bone-muted" : "text-bone-faint"}`}>
                  {weekdayShort(day.key).slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-bone-muted">
          {hint}
          {streak.best > streak.streak && <span className="text-bone-faint"> Best: {streak.best}.</span>}
        </p>
      </div>
    </div>
  );
}

import type { TodayState } from "../../hooks/useToday";
import { formatDayLong } from "../../lib/dates";
import { MAX_TASKS_PER_DAY, PRIORITY_DIRECTION } from "../../lib/plan";
import { computeStreak } from "../../lib/streak";
import { changeAmount, toggleTask } from "../../lib/tasks";
import ClassesToday from "./ClassesToday";
import CustomTasks from "./CustomTasks";
import PlanItem from "./PlanItem";
import SaveIndicator from "./SaveIndicator";
import StreakCard from "./StreakCard";

export default function Today({ today }: { today: TodayState }) {
  const { tasks, config, history, loadError, slow, saveState, update, retrySave, reload } = today;
  const plan = tasks?.lockedTasks ?? [];
  const doneCount = plan.filter((t) => t.isCompleted).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-bone-faint">{formatDayLong()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Today</h1>
        </div>
        <SaveIndicator state={saveState} onRetry={retrySave} />
      </div>

      {loadError && (
        <p role="alert" className="mt-6 text-sm text-accent-soft">
          Couldn't load today's tasks. Check that the API is running, then{" "}
          <button onClick={reload} className="underline underline-offset-4">
            try again
          </button>
          .
        </p>
      )}
      {slow && (
        <p className="mt-6 text-sm text-bone-muted">
          Waking up the server… this can take up to a minute after a quiet spell.
        </p>
      )}

      {tasks && history && <StreakCard streak={computeStreak(history)} plan={plan} />}
      {config && <ClassesToday timetable={config.timetable} label={config.timetableLabel} />}

      {(tasks || !loadError) && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-medium text-bone-muted">Today's plan</h2>
            {plan.length > 0 && (
              <span className="font-mono text-xs text-bone-faint">
                {doneCount}/{plan.length}
              </span>
            )}
          </div>

          {tasks ? (
            <ul className="space-y-2">
              {plan.map((task, i) => (
                <PlanItem
                  key={task.trackId ?? i}
                  task={task}
                  onToggle={() => update({ lockedTasks: toggleTask(plan, i) })}
                  onChangeAmount={(by) => update({ lockedTasks: changeAmount(plan, i, by) })}
                />
              ))}
            </ul>
          ) : (
            <div className="space-y-2" aria-label="Loading">
              {Array.from({ length: MAX_TASKS_PER_DAY }, (_, i) => (
                <div key={i} className="h-[60px] rounded-xl bg-ink-900 border border-ink-800 animate-pulse" />
              ))}
            </div>
          )}
          {tasks && (
            <p className="mt-3 text-[11px] text-bone-faint leading-relaxed">
              {plan.some((t) => t.directionId === PRIORITY_DIRECTION) && "University first, every day. "}
              Use − / + to log Pomodoros, pages, applications and prayers; going past the goal counts too.
            </p>
          )}
        </section>
      )}

      {tasks && <CustomTasks tasks={tasks.customTasks} onChange={(customTasks) => update({ customTasks })} />}
    </div>
  );
}

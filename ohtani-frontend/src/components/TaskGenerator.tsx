import { useEffect, useRef, useState } from "react";
import api from "../api";
import { directionById } from "../data/matrix";
import { classesFor } from "../data/timetable";
import { formatDayLong, weekdayShort } from "../lib/dates";
import { loadHistory } from "../lib/history";
import { buildDailyPlan, isCurrentPlan, PROGRESSIVE_TRACKS, TASKS_PER_DAY } from "../lib/plan";
import { computeStreak, STREAK_MIN_DONE } from "../lib/streak";
import type { DayLog, SaveState, Task } from "../types";

export default function TaskGenerator() {
  const [lockedTasks, setLockedTasks] = useState<Task[]>([]);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<DayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [newTask, setNewTask] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Saves run one after another so a fast double-tap can't land out of order
  const saveChain = useRef<Promise<void>>(Promise.resolve());

  const persist = (locked: Task[], custom: Task[]) => {
    setSaveState("saving");
    saveChain.current = saveChain.current
      .then(() => api.post("/tasks", { lockedTasks: locked, customTasks: custom }))
      .then(() => setSaveState("saved"))
      .catch((error) => {
        console.error("Failed to save tasks", error);
        setSaveState("error");
      });
  };

  const update = (locked: Task[], custom: Task[]) => {
    setLockedTasks(locked);
    setCustomTasks(custom);
    persist(locked, custom);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [{ data }, past] = await Promise.all([
          api.get<{ lockedTasks: Task[]; customTasks: Task[] }>("/tasks"),
          loadHistory(400),
        ]);
        let locked = data.lockedTasks ?? [];
        const custom = data.customTasks ?? [];

        // First open of the day, or a log from before the 5-task plan: build today's plan
        const needsPlan = !isCurrentPlan(locked);
        if (needsPlan) locked = buildDailyPlan(past);
        if (cancelled) return;

        setHistory(past);
        setLockedTasks(locked);
        setCustomTasks(custom);
        if (needsPlan) persist(locked, custom);
      } catch (error) {
        console.error("Failed to load tasks", error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (tasks: Task[], index: number) =>
    tasks.map((task, i) => (i === index ? { ...task, isCompleted: !task.isCompleted } : task));

  const addCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTask.trim();
    if (!text) return;
    update(lockedTasks, [...customTasks, { text, isCompleted: false }]);
    setNewTask("");
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(customTasks[index].text);
  };

  const commitEdit = () => {
    if (editingIndex === null) return;
    const text = editText.trim();
    if (text && text !== customTasks[editingIndex].text) {
      update(
        lockedTasks,
        customTasks.map((task, i) => (i === editingIndex ? { ...task, text } : task)),
      );
    }
    setEditingIndex(null);
  };

  const deleteCustomTask = (index: number) => {
    update(lockedTasks, customTasks.filter((_, i) => i !== index));
  };

  const doneCount = lockedTasks.filter((t) => t.isCompleted).length;
  const streak = computeStreak(history, lockedTasks);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-bone-faint">{formatDayLong()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Today</h1>
        </div>
        <SaveIndicator state={saveState} onRetry={() => persist(lockedTasks, customTasks)} />
      </div>

      {loadError && (
        <p className="mt-6 text-sm text-accent-soft">Couldn't load today's tasks. Check that the API is running, then reload.</p>
      )}

      {!loading && !loadError && (
        <StreakCard
          streak={streak.streak}
          best={streak.best}
          todayDone={streak.todayDone}
          doneToday={doneCount}
          last7={streak.last7}
        />
      )}

      <ClassesToday />

      <section className="mt-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-medium text-bone-muted">Today's plan</h2>
          {!loading && lockedTasks.length > 0 && (
            <span className="font-mono text-xs text-bone-faint">
              {doneCount}/{lockedTasks.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: TASKS_PER_DAY }, (_, i) => (
              <div key={i} className="h-[60px] rounded-xl bg-ink-900 border border-ink-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {lockedTasks.map((task, i) => {
              const direction = directionById(task.directionId);
              const isUni = task.directionId === 4;
              return (
                <li key={i}>
                  <button
                    onClick={() => update(toggle(lockedTasks, i), customTasks)}
                    className={`w-full text-left flex gap-3 px-4 py-3 rounded-xl border transition-colors ${
                      task.isCompleted
                        ? "bg-ink-900/50 border-ink-800"
                        : "bg-ink-900 border-ink-800 hover:border-ink-600"
                    }`}
                  >
                    <Check checked={task.isCompleted} />
                    <span className="min-w-0 flex-grow">
                      <span
                        className={`block leading-snug ${
                          task.isCompleted ? "text-bone-faint line-through" : "text-bone"
                        }`}
                      >
                        {task.text}
                      </span>
                      {direction && (
                        <span className="mt-1 flex items-center gap-2 font-mono text-[11px] text-bone-faint">
                          <span className={isUni ? "text-accent-soft" : ""}>{direction.short}</span>
                          {task.trackId && PROGRESSIVE_TRACKS.has(task.trackId) && task.step && task.step > 1 && (
                            <span>· level {task.step}</span>
                          )}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!loading && (
          <p className="mt-3 text-[11px] text-bone-faint leading-relaxed">
            University first, every day. Workouts and exam topics only move up once you finish them.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-bone-muted mb-3">Also today</h2>

        <form onSubmit={addCustomTask} className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task"
            enterKeyHint="done"
            autoCapitalize="sentences"
            className="flex-grow min-w-0 h-11 px-4 rounded-xl bg-ink-900 border border-ink-800 text-bone placeholder:text-bone-faint focus:outline-none focus:border-accent/70"
          />
          <button
            type="submit"
            aria-label="Add task"
            className="h-11 px-4 flex items-center gap-1.5 rounded-xl bg-accent text-ink-950 font-semibold active:bg-accent-soft transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Add
          </button>
        </form>

        <ul className="mt-3 divide-y divide-ink-800 border-y border-ink-800">
          {!loading && customTasks.length === 0 && (
            <li className="py-6 text-center text-sm text-bone-faint">Nothing extra yet.</li>
          )}
          {customTasks.map((task, i) => (
            <li key={i} className="group flex items-center gap-1 min-h-[52px]">
              <button
                onClick={() => update(lockedTasks, toggle(customTasks, i))}
                aria-label={task.isCompleted ? "Mark as not done" : "Mark as done"}
                className="w-11 h-11 -ml-3 flex items-center justify-center"
              >
                <Check checked={task.isCompleted} />
              </button>

              {editingIndex === i ? (
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingIndex(null);
                  }}
                  className="flex-grow min-w-0 bg-transparent border-b border-accent/70 text-bone focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => startEdit(i)}
                  title="Tap to edit"
                  className={`flex-grow min-w-0 py-3 text-left ${
                    task.isCompleted ? "text-bone-faint line-through" : "text-bone"
                  }`}
                >
                  {task.text}
                </button>
              )}

              <button
                onClick={() => deleteCustomTask(i)}
                aria-label="Delete task"
                className="w-11 h-11 -mr-3 flex items-center justify-center text-bone-faint hover:text-bone sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        {customTasks.length > 0 && (
          <p className="mt-2 text-[11px] text-bone-faint">Tap a task's text to edit it. These don't count toward your streak or Balance.</p>
        )}
      </section>
    </div>
  );
}

function StreakCard({
  streak,
  best,
  todayDone,
  doneToday,
  last7,
}: {
  streak: number;
  best: number;
  todayDone: boolean;
  doneToday: number;
  last7: { key: string; counts: boolean }[];
}) {
  const left = Math.max(STREAK_MIN_DONE - doneToday, 0);
  const hint = todayDone
    ? "Today counts. Keep going."
    : streak > 0
      ? `${left} more today to make it ${streak + 1}.`
      : `Finish ${STREAK_MIN_DONE} of ${TASKS_PER_DAY} today to start a streak.`;

  return (
    <div className="mt-6 rounded-xl bg-ink-900 border border-ink-800 p-4 flex items-center gap-4">
      <div className="min-w-[64px]">
        <p className="text-3xl font-semibold tabular-nums leading-none">{streak}</p>
        <p className="mt-1 text-[11px] text-bone-faint">day streak</p>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex gap-1.5">
          {last7.map((day, i) => {
            const isToday = i === last7.length - 1;
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
          {best > streak && <span className="text-bone-faint"> Best: {best}.</span>}
        </p>
      </div>
    </div>
  );
}

function ClassesToday() {
  const classes = classesFor();
  if (classes.length === 0) return null;

  return (
    <section className="mt-4 rounded-xl border border-ink-800 px-4 py-3">
      <h2 className="text-[11px] font-medium text-bone-faint">Classes today · group L4</h2>
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

function Check({ checked }: { checked: boolean }) {
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

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "error") {
    return (
      <button onClick={onRetry} className="font-mono text-xs text-accent-soft underline underline-offset-4">
        Not saved · retry
      </button>
    );
  }
  const label = state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "";
  return <span className="font-mono text-xs text-bone-faint h-4">{label}</span>;
}

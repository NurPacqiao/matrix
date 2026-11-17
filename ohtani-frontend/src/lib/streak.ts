import type { DayLog, Task } from "../types";
import { utcDateKey } from "./dates";

// A day counts toward the streak when at least 3 of its 4 plan tasks are done
// (older 3-task days need all 3). Strict enough to matter, loose enough not to
// snap after one bad slot.
export const STREAK_MIN_DONE = 3;

export function dayCounts(tasks: Task[] | undefined): boolean {
  if (!tasks || tasks.length === 0) return false;
  const done = tasks.filter((t) => t.isCompleted).length;
  return done >= Math.min(STREAK_MIN_DONE, tasks.length);
}

/**
 * Current streak. Today only adds to it once it counts; until then the streak
 * from yesterday backwards is shown as still alive.
 * Pass todayTasks to use live (unsaved) state for today.
 */
export function computeStreak(history: DayLog[], todayTasks?: Task[]) {
  const byDate = new Map(history.map((d) => [d.date, d.lockedTasks]));
  const todayKey = utcDateKey(0);
  if (todayTasks) byDate.set(todayKey, todayTasks);

  let past = 0;
  for (let i = 1; i < 400 && dayCounts(byDate.get(utcDateKey(i))); i++) past++;

  const todayDone = dayCounts(byDate.get(todayKey));
  let best = 0;
  let run = 0;
  for (let i = 399; i >= 0; i--) {
    run = dayCounts(byDate.get(utcDateKey(i))) ? run + 1 : 0;
    best = Math.max(best, run);
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const key = utcDateKey(6 - i);
    return { key, counts: dayCounts(byDate.get(key)) };
  });

  return { streak: past + (todayDone ? 1 : 0), todayDone, best, last7 };
}

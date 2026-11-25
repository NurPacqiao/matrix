import type { DayLog, Task } from "../types";
import { dateKeyDaysAgo } from "./dates";
import { HISTORY_DAYS } from "./history";

// A day counts toward the streak when about three quarters of its plan is done:
// 7 of 9, 6 of 8, and 3 of 4 (or all 3) on older days. Strict enough to matter,
// loose enough not to snap after one bad slot.
export const streakMinDone = (planSize: number) => Math.ceil(planSize * 0.75);

export function dayCounts(tasks: Task[] | undefined): boolean {
  if (!tasks || tasks.length === 0) return false;
  const done = tasks.filter((t) => t.isCompleted).length;
  return done >= streakMinDone(tasks.length);
}

export interface Streak {
  streak: number;
  best: number;
  todayDone: boolean;
  last7: { key: string; counts: boolean }[]; // oldest first
}

/**
 * Current streak. Today only adds to it once it counts; until then the streak
 * from yesterday backwards is shown as still alive.
 */
export function computeStreak(history: DayLog[], today = new Date()): Streak {
  const byDate = new Map(history.map((d) => [d.date, d.lockedTasks]));
  // Index = days ago
  const counts = Array.from({ length: HISTORY_DAYS }, (_, i) => dayCounts(byDate.get(dateKeyDaysAgo(i, today))));

  const todayDone = counts[0];
  let streak = todayDone ? 1 : 0;
  for (let i = 1; i < counts.length && counts[i]; i++) streak++;

  let best = 0;
  let run = 0;
  for (const counted of counts) {
    run = counted ? run + 1 : 0;
    best = Math.max(best, run);
  }

  const last7 = Array.from({ length: 7 }, (_, i) => ({ key: dateKeyDaysAgo(6 - i, today), counts: counts[6 - i] }));

  return { streak, best, todayDone, last7 };
}

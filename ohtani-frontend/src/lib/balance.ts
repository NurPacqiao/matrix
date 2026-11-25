import { DIRECTIONS } from "../data/matrix";
import type { DayLog } from "../types";
import { dateKeyDaysAgo } from "./dates";
import { computeStreak } from "./streak";

export interface DirectionScore {
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

export const pct = (rate: number) => `${Math.round(rate * 100)}%`;

export function computeBalance(history: DayLog[]) {
  const byDate = new Map(history.map((d) => [d.date, d]));
  const thisWeekKeys = Array.from({ length: 7 }, (_, i) => dateKeyDaysAgo(6 - i)); // oldest → today
  const lastWeekKeys = Array.from({ length: 7 }, (_, i) => dateKeyDaysAgo(13 - i));

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

  return { scores, streak, best, doneThisWeek, plannedThisWeek, rateThis, rateLast, plannedLastWeek, weakest };
}

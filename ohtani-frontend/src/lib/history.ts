import type { DayLog } from "../types";
import { api } from "./api";

export const HISTORY_DAYS = 400; // a year for the summary, plus room for the streak

export const loadHistory = (days = 14) => api.get<DayLog[]>("/tasks/history", { days });

/** The history with one day replaced by its live (possibly unsaved) state. */
export const withDay = (history: DayLog[], day: DayLog): DayLog[] => [
  ...history.filter((d) => d.date !== day.date),
  day,
];

// How many times each matrix item has been completed as a daily plan task
export function completionsByItem(history: DayLog[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const day of history) {
    for (const task of day.lockedTasks) {
      if (task.isCompleted && task.matrixId) {
        counts.set(task.matrixId, (counts.get(task.matrixId) ?? 0) + 1);
      }
    }
  }
  return counts;
}

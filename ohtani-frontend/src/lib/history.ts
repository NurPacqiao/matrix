import api from "../api";
import type { DayLog } from "../types";

export async function loadHistory(days = 14): Promise<DayLog[]> {
  const response = await api.get<DayLog[]>("/tasks/history", { params: { days } });
  return response.data;
}

// How many times each matrix item has been completed as one of the daily three
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

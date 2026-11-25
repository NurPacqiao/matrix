import type { Task } from "../types";
import { api } from "./api";

export interface DayTasks {
  lockedTasks: Task[];
  customTasks: Task[];
}

export const loadTasks = (date: string) => api.get<DayTasks>("/tasks", { date });

// The day is explicit: a save that lands after midnight still belongs to the day it was made on
export const saveTasks = (date: string, tasks: DayTasks) => api.post("/tasks", { date, ...tasks });

/** Tick or untick one task. Counted tasks log their target when ticked and clear it when unticked. */
export function toggleTask(tasks: Task[], index: number): Task[] {
  return tasks.map((task, i) => {
    if (i !== index) return task;
    const isCompleted = !task.isCompleted;
    if (!task.target) return { ...task, isCompleted };
    return { ...task, isCompleted, amount: isCompleted ? Math.max(task.amount ?? 0, task.target) : 0 };
  });
}

/** Log more or less of a counted task. It is done once the amount reaches its target. */
export function changeAmount(tasks: Task[], index: number, by: number): Task[] {
  return tasks.map((task, i) => {
    if (i !== index || !task.target) return task;
    const amount = Math.max((task.amount ?? 0) + by, 0);
    return { ...task, amount, isCompleted: amount >= task.target };
  });
}

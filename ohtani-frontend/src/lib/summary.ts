import type { DayLog, Task } from "../types";
import { utcDateKey } from "./dates";
import { countsPomos } from "./plan";

/**
 * Totals for the Balance summary: Pomodoros per direction, pages, applications, and how
 * often each daily habit got done, over a rolling window of days.
 *
 * The thesis counts the Pomodoros logged on its counter, even short of the target.
 * Days from before the plan stored Pomodoros and amounts are estimated: Pomodoros come
 * from the task text ("3 Pomodoros"), and the old combined daily standard counts as
 * 10 pages read and a clean day.
 */

export interface Tally {
  done: number;
  planned: number;
}

export interface Summary {
  days: number; // days in the window that had a plan
  pomos: number;
  pomosByDirection: Map<number, number>;
  thesis: Tally; // done = Pomodoros logged, planned = the daily goals added up
  pages: Tally; // done = pages read, planned = the targets added up
  applications: Tally;
  workouts: Tally;
  stretches: Tally;
  clean: Tally;
  dhikr: Tally;
  plan: Tally;
}

const OLD_STANDARD_PAGES = 10;

export function taskPomos(task: Task): number {
  if (countsPomos(task.trackId) && task.amount != null) return task.amount;
  if (!task.isCompleted) return 0;
  if (task.pomos != null) return task.pomos;
  const match = task.text.match(/(\d+)\s*Pomodoros?/i);
  return match ? Number(match[1]) : 0;
}

// Counted tasks: the amount logged, or the target when it was ticked before amounts existed
const logged = (task: Task, fallbackTarget: number) =>
  task.amount ?? (task.isCompleted ? task.target ?? fallbackTarget : 0);

const tally = (): Tally => ({ done: 0, planned: 0 });
const add = (t: Tally, done: boolean | number, planned = 1) => {
  t.done += typeof done === "number" ? done : done ? 1 : 0;
  t.planned += planned;
};

export function summarize(tasksByDay: Task[][]): Summary {
  const s: Summary = {
    days: 0,
    pomos: 0,
    pomosByDirection: new Map(),
    thesis: tally(),
    pages: tally(),
    applications: tally(),
    workouts: tally(),
    stretches: tally(),
    clean: tally(),
    dhikr: tally(),
    plan: tally(),
  };

  for (const tasks of tasksByDay) {
    if (tasks.length > 0) s.days++;
    for (const task of tasks) {
      add(s.plan, task.isCompleted);
      const pomos = taskPomos(task);
      if (pomos && task.directionId) {
        s.pomos += pomos;
        s.pomosByDirection.set(task.directionId, (s.pomosByDirection.get(task.directionId) ?? 0) + pomos);
      }
      switch (task.trackId) {
        case "thesis":
          add(s.thesis, pomos, task.target ?? Number(task.text.match(/(\d+)\s*Pomodoros?/i)?.[1] ?? 0));
          break;
        case "reading":
          add(s.pages, logged(task, OLD_STANDARD_PAGES), task.target ?? OLD_STANDARD_PAGES);
          break;
        case "jobs":
          add(s.applications, logged(task, 3), task.target ?? 3);
          break;
        case "push":
        case "pullLegs":
          add(s.workouts, task.isCompleted);
          break;
        case "stretch":
          add(s.stretches, task.isCompleted);
          break;
        case "clean":
          add(s.clean, task.isCompleted);
          break;
        case "dhikr":
          add(s.dhikr, task.isCompleted);
          break;
        case "standard": // the old "read 10 pages · no short-form video" task
          add(s.pages, task.isCompleted ? OLD_STANDARD_PAGES : 0, OLD_STANDARD_PAGES);
          add(s.clean, task.isCompleted);
          break;
      }
    }
  }
  return s;
}

// Plan tasks for `length` days ending `endDaysAgo` days before today (UTC, like the API)
export function windowTasks(byDate: Map<string, DayLog>, length: number, endDaysAgo = 0): Task[][] {
  return Array.from({ length }, (_, i) => byDate.get(utcDateKey(endDaysAgo + i))?.lockedTasks ?? []);
}

// Pomodoros per calendar month for the last 12 months, oldest first
export function pomosByMonth(byDate: Map<string, DayLog>): { month: string; pomos: number }[] {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
    return { month: d.toISOString().slice(0, 7), pomos: 0 };
  });
  const index = new Map(months.map((m, i) => [m.month, i]));
  for (const [date, day] of byDate) {
    const i = index.get(date.slice(0, 7));
    if (i === undefined) continue;
    months[i].pomos += day.lockedTasks.reduce((sum, t) => sum + taskPomos(t), 0);
  }
  return months;
}

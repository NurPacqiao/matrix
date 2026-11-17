import type { DayLog, Task } from "../types";

/**
 * The daily plan: 4 short, precise tasks on a fixed weekly schedule (no randomness).
 *
 *   1. Thesis project: 3 Pomodoros, every day
 *   2. One subject: 2 Pomodoros, following the group L4 timetable
 *      (prep for the next lab; Fri/Sat go to the egzamin inżynierski)
 *   3. Body: home workout (bodyweight + backpack) or food / weigh-in
 *   4. Daily standard: read 10 pages, no Reels/Shorts, no PMO
 *
 * That's 5 of your 9-10 daily Pomodoros, leaving room for dev and job work as custom tasks.
 *
 * Tracks with progression (exam topics, workouts) only advance after you complete a step,
 * so a skipped step comes back next time instead of being lost.
 */

interface Track {
  directionId: number;
  matrixId: number;
  step: (n: number) => string; // n = how many times this track has been completed before
}

const EXAM_TOPICS = 60; // set this to the size of your egzamin inżynierski question list

const TRACKS: Record<string, Track> = {
  // ---- University ----
  thesis: { directionId: 4, matrixId: 27, step: () => "Thesis project: 3 Pomodoros" },
  wp: { directionId: 4, matrixId: 28, step: () => "Wzorce Projektowe: 2 Pomodoros (Mon lab)" },
  pzsi: { directionId: 4, matrixId: 28, step: () => "PZSI: 2 Pomodoros (Tue lab)" },
  iiad: { directionId: 4, matrixId: 28, step: () => "IiAD: 2 Pomodoros (Wed lab)" },
  krypto: { directionId: 4, matrixId: 28, step: () => "Kryptografia: 2 Pomodoros (Thu lab)" },
  to: { directionId: 4, matrixId: 28, step: () => "TO: 2 Pomodoros on lab tasks" },
  exam: {
    directionId: 4,
    matrixId: 29,
    step: (n) =>
      n < EXAM_TOPICS
        ? `Egzamin: topic ${n + 1}/${EXAM_TOPICS}, 2 Pomodoros`
        : `Egzamin: re-test topic ${((n - EXAM_TOPICS) % EXAM_TOPICS) + 1} from memory, 1 Pomodoro`,
  },

  // ---- Body: home calisthenics, no bar. Level goes up every 2 completed sessions. ----
  push: {
    directionId: 5,
    matrixId: 33,
    step: (n) => {
      const level = Math.min(Math.floor(n / 2), 5);
      const heavier = Math.floor(n / 2) > 5 ? " (backpack on)" : "";
      return `Push: 4×${10 + 2 * level} push-ups, 3×${8 + level} chair dips, 3×${6 + level} pike push-ups${heavier}`;
    },
  },
  pullLegs: {
    directionId: 5,
    matrixId: 36,
    step: (n) => {
      const level = Math.min(Math.floor(n / 2), 5);
      const heavier = Math.floor(n / 2) > 5 ? ", heavier backpack" : "";
      return `Pull + legs: 4×${10 + level} backpack rows, 3×${8 + level} split squats/leg${heavier}`;
    },
  },
  fuel: { directionId: 5, matrixId: 34, step: () => "Eat 2,800 kcal + 125 g protein" },
  weighIn: { directionId: 5, matrixId: 35, step: () => "Weigh in before breakfast, note it" },

  // ---- Daily standard ----
  standard: { directionId: 6, matrixId: 41, step: () => "Read 10 pages · no Reels/Shorts · no PMO" },
};

// Index = Date.getDay() (0 = Sunday). The subject slot preps the next day's lab.
const WEEK: string[][] = [
  ["thesis", "wp", "weighIn", "standard"], // Sun → Mon WP lab
  ["thesis", "pzsi", "push", "standard"], // Mon → Tue PZSI lab
  ["thesis", "iiad", "pullLegs", "standard"], // Tue → Wed IiAD lab
  ["thesis", "krypto", "fuel", "standard"], // Wed → Thu Kryptografia lab
  ["thesis", "to", "push", "standard"], // Thu: TO lab tonight
  ["thesis", "exam", "fuel", "standard"], // Fri
  ["thesis", "exam", "pullLegs", "standard"], // Sat
];

export const TASKS_PER_DAY = 4;

export function buildDailyPlan(history: DayLog[], date = new Date()): Task[] {
  const completed = new Map<string, number>();
  for (const day of history) {
    for (const task of day.lockedTasks) {
      if (task.isCompleted && task.trackId) {
        completed.set(task.trackId, (completed.get(task.trackId) ?? 0) + 1);
      }
    }
  }

  return WEEK[date.getDay()].map((trackId) => {
    const track = TRACKS[trackId];
    const n = completed.get(trackId) ?? 0;
    return {
      text: track.step(n),
      isCompleted: false,
      matrixId: track.matrixId,
      directionId: track.directionId,
      trackId,
      step: n + 1,
    };
  });
}

// Today's log needs a rebuild if it was made by an older version of the plan
export function isCurrentPlan(tasks: Task[]): boolean {
  return tasks.length === TASKS_PER_DAY && tasks.every((t) => t.trackId && t.trackId in TRACKS);
}

// Tracks where "step N" means something (others repeat the same task)
export const PROGRESSIVE_TRACKS = new Set(["exam", "push", "pullLegs"]);

import type { DayLog, Task } from "../types";

/**
 * The daily plan: 4 short, precise tasks on a fixed weekly schedule (no randomness).
 *
 *   1. Thesis project: 3 Pomodoros, every day
 *   2. One course: 2 Pomodoros, prepping the next day's lab (Fri/Sat: final exam topics)
 *   3. Body: home workout (bodyweight + backpack) or nutrition / weigh-in
 *   4. Daily standard
 *
 * Tracks with progression (exam topics, workouts) only advance after you complete a step,
 * so a skipped step comes back next time instead of being lost.
 *
 * The wording here is generic. Personal wording (course names, targets, the daily
 * standard) comes from the user's config in the database via `wording`.
 */

interface Track {
  directionId: number;
  matrixId: number;
  step: (n: number) => string; // n = how many times this track has been completed before
}

const EXAM_TOPICS = 60; // set this to the size of your final exam question list

const TRACKS: Record<string, Track> = {
  // ---- University ----
  thesis: { directionId: 4, matrixId: 27, step: () => "Thesis project: 3 Pomodoros" },
  // Track ids are kept short and stable because past days reference them
  wp: { directionId: 4, matrixId: 28, step: () => "Course: 2 Pomodoros (Mon lab)" },
  pzsi: { directionId: 4, matrixId: 28, step: () => "Course: 2 Pomodoros (Tue lab)" },
  iiad: { directionId: 4, matrixId: 28, step: () => "Course: 2 Pomodoros (Wed lab)" },
  krypto: { directionId: 4, matrixId: 28, step: () => "Course: 2 Pomodoros (Thu lab)" },
  to: { directionId: 4, matrixId: 28, step: () => "Course: 2 Pomodoros on lab tasks" },
  exam: {
    directionId: 4,
    matrixId: 29,
    step: (n) =>
      n < EXAM_TOPICS
        ? `Final exam: topic ${n + 1}/${EXAM_TOPICS}, 2 Pomodoros`
        : `Final exam: re-test topic ${((n - EXAM_TOPICS) % EXAM_TOPICS) + 1} from memory, 1 Pomodoro`,
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
  fuel: { directionId: 5, matrixId: 34, step: () => "Hit today's calorie + protein target" },
  weighIn: { directionId: 5, matrixId: 35, step: () => "Weigh in before breakfast, note it" },

  // ---- Daily standard ----
  standard: { directionId: 6, matrixId: 41, step: () => "Read 10 pages · no short-form video" },
};

// Index = Date.getDay() (0 = Sunday). The course slot preps the next day's lab.
const WEEK: string[][] = [
  ["thesis", "wp", "weighIn", "standard"], // Sun → Mon lab
  ["thesis", "pzsi", "push", "standard"], // Mon → Tue lab
  ["thesis", "iiad", "pullLegs", "standard"], // Tue → Wed lab
  ["thesis", "krypto", "fuel", "standard"], // Wed → Thu lab
  ["thesis", "to", "push", "standard"], // Thu: evening lab
  ["thesis", "exam", "fuel", "standard"], // Fri
  ["thesis", "exam", "pullLegs", "standard"], // Sat
];

// Tracks where "step N" means something (others repeat the same task)
export const PROGRESSIVE_TRACKS = new Set(["exam", "push", "pullLegs"]);

export const TASKS_PER_DAY = 4;

export function buildDailyPlan(
  history: DayLog[],
  wording: Record<string, string> = {},
  examLabel?: string,
  date = new Date(),
): Task[] {
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
    // Personal wording replaces the generic text, except on tracks whose text carries the progression
    let text = PROGRESSIVE_TRACKS.has(trackId) ? track.step(n) : wording[trackId] ?? track.step(n);
    if (trackId === "exam" && examLabel) text = text.replace("Final exam", examLabel);
    return {
      text,
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

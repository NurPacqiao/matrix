import type { DayLog, Task } from "../types";
import { dateKey } from "./dates";

/**
 * The daily plan: 8-9 short, precise tasks on a fixed weekly schedule (no randomness).
 *
 * University comes first, then the plan changes in phases (see PHASES):
 *   exams:  thesis (3+ Pomodoros, counted) + final exam practice (3 Pomodoros) every day,
 *           plus a course on the evenings before a lab (Sun-Thu)
 *   light:  the week after the exams, about half the tasks
 *   buffer: university paperwork or a resit
 *   build:  backend and frontend work
 *
 * On top of that, every day:
 *   Career:     Monkeytype (1 Pomodoro) + the CV, then job applications
 *   Focus:      reading
 *   Discipline: the daily clean-day standard
 *   Character:  prayers (counted) + dhikr, one task
 *   Physique:   4 workouts a week, a stretching session on the days in between. Light at
 *               first, then a stretch-only break, then longer kettlebell sessions (see BODY_*).
 *
 * Tracks with progression (workouts, stretching) only advance after you
 * complete a step, so a skipped step comes back next time instead of being lost.
 *
 * The wording here is generic. Personal wording (course names, the daily standard, dhikr)
 * comes from the user's config in the database via `wording`.
 */

interface Track {
  directionId: number;
  matrixId: number | null;
  step: (n: number) => string; // n = how many times this track has been completed before
  pomos?: number; // Pomodoros the task is worth once done
  target?: number; // counted tasks: the daily amount (more is fine)
  unit?: string; // counted tasks: what the amount counts ("Pomodoros" counts toward the Pomodoro totals)
  stepBy?: number; // counted tasks: how much one tap on + or − changes
}

// The last local day of each phase; after the last one comes "build"
export const PHASES = {
  exams: "2027-02-03",
  light: "2027-02-10",
  buffer: "2027-02-19",
} as const;
export const PRIORITY_DIRECTION = 4; // University

export const CV_UNTIL = "2026-11-29"; // applications wait until the CV is rewritten
export const BODY_LIGHT_UNTIL = "2027-02-07";
export const BODY_STRETCH_UNTIL = "2027-03-10"; // stretching only, then the kettlebell sessions start

// Workouts stay light: a level is added every 3 completed sessions, up to level 4
const level = (n: number) => Math.min(Math.floor(n / 3), 4);
// Kettlebell sessions: a level every 6 completed sessions, up to level 8
const kbLevel = (n: number) => Math.min(Math.floor(n / 6), 8);

// One step per completed day; the last one repeats until the CV phase ends
const CV_STEPS = [
  "CV 1/4: work experience bullets (problem → action → result)",
  "CV 2/4: projects, each with a live link and one result",
  "CV 3/4: summary + skills matched to .NET + React roles",
  "CV 4/4: LinkedIn matches the CV, final PDF exported",
];

const STRETCHES = [
  "Stretch 15 min, hips + legs: hip-flexor lunge, pigeon, hamstring fold, deep squat hold (45 s each, each side)",
  "Stretch 15 min, upper body: doorway chest, thread the needle, cat-cow, child's pose (45 s each)",
  "Stretch 15 min, full body: world's greatest stretch, cobra, seated twist, calf stretch (45 s each, each side)",
];

const TRACKS: Record<string, Track> = {
  // ---- University ----
  thesis: {
    directionId: 4,
    matrixId: 27,
    target: 3,
    unit: "Pomodoros",
    stepBy: 1,
    step: () => "Thesis project",
  },
  // Practising the exam's test questions; the id stays "questions" because past days reference it
  questions: { directionId: 4, matrixId: 29, pomos: 3, step: () => "Final exam: 3 Pomodoros" },
  // Track ids are kept short and stable because past days reference them
  wp: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros (Mon lab)" },
  pzsi: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros (Tue lab)" },
  iiad: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros (Wed lab)" },
  krypto: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros (Thu lab)" },
  to: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros on lab tasks" },

  paperwork: { directionId: 4, matrixId: 31, pomos: 2, step: () => "University: 2 Pomodoros (paperwork or resit)" },

  // ---- After the degree ----
  backend: { directionId: 1, matrixId: 1, pomos: 2, step: () => "Backend: 2 Pomodoros of C# / ASP.NET Core" },
  frontend: { directionId: 2, matrixId: 9, pomos: 2, step: () => "Frontend: 2 Pomodoros of React + TypeScript" },

  // ---- Career ----
  typing: { directionId: 3, matrixId: 18, pomos: 1, step: () => "Monkeytype: 1 Pomodoro" },
  cv: { directionId: 3, matrixId: 20, step: (n) => CV_STEPS[Math.min(n, CV_STEPS.length - 1)] },
  jobs: {
    directionId: 3,
    matrixId: 17,
    target: 3,
    unit: "applications",
    stepBy: 1,
    step: () => "Apply to 3 jobs",
  },

  // ---- Focus, discipline, character ----
  reading: { directionId: 7, matrixId: 49, target: 10, unit: "pages", stepBy: 5, step: () => "Read 10 pages" },
  clean: { directionId: 6, matrixId: 41, step: () => "Clean day: no short-form video" },
  // Replaced the plain "dhikr" tick. A new id, because an old dhikr tick says nothing about prayers.
  prayers: { directionId: 8, matrixId: 57, target: 5, unit: "prayers", stepBy: 1, step: () => "5 prayers + dhikr" },

  // ---- Body: light home calisthenics, no bar, ~20 min with a short cool-down ----
  push: {
    directionId: 5,
    matrixId: 33,
    step: (n) => {
      const l = level(n);
      return `Push: 3×${8 + 2 * l} push-ups, 3×${6 + l} chair dips, 3×${5 + l} pike push-ups, then 3 min stretch`;
    },
  },
  pullLegs: {
    directionId: 5,
    matrixId: 33,
    step: (n) => {
      const l = level(n);
      return `Pull + legs: 3×${8 + l} backpack rows, 3×${10 + 2 * l} squats, 3×${6 + l} split squats/leg, then 3 min stretch`;
    },
  },
  stretch: { directionId: 5, matrixId: 36, step: (n) => STRETCHES[n % STRETCHES.length] },

  // ---- Body, later: ~45 min with a 16 kg kettlebell and bodyweight, no bar ----
  kbPush: {
    directionId: 5,
    matrixId: 33,
    step: (n) => {
      const l = kbLevel(n);
      return `Push 45 min: 4×${6 + l} pike push-ups, 4×${12 + l} slow push-ups, 3×${8 + l} kettlebell floor press/side, 3×${8 + l} chair dips, then 5 min stretch`;
    },
  },
  kbPullLegs: {
    directionId: 5,
    matrixId: 33,
    step: (n) => {
      const l = kbLevel(n);
      return `Pull + legs 45 min: 4×${8 + l} kettlebell rows/side, 4×${10 + l} goblet squats, 3×${8 + l} split squats/leg, 4×${15 + l} swings, then 5 min stretch`;
    },
  },
};

// All indexed by Date.getDay() (0 = Sunday). The course slot preps the next day's lab.
const COURSES: string[][] = [["wp"], ["pzsi"], ["iiad"], ["krypto"], ["to"], [], []];
// Workouts Mon/Wed/Fri/Sat, stretching on the days after a workout
const BODY_LIGHT = ["stretch", "push", "stretch", "pullLegs", "stretch", "push", "pullLegs"];
const BODY_KETTLEBELL = ["stretch", "kbPush", "stretch", "kbPullLegs", "stretch", "kbPush", "kbPullLegs"];

function bodyFor(key: string, day: number): string {
  if (key <= BODY_LIGHT_UNTIL) return BODY_LIGHT[day];
  return key <= BODY_STRETCH_UNTIL ? "stretch" : BODY_KETTLEBELL[day];
}

function tracksFor(date: Date): string[] {
  const day = date.getDay();
  const key = dateKey(date);
  const body = bodyFor(key, day);
  const daily = ["typing", key <= CV_UNTIL ? "cv" : "jobs", "reading", "clean", "prayers"];

  if (key <= PHASES.exams) return ["thesis", "questions", ...COURSES[day], ...daily, body];
  if (key <= PHASES.light) return ["jobs", "reading", "clean", "prayers", body];
  if (key <= PHASES.buffer) return ["paperwork", ...daily, body];
  return ["backend", "frontend", ...daily, body];
}

// Tracks where "step N" means something (others repeat the same task)
export const PROGRESSIVE_TRACKS = new Set(["push", "pullLegs", "stretch", "kbPush", "kbPullLegs"]);

export const MAX_TASKS_PER_DAY = 9;

// Counted tasks (thesis Pomodoros, pages, applications, prayers): the unit and the step for the − / + buttons
export function countedTrack(trackId: string | null | undefined) {
  const track = trackId ? TRACKS[trackId] : undefined;
  return track?.unit ? { unit: track.unit, stepBy: track.stepBy ?? 1 } : undefined;
}

export function buildDailyPlan(
  history: DayLog[],
  wording: Record<string, string> = {},
  examLabel?: string,
  date = new Date(),
): Task[] {
  // Only earlier days: rebuilding today's plan mustn't count today's own ticks as progress
  const today = dateKey(date);
  const completed = new Map<string, number>();
  for (const day of history) {
    if (day.date >= today) continue;
    for (const task of day.lockedTasks) {
      if (task.isCompleted && task.trackId) {
        completed.set(task.trackId, (completed.get(task.trackId) ?? 0) + 1);
      }
    }
  }

  return tracksFor(date).map((trackId) => {
    const track = TRACKS[trackId];
    const n = completed.get(trackId) ?? 0;
    // Personal wording replaces the generic text, except on tracks whose text carries the progression
    let text = PROGRESSIVE_TRACKS.has(trackId) ? track.step(n) : wording[trackId] ?? track.step(n);
    if (trackId === "questions" && examLabel) text = text.replace("Final exam", examLabel);
    return {
      text,
      isCompleted: false,
      matrixId: track.matrixId,
      directionId: track.directionId,
      trackId,
      step: n + 1,
      pomos: track.pomos ?? null,
      target: track.target ?? null,
      amount: track.target ? 0 : null,
    };
  });
}

// Counted in Pomodoros: the logged amount goes into the Pomodoro totals, ticked or not
export const countsPomos = (trackId: string | null | undefined) => countedTrack(trackId)?.unit === "Pomodoros";

// Today's log needs a rebuild if it was made by an older version of the plan
export function isCurrentPlan(tasks: Task[], date = new Date()): boolean {
  const expected = tracksFor(date);
  return (
    tasks.length === expected.length &&
    tasks.every((t, i) => t.trackId === expected[i] && (t.target ?? null) === (TRACKS[expected[i]].target ?? null))
  );
}

// Old tracks whose tick still means something on the current plan
const REPLACED_BY: Record<string, string[]> = { standard: ["reading", "clean"], exam: ["questions"] };

// When today's plan is rebuilt, keep what was already ticked or logged on tracks that are still there
export function carryOver(fresh: Task[], old: Task[]): Task[] {
  return fresh.map((task) => {
    const before = old.find(
      (t) => t.trackId === task.trackId || (t.isCompleted && REPLACED_BY[t.trackId ?? ""]?.includes(task.trackId!)),
    );
    if (!before) return task;
    if (!task.target) return { ...task, isCompleted: before.isCompleted };

    // An old tick counts as the full target, even from before amounts were logged
    const amount = Math.max(before.amount ?? 0, before.isCompleted ? task.target : 0);
    return { ...task, amount, isCompleted: amount >= task.target };
  });
}

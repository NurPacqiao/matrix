import type { DayLog, Task } from "../types";

/**
 * The daily plan: 8-9 short, precise tasks on a fixed weekly schedule (no randomness).
 *
 * Until the degree is done (PRIORITY_UNTIL), university comes first:
 *   University: thesis (3+ Pomodoros, counted) + final exam practice (2 Pomodoros) every day,
 *               plus a course on the evenings before a lab (Sun-Thu)
 *   Career:     Monkeytype (1 Pomodoro) + job applications
 *   Focus:      reading
 *   Discipline: the daily clean-day standard
 *   Character:  daily dhikr
 *   Physique:   4 light workouts a week, a stretching session on the days in between
 *
 * After PRIORITY_UNTIL the thesis and exam slots become backend and frontend work,
 * and the course slot drops out.
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

export const PRIORITY_UNTIL = "2027-02-15"; // local date; the degree-first plan runs through this day

// Workouts stay light: a level is added every 3 completed sessions, up to level 4
const level = (n: number) => Math.min(Math.floor(n / 3), 4);

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
  questions: { directionId: 4, matrixId: 29, pomos: 2, step: () => "Final exam: 2 Pomodoros" },
  // Track ids are kept short and stable because past days reference them
  wp: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros (Mon lab)" },
  pzsi: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros (Tue lab)" },
  iiad: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros (Wed lab)" },
  krypto: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros (Thu lab)" },
  to: { directionId: 4, matrixId: 28, pomos: 2, step: () => "Course: 2 Pomodoros on lab tasks" },

  // ---- After the degree ----
  backend: { directionId: 1, matrixId: 1, pomos: 2, step: () => "Backend: 2 Pomodoros of C# / ASP.NET Core" },
  frontend: { directionId: 2, matrixId: 9, pomos: 2, step: () => "Frontend: 2 Pomodoros of React + TypeScript" },

  // ---- Career ----
  typing: { directionId: 3, matrixId: 18, pomos: 1, step: () => "Monkeytype: 1 Pomodoro" },
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
  dhikr: { directionId: 8, matrixId: 57, step: () => "Dhikr: 300 + 300" },

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
};

// Index = Date.getDay() (0 = Sunday). The course slot preps the next day's lab.
// Workouts Mon/Wed/Fri/Sat, stretching on the days after a workout.
const UNI_WEEK: string[][] = [
  ["thesis", "questions", "wp", "stretch"], // Sun → Mon lab
  ["thesis", "questions", "pzsi", "push"], // Mon → Tue lab
  ["thesis", "questions", "iiad", "stretch"], // Tue → Wed lab
  ["thesis", "questions", "krypto", "pullLegs"], // Wed → Thu lab
  ["thesis", "questions", "to", "stretch"], // Thu: evening lab
  ["thesis", "questions", "push"], // Fri
  ["thesis", "questions", "pullLegs"], // Sat
];
const DAILY = ["typing", "jobs", "reading", "clean", "dhikr"];

const BODY = ["stretch", "push", "stretch", "pullLegs", "stretch", "push", "pullLegs"];

function tracksFor(date: Date): string[] {
  const day = date.getDay();
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (key <= PRIORITY_UNTIL) {
    const uni = UNI_WEEK[day];
    return [...uni.slice(0, -1), ...DAILY, uni[uni.length - 1]];
  }
  return ["backend", "frontend", ...DAILY, BODY[day]];
}

// Tracks where "step N" means something (others repeat the same task)
export const PROGRESSIVE_TRACKS = new Set(["push", "pullLegs", "stretch"]);

export const MAX_TASKS_PER_DAY = 9;

// Counted tasks (thesis Pomodoros, pages, applications): the unit and the step for the − / + buttons
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
  const completed = new Map<string, number>();
  for (const day of history) {
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

// When today's plan is rebuilt, keep what was already ticked on tracks that are still there
export function carryOver(fresh: Task[], old: Task[]): Task[] {
  return fresh.map((task) => {
    const before = old.find(
      (t) => t.isCompleted && (t.trackId === task.trackId || REPLACED_BY[t.trackId ?? ""]?.includes(task.trackId!)),
    );
    return before ? { ...task, isCompleted: true, amount: task.target ?? task.amount } : task;
  });
}

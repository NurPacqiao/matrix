import { describe, expect, it } from "vitest";
import type { DayLog, Task } from "../types";
import { buildDailyPlan, carryOver, isCurrentPlan, MAX_TASKS_PER_DAY, PHASES } from "./plan";

const monday = new Date(2026, 10, 23, 12);
const planFor = (date: Date, history: DayLog[] = []) => buildDailyPlan(history, {}, undefined, date);
const byTrack = (tasks: Task[], id: string) => tasks.find((t) => t.trackId === id)!;
const log = (date: string, tasks: Task[]): DayLog => ({ date, lockedTasks: tasks, customTasks: [] });

describe("buildDailyPlan", () => {
  it("is recognised as current on its own day, every day of the year", () => {
    for (let i = 0; i < 365; i++) {
      const day = new Date(2026, 10, 23 + i, 12);
      const plan = planFor(day);
      expect(isCurrentPlan(plan, day)).toBe(true);
      expect(plan.length).toBeLessThanOrEqual(MAX_TASKS_PER_DAY);
      expect(new Set(plan.map((t) => t.trackId)).size).toBe(plan.length);
    }
  });

  it("changes phase at midnight after each phase's last day", () => {
    const edges = (key: string) => {
      const [y, m, d] = key.split("-").map(Number);
      return [new Date(y, m - 1, d, 23, 59), new Date(y, m - 1, d + 1, 0, 0)].map((date) => planFor(date)[0].trackId);
    };
    expect(edges(PHASES.exams)).toEqual(["thesis", "jobs"]);
    expect(edges(PHASES.light)).toEqual(["jobs", "paperwork"]);
    expect(edges(PHASES.buffer)).toEqual(["paperwork", "backend"]);
  });

  it.each([
    [new Date(2026, 10, 29, 12), 9], // Sunday, exams
    [new Date(2026, 10, 28, 12), 8], // Saturday, no course
    [new Date(2027, 1, 5, 12), 5], // lighter week
    [new Date(2027, 1, 15, 12), 7], // paperwork or resit
    [new Date(2027, 1, 22, 12), 8], // building
  ])("plans the right number of tasks on %s", (date, size) => {
    expect(planFor(date)).toHaveLength(size);
  });

  it("adds up to 9 planned Pomodoros Sun-Thu and 7 Fri-Sat during the exams", () => {
    const pomos = (date: Date) =>
      planFor(date).reduce((sum, t) => sum + (t.trackId === "thesis" ? t.target! : t.pomos ?? 0), 0);
    expect([0, 1, 2, 3, 4, 5, 6].map((i) => pomos(new Date(2026, 11, 6 + i, 12)))).toEqual([9, 9, 9, 9, 9, 7, 7]);
  });

  it("works on the CV first, one step per completed day, then on applications", () => {
    const thursday = new Date(2026, 10, 26, 12);
    const friday = new Date(2026, 10, 27, 12);
    const done = planFor(thursday).map((t) => ({ ...t, isCompleted: true }));
    expect(byTrack(planFor(thursday), "cv").text).toMatch(/^CV 1\/4/);
    expect(byTrack(planFor(friday, [log("2026-11-26", done)]), "cv").text).toMatch(/^CV 2\/4/);
    expect(byTrack(planFor(new Date(2026, 10, 29, 12)), "jobs")).toBeUndefined();
    expect(byTrack(planFor(new Date(2026, 10, 30, 12)), "cv")).toBeUndefined();
    expect(byTrack(planFor(new Date(2026, 10, 30, 12)), "jobs").target).toBe(3);
  });

  it("trains light, then only stretches, then moves to the kettlebell", () => {
    const body = (date: Date) => planFor(date).at(-1)!.trackId;
    const week = (y: number, m: number, d: number) => Array.from({ length: 7 }, (_, i) => body(new Date(y, m, d + i, 12)));
    expect(week(2027, 1, 1)).toEqual(["push", "stretch", "pullLegs", "stretch", "push", "pullLegs", "stretch"]);
    expect(new Set(week(2027, 1, 8))).toEqual(new Set(["stretch"]));
    expect(body(new Date(2027, 2, 10, 12))).toBe("stretch");
    expect(body(new Date(2027, 2, 12, 12))).toBe("kbPush"); // the first workout day after the break
    expect(week(2027, 2, 15)).toEqual(["kbPush", "stretch", "kbPullLegs", "stretch", "kbPush", "kbPullLegs", "stretch"]);
  });

  it("advances a progressive track only for completed sessions on earlier days", () => {
    const done = planFor(monday).map((t) => ({ ...t, isCompleted: true }));
    const skipped = planFor(monday);
    expect(byTrack(planFor(monday, [log("2026-11-16", done)]), "push").step).toBe(2);
    expect(byTrack(planFor(monday, [log("2026-11-16", skipped)]), "push").step).toBe(1);
    expect(byTrack(planFor(monday, [log("2026-11-23", done)]), "push").step).toBe(1); // today itself
  });

  it("uses personal wording except where the text carries the progression", () => {
    const plan = buildDailyPlan([], { clean: "Mine", push: "Ignored", questions: "Final exam: x" }, "Exam", monday);
    expect(byTrack(plan, "clean").text).toBe("Mine");
    expect(byTrack(plan, "push").text).toMatch(/^Push:/);
    expect(byTrack(plan, "questions").text).toBe("Exam: x");
  });
});

describe("carryOver", () => {
  const afterCv = new Date(2026, 10, 30, 12); // a Monday that has the applications task
  const rebuilt = (old: Task[]) => carryOver(planFor(afterCv), old);

  it("keeps ticks, partial amounts and amounts past the target", () => {
    const old = planFor(afterCv).map((t) => {
      if (t.trackId === "thesis") return { ...t, amount: 2 };
      if (t.trackId === "jobs") return { ...t, amount: 5, isCompleted: true };
      return t.trackId === "clean" ? { ...t, isCompleted: true } : t;
    });
    const next = rebuilt(old);
    expect(byTrack(next, "thesis")).toMatchObject({ amount: 2, isCompleted: false });
    expect(byTrack(next, "jobs")).toMatchObject({ amount: 5, isCompleted: true });
    expect(byTrack(next, "clean").isCompleted).toBe(true);
    expect(byTrack(next, "prayers")).toMatchObject({ amount: 0, isCompleted: false });
  });

  it("doesn't turn an old dhikr tick into five prayers", () => {
    const next = rebuilt([{ text: "", isCompleted: true, trackId: "dhikr" }]);
    expect(byTrack(next, "prayers")).toMatchObject({ amount: 0, isCompleted: false });
  });

  it("maps retired tracks to the ones that replaced them", () => {
    const next = rebuilt([{ text: "", isCompleted: true, trackId: "standard" }]);
    expect(byTrack(next, "reading")).toMatchObject({ isCompleted: true, amount: 10 });
    expect(byTrack(next, "clean").isCompleted).toBe(true);
  });

  it("treats an old tick without an amount as the full target", () => {
    const next = rebuilt([{ text: "", isCompleted: true, trackId: "thesis" }]);
    expect(byTrack(next, "thesis")).toMatchObject({ isCompleted: true, amount: 3 });
  });
});

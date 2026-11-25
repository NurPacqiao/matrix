import { describe, expect, it } from "vitest";
import type { Task } from "../types";
import { summarize, taskPomos } from "./summary";

const task = (t: Partial<Task>): Task => ({ text: "", isCompleted: false, ...t });

describe("taskPomos", () => {
  it("counts logged thesis Pomodoros even short of the target", () => {
    expect(taskPomos(task({ trackId: "thesis", amount: 2, target: 3 }))).toBe(2);
  });

  it("counts fixed Pomodoros only once ticked", () => {
    expect(taskPomos(task({ trackId: "questions", pomos: 2 }))).toBe(0);
    expect(taskPomos(task({ trackId: "questions", pomos: 2, isCompleted: true }))).toBe(2);
  });

  it("falls back to the text for old days", () => {
    expect(taskPomos(task({ text: "Thesis: 3 Pomodoros", isCompleted: true }))).toBe(3);
  });
});

describe("summarize", () => {
  it("adds up a day", () => {
    const s = summarize([
      [
        task({ trackId: "thesis", directionId: 4, amount: 4, target: 3, isCompleted: true }),
        task({ trackId: "reading", directionId: 7, amount: 5, target: 10 }),
        task({ trackId: "jobs", directionId: 3, amount: 3, target: 3, isCompleted: true }),
        task({ trackId: "push", directionId: 5, isCompleted: true }),
      ],
      [],
    ]);
    expect(s.days).toBe(1);
    expect(s.pomos).toBe(4);
    expect(s.thesis).toEqual({ done: 4, planned: 3 });
    expect(s.pages).toEqual({ done: 5, planned: 10 });
    expect(s.applications).toEqual({ done: 3, planned: 3 });
    expect(s.workouts).toEqual({ done: 1, planned: 1 });
    expect(s.plan).toEqual({ done: 3, planned: 4 });
  });

  it("counts prayers one by one, and dhikr days across the old and the combined task", () => {
    const s = summarize([
      [task({ trackId: "dhikr", isCompleted: true })],
      [task({ trackId: "prayers", amount: 4, target: 5 })],
      [task({ trackId: "prayers", amount: 5, target: 5, isCompleted: true })],
    ]);
    expect(s.prayers).toEqual({ done: 9, planned: 10 });
    expect(s.dhikr).toEqual({ done: 2, planned: 3 });
  });

  it("counts kettlebell sessions as workouts", () => {
    const s = summarize([[task({ trackId: "kbPush", isCompleted: true }), task({ trackId: "kbPullLegs" })]]);
    expect(s.workouts).toEqual({ done: 1, planned: 2 });
  });
});

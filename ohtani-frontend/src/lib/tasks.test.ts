import { describe, expect, it } from "vitest";
import type { Task } from "../types";
import { changeAmount, toggleTask } from "./tasks";

const pages: Task = { text: "Read", isCompleted: false, target: 10, amount: 4 };

describe("toggleTask", () => {
  it("logs the target when a counted task is ticked and clears it when unticked", () => {
    const ticked = toggleTask([pages], 0);
    expect(ticked[0]).toMatchObject({ isCompleted: true, amount: 10 });
    expect(toggleTask(ticked, 0)[0]).toMatchObject({ isCompleted: false, amount: 0 });
  });

  it("leaves the other tasks alone", () => {
    const other: Task = { text: "x", isCompleted: false };
    expect(toggleTask([pages, other], 0)[1]).toBe(other);
  });
});

describe("changeAmount", () => {
  it("completes at the target, can go past it, and never below zero", () => {
    expect(changeAmount([pages], 0, 5)[0]).toMatchObject({ amount: 9, isCompleted: false });
    expect(changeAmount([pages], 0, 10)[0]).toMatchObject({ amount: 14, isCompleted: true });
    expect(changeAmount([pages], 0, -9)[0]).toMatchObject({ amount: 0, isCompleted: false });
  });
});

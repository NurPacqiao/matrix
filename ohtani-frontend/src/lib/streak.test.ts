import { describe, expect, it } from "vitest";
import type { DayLog, Task } from "../types";
import { dateKeyDaysAgo } from "./dates";
import { computeStreak, dayCounts } from "./streak";

const today = new Date(2026, 10, 25, 0, 30); // half past midnight, when UTC is still on the 24th
const tasks = (done: number, total = 9): Task[] =>
  Array.from({ length: total }, (_, i) => ({ text: "", isCompleted: i < done }));
const day = (daysAgo: number, done: number): DayLog => ({
  date: dateKeyDaysAgo(daysAgo, today),
  lockedTasks: tasks(done),
  customTasks: [],
});

describe("dayCounts", () => {
  it.each([
    [7, 9, true],
    [6, 9, false],
    [6, 8, true],
    [5, 8, false],
    [0, 0, false],
  ])("%i of %i → %s", (done, total, expected) => {
    expect(dayCounts(tasks(done, total))).toBe(expected);
  });
});

describe("computeStreak", () => {
  it("keeps yesterday's streak alive until today counts", () => {
    const past = [day(1, 9), day(2, 8), day(3, 2), day(4, 9)];
    expect(computeStreak(past, today)).toMatchObject({ streak: 2, best: 2, todayDone: false });
    expect(computeStreak([...past, day(0, 7)], today)).toMatchObject({ streak: 3, best: 3, todayDone: true });
  });

  it("remembers the best streak", () => {
    expect(computeStreak([day(5, 9), day(6, 9), day(7, 9)], today)).toMatchObject({ streak: 0, best: 3 });
  });

  it("ends the week strip on the local day", () => {
    const { last7 } = computeStreak([], today);
    expect(last7.map((d) => d.key)).toEqual([
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
    ]);
  });

  it("survives clock changes", () => {
    const afterChange = new Date(2026, 2, 30, 0, 10); // Europe moves its clocks on 29 March 2026
    expect(new Set(Array.from({ length: 400 }, (_, i) => dateKeyDaysAgo(i, afterChange))).size).toBe(400);
  });
});

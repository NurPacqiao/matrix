// Class timetable shape. The actual timetable is personal, so it lives in the
// user's config in the database (see lib/userConfig.ts), not in this public file.

export interface ClassSlot {
  start: string;
  end: string;
  subject: string;
  kind: "Lecture" | "Lab";
  remote: boolean;
}

// Key = Date.getDay() (1 = Monday)
export type Timetable = Record<number, ClassSlot[]>;

export function classesFor(timetable: Timetable, date = new Date()): ClassSlot[] {
  return timetable[date.getDay()] ?? [];
}

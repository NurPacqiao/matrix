// Informatyka IV, sem. 7, 2026/2027, group L4. Times read off the harmonogram grid
// (to the nearest 15 min). Some labs are 15h, so they may not run every week.

export interface ClassSlot {
  start: string;
  end: string;
  subject: string;
  kind: "Lecture" | "Lab";
  remote: boolean;
}

// Key = Date.getDay() (1 = Monday)
export const TIMETABLE: Record<number, ClassSlot[]> = {
  1: [
    { start: "11:30", end: "13:00", subject: "Wzorce Projektowe", kind: "Lab", remote: false },
    { start: "15:45", end: "17:15", subject: "Kryptografia", kind: "Lecture", remote: true },
    { start: "17:30", end: "19:00", subject: "Inżynieria i Analiza Danych", kind: "Lecture", remote: false },
    { start: "19:00", end: "20:30", subject: "Wzorce Projektowe", kind: "Lecture", remote: true },
  ],
  2: [{ start: "11:45", end: "13:15", subject: "PZSI", kind: "Lab", remote: false }],
  3: [{ start: "18:30", end: "20:00", subject: "IiAD", kind: "Lab", remote: false }],
  4: [
    { start: "08:00", end: "09:30", subject: "Praktyczne Zastosowania SI", kind: "Lecture", remote: true },
    { start: "11:30", end: "13:00", subject: "Kryptografia", kind: "Lab", remote: true },
    { start: "18:00", end: "21:00", subject: "TO", kind: "Lab", remote: true },
  ],
};

export function classesFor(date = new Date()): ClassSlot[] {
  return TIMETABLE[date.getDay()] ?? [];
}

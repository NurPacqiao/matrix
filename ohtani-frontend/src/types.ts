export interface Task {
  text: string;
  isCompleted: boolean;
  // Present on daily plan tasks: the matrix item (1-64) and direction (1-8) it came from
  matrixId?: number | null;
  directionId?: number | null;
  // Present on daily plan tasks: the progression track and which step of it this is
  trackId?: string | null;
  step?: number | null;
  // Present on daily plan tasks: Pomodoros the task is worth once done, and for counted
  // tasks (pages, applications) the day's target and what was actually logged
  pomos?: number | null;
  target?: number | null;
  amount?: number | null;
}

export interface DayLog {
  date: string; // yyyy-MM-dd (UTC, matches the API)
  lockedTasks: Task[];
  customTasks: Task[];
}

export type SaveState = "idle" | "saving" | "saved" | "error";

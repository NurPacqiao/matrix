// Days follow the user's own clock. A day is keyed as yyyy-MM-dd in local time, and the
// client tells the API which day it means.

export function dateKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dateKeyDaysAgo(daysAgo: number, from = new Date()): string {
  // Noon, so a clock change can't push the date over a midnight
  return dateKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() - daysAgo, 12));
}

export function formatDayLong(date = new Date()): string {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function weekdayShort(key: string): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
}

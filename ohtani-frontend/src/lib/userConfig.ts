import api from "../api";
import { DEFAULT_CELL_TEXTS } from "../data/matrix";
import type { Timetable } from "../data/timetable";

/**
 * Everything personal: the 81 matrix cells, the wording of plan tasks, and the class timetable.
 * Stored in User.MatrixJson as { version: 3, cells, tracks, timetable, ... }.
 *
 * The public code only has generic placeholders. The real content comes from the database,
 * which the API only returns to the signed-in owner.
 *
 * Seeding: src/data/private/personal.json is git-ignored and never deployed. When it exists
 * (local dev only) and the database has no v3 config yet, it is uploaded once.
 */

export interface UserConfig {
  cells: string[];
  tracks: Record<string, string>; // plan task wording by track id
  timetable: Timetable;
  examLabel?: string;
  timetableLabel?: string;
}

const VERSION = 3;

// Vite returns an empty object when the folder doesn't exist (CI builds, other machines)
const privateFiles = import.meta.glob<UserConfig>("../data/private/personal.json", {
  eager: true,
  import: "default",
});
const PERSONAL: UserConfig | undefined = Object.values(privateFiles)[0];

const fillCells = (cells: unknown): string[] =>
  DEFAULT_CELL_TEXTS.map((fallback, i) => {
    const text = Array.isArray(cells) ? cells[i] : undefined;
    return typeof text === "string" && text.trim() ? text : fallback;
  });

export const EMPTY_CONFIG: UserConfig = {
  cells: [...DEFAULT_CELL_TEXTS],
  tracks: {},
  timetable: {},
};

export async function loadConfig(): Promise<UserConfig> {
  const response = await api.get<{ matrixJson: string }>("/matrix");
  let stored: { version?: number } & Partial<UserConfig> = {};
  try {
    stored = JSON.parse(response.data.matrixJson ?? "") ?? {};
  } catch {
    // Unreadable: treat as empty
  }

  if (stored.version === VERSION) {
    return {
      ...stored,
      cells: fillCells(stored.cells),
      tracks: stored.tracks ?? {},
      timetable: stored.timetable ?? {},
    };
  }

  // Older format (v2 = cells only) or nothing saved yet
  const olderCells = stored.version === 2 ? stored.cells : undefined;

  if (PERSONAL) {
    // One-time seed from the local private file, keeping any cells edited in the app
    const seeded: UserConfig = {
      ...PERSONAL,
      cells: fillCells(olderCells ?? PERSONAL.cells).map((text, i) =>
        text === DEFAULT_CELL_TEXTS[i] ? PERSONAL.cells[i] ?? text : text,
      ),
    };
    await saveConfig(seeded);
    return seeded;
  }

  return { ...EMPTY_CONFIG, cells: fillCells(olderCells) };
}

export async function saveConfig(config: UserConfig): Promise<void> {
  await api.post("/matrix", { matrixJson: JSON.stringify({ version: VERSION, ...config }) });
}

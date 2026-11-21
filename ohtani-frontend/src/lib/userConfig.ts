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
 * (local dev only) and the database has no v3 config yet, it is uploaded once. Later on,
 * new track wording and listed cell rewrites (cellUpdates) are copied over the same way.
 */

export interface UserConfig {
  cells: string[];
  tracks: Record<string, string>; // plan task wording by track id
  timetable: Timetable;
  examLabel?: string;
  timetableLabel?: string;
}

const VERSION = 3;

// A rewrite of one matrix cell. It only applies while the cell still reads `from`,
// so a cell edited in the app is never overwritten.
interface CellUpdate {
  index: number;
  from: string;
  to: string;
}

type PersonalFile = UserConfig & { cellUpdates?: CellUpdate[] };

// Vite returns an empty object when the folder doesn't exist (CI builds, other machines)
const privateFiles = import.meta.glob<PersonalFile>("../data/private/personal.json", {
  eager: true,
  import: "default",
});
const PERSONAL_FILE: PersonalFile | undefined = Object.values(privateFiles)[0];
const CELL_UPDATES = PERSONAL_FILE?.cellUpdates ?? [];
// The config part only, so the one-time seed doesn't store cellUpdates in the database
const PERSONAL: UserConfig | undefined = PERSONAL_FILE && {
  cells: PERSONAL_FILE.cells,
  tracks: PERSONAL_FILE.tracks,
  timetable: PERSONAL_FILE.timetable,
  examLabel: PERSONAL_FILE.examLabel,
  timetableLabel: PERSONAL_FILE.timetableLabel,
};

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
    const config: UserConfig = {
      ...stored,
      cells: fillCells(stored.cells),
      tracks: stored.tracks ?? {},
      timetable: stored.timetable ?? {},
    };
    // Wording for plan tracks added after the first seed: copy it over once from the local private file
    const missing = Object.entries(PERSONAL?.tracks ?? {}).filter(([id]) => !(id in config.tracks));
    const rewrites = CELL_UPDATES.filter((u) => config.cells[u.index] === u.from);
    if (missing.length > 0 || rewrites.length > 0) {
      config.tracks = { ...config.tracks, ...Object.fromEntries(missing) };
      config.cells = config.cells.map((text, i) => rewrites.find((u) => u.index === i)?.to ?? text);
      await saveConfig(config);
    }
    return config;
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

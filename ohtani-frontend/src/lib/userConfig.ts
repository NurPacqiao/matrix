import { DEFAULT_CELL_TEXTS } from "../data/matrix";
import type { Timetable } from "../data/timetable";
import { api } from "./api";

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

// Dev server only. Without the DEV check a build on this machine would bundle the private
// file into dist/, where it could be published by accident. Vite returns an empty object
// when the folder doesn't exist (CI builds, other machines).
const privateFiles: Record<string, PersonalFile> = import.meta.env.DEV
  ? import.meta.glob<PersonalFile>("../data/private/personal.json", { eager: true, import: "default" })
  : {};
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

// What the grid shows when the API can't be reached. Saving it is refused (see saveConfig).
export const EMPTY_CONFIG: UserConfig = {
  cells: [...DEFAULT_CELL_TEXTS],
  tracks: {},
  timetable: {},
};

type StoredConfig = { version?: number } & Partial<UserConfig>;

// Throws rather than guessing: treating a config we can't read as empty would let the next
// save overwrite it.
function parseStored(matrixJson: string | null): StoredConfig {
  const stored = JSON.parse(matrixJson || "{}") as StoredConfig | null;
  if ((stored?.version ?? 0) > VERSION) {
    throw new Error("The saved matrix is from a newer version of the app. Reload to update.");
  }
  return stored ?? {};
}

export async function loadConfig(): Promise<UserConfig> {
  const { matrixJson } = await api.get<{ matrixJson: string | null }>("/matrix");
  const stored = parseStored(matrixJson);

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

  return { cells: fillCells(olderCells), tracks: {}, timetable: {} };
}

export async function saveConfig(config: UserConfig): Promise<void> {
  // Still the placeholder's own objects, so the real config never loaded (say, the API was
  // asleep). Saving would replace the whole grid and timetable with placeholders.
  if (config.tracks === EMPTY_CONFIG.tracks) {
    throw new Error("The grid hasn't loaded, so it can't be saved.");
  }
  await api.post("/matrix", { matrixJson: JSON.stringify({ ...config, version: VERSION }) });
}

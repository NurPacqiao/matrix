// 9x9 matrix structure: 1 core goal, 8 directions, 64 items (8 per direction).
// This file is public, so it only holds structure and generic labels. The real text
// lives in the user's database row (see lib/userConfig.ts).

export type ItemType = "Habit" | "Mini-Goal" | "Quality";

export interface Direction {
  id: number;
  name: string;
  short: string;
}

export interface MatrixItem {
  id: number; // 1-64
  directionId: number; // 1-8
  type: ItemType;
  text: string;
}

export type CellKind = "core" | "compass" | "hub" | "item";

export interface Cell {
  index: number; // 0-80, row-major
  row: number; // 1-9
  col: number; // 1-9
  block: number; // 0-8, row-major 3x3 block
  kind: CellKind;
  directionId?: number;
  itemId?: number;
}

export const CORE_GOAL = "Your 12-month goal";

export const DIRECTIONS: Direction[] = [
  { id: 1, name: "Backend", short: "Backend" },
  { id: 2, name: "Frontend", short: "Frontend" },
  { id: 3, name: "Career", short: "Career" },
  { id: 4, name: "University", short: "University" },
  { id: 5, name: "Physique", short: "Physique" },
  { id: 6, name: "Digital hygiene", short: "Discipline" },
  { id: 7, name: "Reading & focus", short: "Focus" },
  { id: 8, name: "Character", short: "Character" },
];

const H: ItemType = "Habit";
const M: ItemType = "Mini-Goal";
const Q: ItemType = "Quality";

// The type of each of the 8 items per direction, in the order they fill the
// direction's 3x3 block (row by row, skipping the center hub). Item text is personal,
// so the public code ships empty cells and the real text lives in the database.
const ITEM_TYPES: ItemType[][] = [
  [H, H, M, M, M, M, Q, Q],
  [H, H, M, M, M, M, Q, Q],
  [H, H, M, M, M, M, Q, Q],
  [H, H, M, M, M, M, Q, Q],
  [H, H, H, M, M, M, M, Q],
  [H, H, H, M, M, M, Q, Q],
  [H, H, H, M, M, M, Q, Q],
  [H, H, H, M, M, M, Q, Q],
];

export const ITEMS: MatrixItem[] = ITEM_TYPES.flatMap((types, d) =>
  types.map((type, i) => ({
    id: d * 8 + i + 1,
    directionId: d + 1,
    type,
    text: "",
  })),
);

// Which direction lives in which 3x3 position. The same map places the 8 outer
// blocks around the center and the 8 compass cells around the core goal.
const POSITION_TO_DIRECTION: Record<string, number> = {
  "0,0": 1,
  "0,1": 2,
  "0,2": 3,
  "1,2": 4,
  "2,2": 5,
  "2,1": 6,
  "2,0": 7,
  "1,0": 8,
};

export const DIRECTION_TO_BLOCK: Record<number, number> = Object.fromEntries(
  Object.entries(POSITION_TO_DIRECTION).map(([pos, dir]) => {
    const [r, c] = pos.split(",").map(Number);
    return [dir, r * 3 + c];
  }),
);

export const CENTER_BLOCK = 4;

function buildCells(): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const br = Math.floor(r / 3);
      const bc = Math.floor(c / 3);
      const lr = r % 3;
      const lc = c % 3;
      const base = { index: r * 9 + c, row: r + 1, col: c + 1, block: br * 3 + bc };
      const isCenterOfBlock = lr === 1 && lc === 1;

      if (br === 1 && bc === 1) {
        cells.push(
          isCenterOfBlock
            ? { ...base, kind: "core" }
            : { ...base, kind: "compass", directionId: POSITION_TO_DIRECTION[`${lr},${lc}`] },
        );
        continue;
      }

      const directionId = POSITION_TO_DIRECTION[`${br},${bc}`];
      if (isCenterOfBlock) {
        cells.push({ ...base, kind: "hub", directionId });
      } else {
        const pos = lr * 3 + lc;
        const slot = pos > 4 ? pos - 1 : pos;
        cells.push({ ...base, kind: "item", directionId, itemId: (directionId - 1) * 8 + slot + 1 });
      }
    }
  }
  return cells;
}

export const CELLS: Cell[] = buildCells();

export const ITEM_CELL_INDEX: Record<number, number> = Object.fromEntries(
  CELLS.filter((c) => c.itemId).map((c) => [c.itemId!, c.index]),
);

export function directionById(id: number | null | undefined): Direction | undefined {
  return DIRECTIONS.find((d) => d.id === id);
}

export function itemById(id: number | null | undefined): MatrixItem | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function defaultCellText(cell: Cell): string {
  switch (cell.kind) {
    case "core":
      return CORE_GOAL;
    case "compass":
    case "hub":
      return directionById(cell.directionId)!.name;
    case "item":
      return itemById(cell.itemId)!.text;
  }
}

export const DEFAULT_CELL_TEXTS: string[] = CELLS.map(defaultCellText);

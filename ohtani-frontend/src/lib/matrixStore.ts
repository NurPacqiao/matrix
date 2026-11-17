import api from "../api";
import { DEFAULT_CELL_TEXTS } from "../data/matrix";

// Stored in User.MatrixJson as { version: 2, cells: string[81] }.
// Anything older (e.g. the first prototype's plain array) falls back to the defaults.
const MATRIX_VERSION = 2;

export async function loadMatrix(): Promise<string[]> {
  const response = await api.get<{ matrixJson: string }>("/matrix");
  try {
    const parsed = JSON.parse(response.data.matrixJson ?? "");
    if (parsed?.version === MATRIX_VERSION && Array.isArray(parsed.cells) && parsed.cells.length === 81) {
      return parsed.cells.map((text: unknown, i: number) =>
        typeof text === "string" && text.trim() ? text : DEFAULT_CELL_TEXTS[i],
      );
    }
  } catch {
    // Unreadable data: use defaults
  }
  return [...DEFAULT_CELL_TEXTS];
}

export async function saveMatrix(cells: string[]): Promise<void> {
  await api.post("/matrix", {
    matrixJson: JSON.stringify({ version: MATRIX_VERSION, cells }),
  });
}

import { useEffect, useState } from "react";
import {
  CELLS,
  CENTER_BLOCK,
  DIRECTION_TO_BLOCK,
  directionById,
  itemById,
  type Cell,
} from "../data/matrix";
import { completionsByItem, loadHistory } from "../lib/history";
import { EMPTY_CONFIG, loadConfig, saveConfig, type UserConfig } from "../lib/userConfig";
import type { SaveState } from "../types";

type View = "focus" | "full";

const TYPE_MARK: Record<string, string> = { Habit: "H", "Mini-Goal": "M", Quality: "Q" };

export default function Matrix() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const cells = config?.cells ?? null;
  const [completions, setCompletions] = useState<Map<number, number>>(new Map());
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState<View>("focus");
  const [block, setBlock] = useState(CENTER_BLOCK);
  const [selected, setSelected] = useState<Cell | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadConfig(), loadHistory(90).catch(() => [])])
      .then(([loaded, history]) => {
        if (cancelled) return;
        setConfig(loaded);
        setCompletions(completionsByItem(history));
      })
      .catch((error) => {
        console.error("Failed to load matrix", error);
        if (!cancelled) {
          setLoadError(true);
          setConfig(EMPTY_CONFIG);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openCell = (cell: Cell) => {
    if (view === "focus" && cell.kind === "compass") {
      setBlock(DIRECTION_TO_BLOCK[cell.directionId!]);
    } else if (view === "focus" && cell.kind === "hub") {
      setBlock(CENTER_BLOCK);
    } else {
      setSelected(cell);
    }
  };

  const saveCell = async (index: number, text: string) => {
    if (!config) return;
    const next = { ...config, cells: config.cells.map((t, i) => (i === index ? text : t)) };
    await saveConfig(next);
    setConfig(next);
  };

  const blockDirection = block === CENTER_BLOCK ? undefined : directionById(CELLS.find((c) => c.block === block)?.directionId);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-bone-faint">
            {view === "full" ? "81 cells" : blockDirection ? `Direction ${blockDirection.id} of 8` : "Core goal"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {view === "full" ? "The grid" : blockDirection ? blockDirection.short : "Center"}
          </h1>
        </div>
        <div className="flex p-0.5 rounded-lg bg-ink-900 border border-ink-800 text-xs font-medium">
          {(["focus", "full"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                view === v ? "bg-ink-700 text-bone" : "text-bone-faint hover:text-bone-muted"
              }`}
            >
              {v === "focus" ? "Zoom" : "Full 9×9"}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <p className="mt-4 text-sm text-accent-soft">Couldn't reach the API. Showing the default grid, and edits won't save.</p>
      )}

      {!cells ? (
        <div className="mt-6 aspect-square rounded-xl bg-ink-900 border border-ink-800 animate-pulse" />
      ) : view === "focus" ? (
        <FocusView block={block} cells={cells} onOpen={openCell} onBack={() => setBlock(CENTER_BLOCK)} />
      ) : (
        <FullView cells={cells} onOpen={openCell} />
      )}

      <Legend />

      {selected && cells && (
        <CellSheet
          cell={selected}
          text={cells[selected.index]}
          allCells={cells}
          completions={selected.itemId ? completions.get(selected.itemId) ?? 0 : null}
          onClose={() => setSelected(null)}
          onSave={(text) => saveCell(selected.index, text)}
          onZoom={(b) => {
            setSelected(null);
            setView("focus");
            setBlock(b);
          }}
        />
      )}
    </div>
  );
}

// The full direction title is whatever the user wrote in that direction's hub cell
function directionTitle(directionId: number | undefined, cells: string[]): string | undefined {
  const hub = CELLS.find((c) => c.kind === "hub" && c.directionId === directionId);
  return hub ? cells[hub.index] || undefined : undefined;
}

function cellTone(cell: Cell): string {
  if (cell.kind === "core") return "bg-accent/15 text-bone font-semibold ring-1 ring-inset ring-accent/70";
  if (cell.kind === "compass" || cell.kind === "hub") return "bg-ink-700 text-bone font-semibold";
  return "bg-ink-900 text-bone-muted";
}

function FocusView({
  block,
  cells,
  onOpen,
  onBack,
}: {
  block: number;
  cells: string[];
  onOpen: (cell: Cell) => void;
  onBack: () => void;
}) {
  const blockCells = CELLS.filter((c) => c.block === block);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-px bg-ink-800 border border-ink-800 rounded-xl overflow-hidden">
        {blockCells.map((cell) => {
          const item = itemById(cell.itemId);
          const direction = directionById(cell.directionId);
          const text = cell.kind === "compass" || cell.kind === "hub" ? direction!.short : cells[cell.index];
          return (
            <button
              key={cell.index}
              onClick={() => onOpen(cell)}
              className={`relative aspect-square p-2.5 sm:p-3.5 text-left flex flex-col transition-colors hover:brightness-125 ${cellTone(cell)}`}
            >
              <span className="font-mono text-[10px] opacity-60">
                {cell.kind === "item" ? TYPE_MARK[item!.type] : cell.kind === "core" ? "★" : direction!.id}
              </span>
              <span
                className={`mt-auto leading-tight ${
                  cell.kind === "item" || cell.kind === "core"
                    ? "text-[11px] sm:text-[13px] line-clamp-5"
                    : "text-sm sm:text-base"
                } ${text ? "" : "text-bone-faint italic"}`}
              >
                {text || "Tap to write"}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-bone-faint">
        {block === CENTER_BLOCK ? (
          "Tap a direction to open its eight items."
        ) : (
          <>
            Tap an item to read or edit it.{" "}
            <button onClick={onBack} className="text-bone-muted underline underline-offset-4">
              Back to center
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function FullView({ cells, onOpen }: { cells: string[]; onOpen: (cell: Cell) => void }) {
  return (
    <div className="mt-6 -mx-4 px-4 overflow-x-auto">
      <div className="min-w-[640px] grid grid-cols-3 gap-[3px] bg-ink-600 p-[3px] rounded-lg">
        {Array.from({ length: 9 }, (_, b) => (
          <div key={b} className="grid grid-cols-3 gap-px bg-ink-800">
            {CELLS.filter((c) => c.block === b).map((cell) => {
              const text =
                cell.kind === "compass" || cell.kind === "hub"
                  ? directionById(cell.directionId)!.short
                  : cells[cell.index];
              return (
                <button
                  key={cell.index}
                  onClick={() => onOpen(cell)}
                  title={`R${cell.row} C${cell.col}`}
                  className={`aspect-square p-1 text-[9px] leading-[1.2] text-left overflow-hidden hover:brightness-125 ${cellTone(cell)}`}
                >
                  <span className={cell.kind === "item" || cell.kind === "core" ? "line-clamp-5" : ""}>
                    {text || <span className="text-bone-faint">·</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-bone-faint">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-accent/15 ring-1 ring-accent/70" /> Core goal
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-ink-700" /> Direction
      </span>
      <span className="font-mono">H Habit · M Mini-goal · Q Quality</span>
    </div>
  );
}

function CellSheet({
  cell,
  text,
  allCells,
  completions,
  onClose,
  onSave,
  onZoom,
}: {
  cell: Cell;
  text: string;
  allCells: string[];
  completions: number | null;
  onClose: () => void;
  onSave: (text: string) => Promise<void>;
  onZoom: (block: number) => void;
}) {
  const [draft, setDraft] = useState(text);
  const [state, setState] = useState<SaveState>("idle");
  const direction = directionById(cell.directionId);
  const item = itemById(cell.itemId);
  const editable = cell.kind === "item" || cell.kind === "core";
  const dirty = draft.trim() !== text && draft.trim().length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    setState("saving");
    try {
      await onSave(draft.trim());
      setState("saved");
    } catch (error) {
      console.error("Failed to save cell", error);
      setState("error");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div
        role="dialog"
        className="relative w-full sm:max-w-md bg-ink-900 border-t sm:border border-ink-700 rounded-t-2xl sm:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-4 w-10 h-1 rounded-full bg-ink-600 sm:hidden" />
        <div className="flex items-center gap-2 font-mono text-[11px] text-bone-faint">
          <span>
            R{cell.row} · C{cell.col}
          </span>
          {item && <span>· #{String(item.id).padStart(2, "0")}</span>}
          {item && <span>· {item.type}</span>}
        </div>
        <h2 className="mt-2 text-lg font-semibold">
          {cell.kind === "core" ? "Core goal" : directionTitle(cell.directionId, allCells) ?? direction?.name}
        </h2>

        {editable ? (
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setState("idle");
            }}
            rows={4}
            placeholder="Write this cell…"
            className="mt-4 w-full p-3 rounded-lg bg-ink-950 border border-ink-800 text-bone leading-relaxed resize-none focus:outline-none focus:border-accent/70"
          />
        ) : (
          <p className="mt-4 text-bone-muted">This is a direction header. Open it to see its eight items.</p>
        )}

        {completions !== null && (
          <p className="mt-3 text-sm text-bone-muted">
            Done as a daily task <span className="font-mono text-bone">{completions}</span>{" "}
            {completions === 1 ? "time" : "times"} in the last 90 days.
          </p>
        )}

        <div className="mt-5 flex gap-2">
          {editable ? (
            <>
              <button
                onClick={save}
                disabled={!dirty || state === "saving"}
                className="flex-1 py-2.5 rounded-lg bg-accent text-ink-950 text-sm font-semibold disabled:opacity-40 hover:bg-accent-soft transition-colors"
              >
                {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={() =>
                onZoom(cell.kind === "compass" ? DIRECTION_TO_BLOCK[cell.directionId!] : cell.block)
              }
              className="flex-1 py-2.5 rounded-lg bg-accent text-ink-950 text-sm font-semibold hover:bg-accent-soft"
            >
              Open {direction?.short}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-ink-700 text-sm text-bone hover:bg-ink-800"
          >
            Close
          </button>
        </div>
        {state === "error" && <p className="mt-3 text-sm text-accent-soft">Couldn't save. Try again.</p>}
      </div>
    </div>
  );
}

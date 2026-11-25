import { directionById } from "../../data/matrix";
import { countedTrack, PRIORITY_DIRECTION, PROGRESSIVE_TRACKS } from "../../lib/plan";
import type { Task } from "../../types";
import Check from "./Check";
import Stepper from "./Stepper";

interface PlanItemProps {
  task: Task;
  onToggle: () => void;
  onChangeAmount: (by: number) => void;
}

export default function PlanItem({ task, onToggle, onChangeAmount }: PlanItemProps) {
  const direction = directionById(task.directionId);
  const counted = task.target ? countedTrack(task.trackId) : undefined;
  const level = task.trackId && PROGRESSIVE_TRACKS.has(task.trackId) ? (task.step ?? 1) : 1;

  return (
    <li className="relative">
      <button
        onClick={onToggle}
        aria-pressed={task.isCompleted}
        className={`w-full text-left flex gap-3 px-4 py-3 rounded-xl border transition-colors ${
          task.isCompleted ? "bg-ink-900/50 border-ink-800" : "bg-ink-900 border-ink-800 hover:border-ink-600"
        }`}
      >
        <Check checked={task.isCompleted} />
        <span className={`min-w-0 flex-grow ${counted ? "pr-[112px]" : ""}`}>
          <span className={`block leading-snug ${task.isCompleted ? "text-bone-faint line-through" : "text-bone"}`}>
            {task.text}
          </span>
          {direction && (
            <span className="mt-1 flex items-center gap-2 font-mono text-[11px] text-bone-faint">
              <span className={direction.id === PRIORITY_DIRECTION ? "text-accent-soft" : ""}>{direction.short}</span>
              {level > 1 && <span>· level {level}</span>}
              {counted && (
                <span>
                  · {task.amount ?? 0}/{task.target} {counted.unit}
                </span>
              )}
            </span>
          )}
        </span>
      </button>
      {counted && (
        <Stepper
          value={task.amount ?? 0}
          unit={counted.unit}
          onChange={(sign) => onChangeAmount(sign * counted.stepBy)}
        />
      )}
    </li>
  );
}

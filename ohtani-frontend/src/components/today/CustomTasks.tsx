import { useState, type FormEvent } from "react";
import { toggleTask } from "../../lib/tasks";
import type { Task } from "../../types";
import Check from "./Check";

/** The "Also today" list: free-form tasks outside the plan. */
export default function CustomTasks({ tasks, onChange }: { tasks: Task[]; onChange: (tasks: Task[]) => void }) {
  const [newTask, setNewTask] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const add = (e: FormEvent) => {
    e.preventDefault();
    const text = newTask.trim();
    if (!text) return;
    onChange([...tasks, { text, isCompleted: false }]);
    setNewTask("");
  };

  const rename = (index: number, text: string) => {
    setEditingIndex(null);
    if (text && text !== tasks[index].text) {
      onChange(tasks.map((task, i) => (i === index ? { ...task, text } : task)));
    }
  };

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-bone-muted mb-3">Also today</h2>

      <form onSubmit={add} className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task"
          aria-label="New task"
          maxLength={500}
          enterKeyHint="done"
          autoCapitalize="sentences"
          className="flex-grow min-w-0 h-11 px-4 rounded-xl bg-ink-900 border border-ink-800 text-bone placeholder:text-bone-faint focus:outline-none focus:border-accent/70"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="h-11 px-4 flex items-center gap-1.5 rounded-xl bg-accent text-ink-950 font-semibold active:bg-accent-soft transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
      </form>

      <ul className="mt-3 divide-y divide-ink-800 border-y border-ink-800">
        {tasks.length === 0 && <li className="py-6 text-center text-sm text-bone-faint">Nothing extra yet.</li>}
        {tasks.map((task, i) => (
          <li key={i} className="group flex items-center gap-1 min-h-[52px]">
            <button
              onClick={() => onChange(toggleTask(tasks, i))}
              aria-label={task.isCompleted ? "Mark as not done" : "Mark as done"}
              className="w-11 h-11 -ml-3 flex items-center justify-center"
            >
              <Check checked={task.isCompleted} />
            </button>

            {editingIndex === i ? (
              <TaskEditor text={task.text} onCommit={(text) => rename(i, text)} onCancel={() => setEditingIndex(null)} />
            ) : (
              <button
                onClick={() => setEditingIndex(i)}
                title="Tap to edit"
                className={`flex-grow min-w-0 py-3 text-left break-words ${
                  task.isCompleted ? "text-bone-faint line-through" : "text-bone"
                }`}
              >
                {task.text}
              </button>
            )}

            <button
              onClick={() => onChange(tasks.filter((_, other) => other !== i))}
              aria-label="Delete task"
              className="w-11 h-11 -mr-3 flex items-center justify-center text-bone-faint hover:text-bone sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      {tasks.length > 0 && (
        <p className="mt-2 text-[11px] text-bone-faint">
          Tap a task's text to edit it. These don't count toward your streak or Balance.
        </p>
      )}
    </section>
  );
}

function TaskEditor({
  text,
  onCommit,
  onCancel,
}: {
  text: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(text);
  const commit = () => onCommit(draft.trim());

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
      }}
      aria-label="Edit task"
      maxLength={500}
      className="flex-grow min-w-0 bg-transparent border-b border-accent/70 text-bone focus:outline-none"
    />
  );
}

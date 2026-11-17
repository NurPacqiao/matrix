import { useState, useEffect } from "react";
import api from "../api";

export default function TaskGenerator() {
  const [lockedTasks, setLockedTasks] = useState<string[]>([
    "Complete 15 pull-ups",
    "Review Nx Monorepo docs",
    "Draft RetDesk schema",
  ]);
  const [customTasks, setCustomTasks] = useState<string[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get("/tasks");
        const data = response.data;
        if (data.customTasksJson && data.customTasksJson !== "[]") {
          setCustomTasks(JSON.parse(data.customTasksJson));
        }
        if (data.lockedTasksJson && data.lockedTasksJson !== "[]") {
          setLockedTasks(JSON.parse(data.lockedTasksJson));
        }
      } catch (error) {
        console.error("Failed to load tasks", error);
      }
    };

    fetchTasks();
  }, []);

  const addCustomTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTask.trim()) return;
    setCustomTasks([...customTasks, newTask.trim()]);
    setNewTask("");
  };

  const syncToDatabase = async () => {
    try {
      const payload = {
        lockedTasksJson: JSON.stringify(lockedTasks),
        customTasksJson: JSON.stringify(customTasks),
      };
      await api.post("/tasks", payload);
      alert("Tasks saved!");
    } catch (error) {
      console.error("Failed to sync tasks", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800">Action Items</h2>
        <p className="text-sm text-slate-500 mt-1">Execute daily targets</p>
      </div>

      <div className="p-6 space-y-8 flex-grow">
        {/* Locked Tasks Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            Locked Tasks
          </h3>
          <ul className="space-y-2">
            {lockedTasks.map((task, i) => (
              <li
                key={i}
                className="flex items-center p-3 bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-100/50"
              >
                <svg
                  className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="font-medium">{task}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Custom Tasks Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            Custom Tasks
          </h3>

          <form onSubmit={addCustomTask} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-grow px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              placeholder="What needs to be done?"
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
            >
              Add
            </button>
          </form>

          <ul className="space-y-2 min-h-[120px]">
            {customTasks.length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6">
                <span className="text-slate-400 text-sm">
                  No custom tasks added yet.
                </span>
              </div>
            ) : (
              customTasks.map((task, i) => (
                <li
                  key={i}
                  className="flex items-center p-3 bg-white border border-slate-200 shadow-sm rounded-lg group hover:border-indigo-300 transition-colors"
                >
                  <div className="w-5 h-5 border-2 border-slate-300 rounded-full mr-3 group-hover:border-indigo-400"></div>
                  <span className="text-slate-700">{task}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={syncToDatabase}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg border border-slate-300 shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sync Tasks to Database
        </button>
      </div>
    </div>
  );
}

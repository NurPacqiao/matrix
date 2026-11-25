import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../lib/api";
import { dateKey } from "../lib/dates";
import { loadHistory, withDay, HISTORY_DAYS } from "../lib/history";
import { buildDailyPlan, carryOver, isCurrentPlan } from "../lib/plan";
import { loadTasks, saveTasks, type DayTasks } from "../lib/tasks";
import { loadConfig, type UserConfig } from "../lib/userConfig";
import type { DayLog, SaveState } from "../types";

const SLOW_AFTER_MS = 4_000;
const DAY_CHECK_MS = 60_000;
const REFRESH_AFTER_MS = 60_000; // coming back to the app sooner than this doesn't refetch

interface Loaded {
  dayKey: string;
  tasks: DayTasks;
  history: DayLog[];
  config: UserConfig;
}

/**
 * Today's tasks, the history and the config, shared by the Today and Balance tabs.
 *
 * It lives above the tabs, so switching tabs never reloads tasks while a save is still on
 * its way. Every save names the day the tasks were loaded for, and the app moves on to the
 * new day by itself at midnight.
 */
export function useToday() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [slow, setSlow] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const saveQueue = useRef<Promise<void>>(Promise.resolve()); // one after another, so a double-tap can't land out of order
  const lastEdit = useRef(0);
  const pending = useRef<{ dayKey: string; tasks: DayTasks } | null>(null); // the newest change not saved yet
  const loading = useRef(false);
  const lastSync = useRef(0);

  const save = useCallback((dayKey: string, tasks: DayTasks) => {
    const edit = ++lastEdit.current;
    pending.current = { dayKey, tasks };
    setSaveState("saving");
    saveQueue.current = saveQueue.current
      .then(() => saveTasks(dayKey, tasks))
      .then(
        () => {
          if (edit !== lastEdit.current) return; // a newer save is queued behind this one
          pending.current = null;
          setSaveState("saved");
        },
        (error: unknown) => {
          console.error("Failed to save tasks", error);
          if (edit !== lastEdit.current) return;
          if (error instanceof ApiError && error.status === 400) pending.current = null; // retrying can't help
          setSaveState("error");
        },
      );
  }, []);

  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    try {
      setLoadError(false);
      // Let the last changes land first, so moving on to a new day can't drop them
      if (pending.current) save(pending.current.dayKey, pending.current.tasks);
      await saveQueue.current;
      if (pending.current) throw new Error("Earlier changes aren't saved yet.");

      const dayKey = dateKey();
      const edit = lastEdit.current;
      const [saved, history, config] = await Promise.all([loadTasks(dayKey), loadHistory(HISTORY_DAYS), loadConfig()]);
      if (edit !== lastEdit.current) return; // changed while loading; the day check tries again

      // First open of the day, or a log from an older plan: build today's plan, keeping any ticks
      const needsPlan = !isCurrentPlan(saved.lockedTasks);
      const tasks = needsPlan
        ? {
            ...saved,
            lockedTasks: carryOver(buildDailyPlan(history, config.tracks, config.examLabel), saved.lockedTasks),
          }
        : saved;

      setLoaded({ dayKey, tasks, history, config });
      setLoadError(false);
      lastSync.current = Date.now();
      if (needsPlan) save(dayKey, tasks);
      else setSaveState("idle");
    } catch (error) {
      console.error("Failed to load today", error);
      setLoadError(true);
    } finally {
      window.clearTimeout(slowTimer);
      setSlow(false);
      loading.current = false;
    }
  }, [save]);

  // Another device may have ticked something. Never over changes that aren't saved yet.
  const refresh = useCallback(async (dayKey: string) => {
    if (pending.current || Date.now() - lastSync.current < REFRESH_AFTER_MS) return;
    lastSync.current = Date.now();
    const edit = lastEdit.current;
    try {
      const tasks = await loadTasks(dayKey);
      if (edit !== lastEdit.current) return;
      setLoaded((prev) => (prev?.dayKey === dayKey ? { ...prev, tasks } : prev));
    } catch (error) {
      console.error("Failed to refresh tasks", error); // what's on screen is still usable
    }
  }, []);

  useEffect(() => {
    // Started from a timer so the effect itself never sets state synchronously
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const dayKey = loaded?.dayKey;
  useEffect(() => {
    if (!dayKey) return;
    const check = () => {
      if (document.visibilityState !== "visible") return;
      if (dateKey() !== dayKey) void load();
      else void refresh(dayKey);
    };
    const checkDay = () => {
      if (dateKey() !== dayKey) check();
    };
    const timer = window.setInterval(checkDay, DAY_CHECK_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [dayKey, load, refresh]);

  const update = (change: Partial<DayTasks>) => {
    if (!loaded) return;
    const tasks = { ...loaded.tasks, ...change };
    setLoaded({ ...loaded, tasks });
    save(loaded.dayKey, tasks);
  };

  // The history including today as it is on screen right now
  const history = useMemo(
    () => (loaded ? withDay(loaded.history, { date: loaded.dayKey, ...loaded.tasks }) : null),
    [loaded],
  );

  return {
    tasks: loaded?.tasks ?? null,
    config: loaded?.config ?? null,
    history,
    loadError,
    slow,
    saveState,
    update,
    reload: load,
    retrySave: () => loaded && save(loaded.dayKey, loaded.tasks),
  };
}

export type TodayState = ReturnType<typeof useToday>;

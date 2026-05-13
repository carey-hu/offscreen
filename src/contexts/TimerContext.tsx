import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FocusMode, FocusSession, UserSettings } from "../types";
import { getDeviceId } from "../lib/device";

interface StartOverrides {
  taskId?: string;
  title?: string;
  tag?: string;
  mode?: FocusMode;
  minutes?: number;
}

interface EnsureTaskInput {
  title: string;
  tag: string;
  plannedMinutes?: number;
}

interface TimerContextValue {
  mode: FocusMode;
  title: string;
  tag: string;
  hours: number;
  minutes: number;
  running: boolean;
  paused: boolean;
  startedAt: number | null;
  taskId: string | null;
  elapsedMs: number;
  displayMs: number;
  progress: number;
  plannedMinutes: number;

  setMode: (mode: FocusMode) => void;
  setTitle: (title: string) => void;
  setTag: (tag: string) => void;
  setHours: (n: number) => void;
  setMinutes: (n: number) => void;

  start: (overrides?: StartOverrides) => Promise<void>;
  pause: () => void;
  resume: () => void;
  finish: (status?: "completed" | "abandoned") => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  settings: UserSettings;
  onSave: (session: FocusSession) => Promise<void>;
  onEnsureTask: (input: EnsureTaskInput) => Promise<string>;
}

const DEFAULT_MINUTES_BY_MODE = (settings: UserSettings, mode: FocusMode): number => {
  switch (mode) {
    case "pomodoro":
      return settings.pomodoroMinutes;
    case "long":
      return settings.longFocusMinutes;
    case "countdown":
      return 30;
    case "stopwatch":
      return 0;
  }
};

export function TimerProvider({ children, settings, onSave, onEnsureTask }: ProviderProps) {
  const [mode, setModeState] = useState<FocusMode>(settings.defaultMode);
  const [title, setTitleState] = useState("深度专注");
  const [tag, setTagState] = useState("工作");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(settings.pomodoroMinutes);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [taskId, setTaskId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Sync default minutes when settings change & not running
  useEffect(() => {
    if (!running) {
      setMinutes(DEFAULT_MINUTES_BY_MODE(settings, mode));
    }
  }, [settings, mode, running]);

  const setMode = useCallback(
    (next: FocusMode) => {
      setModeState(next);
      if (!running) {
        setHours(0);
        setMinutes(DEFAULT_MINUTES_BY_MODE(settings, next));
      }
    },
    [running, settings]
  );

  // User-facing setters clear the task link
  const setTitle = useCallback((t: string) => {
    setTitleState(t);
    setTaskId(null);
  }, []);

  const setTag = useCallback((t: string) => {
    setTagState(t);
    setTaskId(null);
  }, []);

  const plannedMinutes = useMemo(() => {
    if (mode === "stopwatch") return 0;
    return hours * 60 + minutes;
  }, [hours, minutes, mode]);

  const targetMs = plannedMinutes * 60 * 1000;

  const elapsedMs = useMemo(() => {
    if (!startedAt) return 0;
    const baseElapsed = now - startedAt - pausedMs;
    return Math.max(0, baseElapsed);
  }, [now, startedAt, pausedMs]);

  const displayMs = mode === "stopwatch" ? elapsedMs : Math.max(0, targetMs - elapsedMs);
  const progress =
    mode === "stopwatch" || targetMs <= 0
      ? 0
      : Math.min(100, (elapsedMs / targetMs) * 100);

  // 500ms tick
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [running]);

  function reset() {
    setRunning(false);
    setPaused(false);
    setStartedAt(null);
    setPausedMs(0);
    setPauseStartedAt(null);
    sessionIdRef.current = null;
  }

  const finish = useCallback(
    async (status: "completed" | "abandoned" = "completed") => {
      if (!startedAt || !sessionIdRef.current) {
        reset();
        return;
      }
      const finishedAt = Date.now();
      const actualMinutes = Math.max(1, Math.round(elapsedMs / 60000));
      await onSave({
        id: sessionIdRef.current,
        deviceId: getDeviceId(),
        taskId: taskId ?? undefined,
        title,
        tag,
        mode,
        startTime: new Date(startedAt).toISOString(),
        endTime: new Date(finishedAt).toISOString(),
        plannedMinutes,
        actualMinutes,
        status,
        createdAt: new Date(startedAt).toISOString(),
        updatedAt: new Date().toISOString()
      });
      reset();
    },
    [startedAt, elapsedMs, title, tag, mode, plannedMinutes, taskId, onSave]
  );

  // Auto-finish when countdown hits zero
  useEffect(() => {
    if (!running || paused || mode === "stopwatch") return;
    if (targetMs > 0 && elapsedMs >= targetMs) {
      finish("completed");
    }
  }, [elapsedMs, mode, paused, running, targetMs, finish]);

  const start = useCallback(
    async (overrides?: StartOverrides) => {
      // Resolve effective fields
      const nextTitle = overrides?.title ?? title;
      const nextTag = overrides?.tag ?? tag;
      const nextMode = overrides?.mode ?? mode;
      const nextMinutes =
        overrides?.minutes != null ? overrides.minutes : hours * 60 + minutes;

      // Apply state updates (direct, bypass setters so taskId stays intact)
      if (overrides?.title) setTitleState(overrides.title);
      if (overrides?.tag) setTagState(overrides.tag);
      if (overrides?.mode) setModeState(nextMode);
      if (overrides?.minutes != null) {
        setHours(Math.floor(overrides.minutes / 60));
        setMinutes(overrides.minutes % 60);
      }

      // Resolve / ensure task link
      let resolvedTaskId = overrides?.taskId ?? taskId;
      if (!resolvedTaskId) {
        resolvedTaskId = await onEnsureTask({
          title: nextTitle,
          tag: nextTag,
          plannedMinutes: nextMode === "stopwatch" ? 25 : nextMinutes || 25
        });
      }
      setTaskId(resolvedTaskId);

      sessionIdRef.current = crypto.randomUUID();
      const startTs = Date.now();
      setStartedAt(startTs);
      setPausedMs(0);
      setPauseStartedAt(null);
      setRunning(true);
      setPaused(false);
      setNow(startTs);
    },
    [mode, title, tag, hours, minutes, taskId, onEnsureTask]
  );

  const pause = useCallback(() => {
    if (!running || paused) return;
    setPaused(true);
    setPauseStartedAt(Date.now());
  }, [running, paused]);

  const resume = useCallback(() => {
    if (!running || !paused) return;
    if (pauseStartedAt) {
      setPausedMs((p) => p + (Date.now() - pauseStartedAt));
    }
    setPauseStartedAt(null);
    setPaused(false);
  }, [running, paused, pauseStartedAt]);

  const value: TimerContextValue = {
    mode,
    title,
    tag,
    hours,
    minutes,
    running,
    paused,
    startedAt,
    taskId,
    elapsedMs,
    displayMs,
    progress,
    plannedMinutes,
    setMode,
    setTitle,
    setTag,
    setHours,
    setMinutes,
    start,
    pause,
    resume,
    finish
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside <TimerProvider>");
  return ctx;
}

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FocusMode, FocusSession, UserSettings } from "../types";
import { getDeviceId } from "../lib/device";

interface StartOverrides {
  taskId?: string;
  title?: string;
  tag?: string;
  mode?: FocusMode;
  minutes?: number;
  // Skip the ensureTask call entirely. Used for short-break sessions, which
  // shouldn't pollute the task list — break is an activity, not a task.
  skipTaskLink?: boolean;
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
  shortBreakMinutes: number;

  setMode: (mode: FocusMode) => void;
  setTitle: (title: string) => void;
  setTag: (tag: string) => void;
  setHours: (n: number) => void;
  setMinutes: (n: number) => void;

  start: (overrides?: StartOverrides) => Promise<void>;
  startBreak: () => Promise<void>;
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
    // While paused, freeze elapsed at the moment of pause — otherwise the
    // tick keeps advancing `now` and the display creeps forward during pause,
    // then snaps backward on resume when `pausedMs` is finally settled.
    const referenceNow = paused && pauseStartedAt ? pauseStartedAt : now;
    const baseElapsed = referenceNow - startedAt - pausedMs;
    return Math.max(0, baseElapsed);
  }, [now, startedAt, pausedMs, paused, pauseStartedAt]);

  const displayMs = mode === "stopwatch" ? elapsedMs : Math.max(0, targetMs - elapsedMs);
  const progress =
    mode === "stopwatch" || targetMs <= 0
      ? 0
      : Math.min(100, (elapsedMs / targetMs) * 100);

  // 500ms tick — only while running AND not paused
  useEffect(() => {
    if (!running || paused) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [running, paused]);

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

      // Apply ALL visible state synchronously BEFORE any await. Otherwise the
      // microtask boundary inside `await onEnsureTask` lets React commit a
      // render where `running` is still false; the `[settings,mode,running]`
      // useEffect then fires and overwrites `minutes` with the mode default
      // (30 for countdown), so the short-break button ended up timing 30min.
      if (overrides?.title) setTitleState(overrides.title);
      if (overrides?.tag) setTagState(overrides.tag);
      if (overrides?.mode) setModeState(nextMode);
      if (overrides?.minutes != null) {
        setHours(Math.floor(overrides.minutes / 60));
        setMinutes(overrides.minutes % 60);
      }

      sessionIdRef.current = crypto.randomUUID();
      const startTs = Date.now();
      setStartedAt(startTs);
      setPausedMs(0);
      setPauseStartedAt(null);
      setRunning(true);
      setPaused(false);
      setNow(startTs);

      // Resolve / ensure task link AFTER running is set. Short-break sessions
      // pass skipTaskLink so we never create a "短休息" task row.
      if (overrides?.skipTaskLink) {
        setTaskId(null);
        return;
      }
      let resolvedTaskId = overrides?.taskId ?? taskId;
      if (!resolvedTaskId) {
        resolvedTaskId = await onEnsureTask({
          title: nextTitle,
          tag: nextTag,
          plannedMinutes: nextMode === "stopwatch" ? 25 : nextMinutes || 25
        });
      }
      setTaskId(resolvedTaskId);
    },
    [mode, title, tag, hours, minutes, taskId, onEnsureTask]
  );

  const pause = useCallback(() => {
    if (!running || paused) return;
    const nowMs = Date.now();
    // Snap `now` to the current instant so the elapsed value displayed at
    // the moment of pause matches what was on screen the millisecond before
    // — without this, `referenceNow` jumps from a (possibly 500ms stale)
    // tick-driven `now` to the fresh `pauseStartedAt`, and the digits leap
    // forward up to half a second.
    setNow(nowMs);
    setPauseStartedAt(nowMs);
    setPaused(true);
  }, [running, paused]);

  const resume = useCallback(() => {
    if (!running || !paused) return;
    const nowMs = Date.now();
    if (pauseStartedAt) {
      setPausedMs((p) => p + (nowMs - pauseStartedAt));
    }
    // Same reason as pause(): snap `now` to the resume instant so the next
    // render uses a fresh reference. Otherwise it reuses the stale tick value
    // and elapsed appears to jump backward until the interval fires again.
    setNow(nowMs);
    setPauseStartedAt(null);
    setPaused(false);
  }, [running, paused, pauseStartedAt]);

  const startBreak = useCallback(async () => {
    await start({
      mode: "countdown",
      minutes: settings.shortBreakMinutes,
      title: "短休息",
      tag: "休息",
      skipTaskLink: true
    });
  }, [start, settings.shortBreakMinutes]);

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
    shortBreakMinutes: settings.shortBreakMinutes,
    setMode,
    setTitle,
    setTag,
    setHours,
    setMinutes,
    start,
    startBreak,
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

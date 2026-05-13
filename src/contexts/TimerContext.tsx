import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FocusMode, FocusSession, UserSettings } from "../types";
import { getDeviceId } from "../lib/device";

interface StartOverrides {
  title?: string;
  tag?: string;
  mode?: FocusMode;
  minutes?: number;
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
  elapsedMs: number;
  displayMs: number;
  progress: number;
  plannedMinutes: number;

  setMode: (mode: FocusMode) => void;
  setTitle: (title: string) => void;
  setTag: (tag: string) => void;
  setHours: (n: number) => void;
  setMinutes: (n: number) => void;

  start: (overrides?: StartOverrides) => void;
  pause: () => void;
  resume: () => void;
  finish: (status?: "completed" | "abandoned") => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  settings: UserSettings;
  onSave: (session: FocusSession) => Promise<void>;
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
    case "flip":
      return settings.pomodoroMinutes;
  }
};

export function TimerProvider({ children, settings, onSave }: ProviderProps) {
  const [mode, setModeState] = useState<FocusMode>(settings.defaultMode);
  const [title, setTitle] = useState("深度专注");
  const [tag, setTag] = useState("工作");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(settings.pomodoroMinutes);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [accumulatedHiddenMs, setAccumulatedHiddenMs] = useState(0);
  const [lastHiddenAt, setLastHiddenAt] = useState<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Track running for the visibility listener (avoid stale closure)
  const stateRef = useRef({ running, paused, mode });
  stateRef.current = { running, paused, mode };

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

  const plannedMinutes = useMemo(() => {
    if (mode === "stopwatch") return 0;
    return hours * 60 + minutes;
  }, [hours, minutes, mode]);

  const targetMs = plannedMinutes * 60 * 1000;

  const elapsedMs = useMemo(() => {
    if (!startedAt) return 0;
    if (mode === "flip") {
      // Only count time while page is hidden
      const currentHiddenExtra =
        lastHiddenAt && !paused ? Math.max(0, now - lastHiddenAt) : 0;
      return Math.max(0, accumulatedHiddenMs + currentHiddenExtra);
    }
    const baseElapsed = now - startedAt - pausedMs;
    return Math.max(0, baseElapsed);
  }, [now, paused, startedAt, mode, accumulatedHiddenMs, lastHiddenAt, pausedMs]);

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

  // Flip mode visibility listener
  useEffect(() => {
    function onVisibility() {
      const s = stateRef.current;
      if (!s.running || s.paused || s.mode !== "flip") return;

      if (document.hidden) {
        setLastHiddenAt(Date.now());
      } else {
        setLastHiddenAt((prev) => {
          if (prev) {
            setAccumulatedHiddenMs((acc) => acc + (Date.now() - prev));
          }
          return null;
        });
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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
    [startedAt, elapsedMs, title, tag, mode, plannedMinutes, onSave]
  );

  function reset() {
    setRunning(false);
    setPaused(false);
    setStartedAt(null);
    setPausedMs(0);
    setPauseStartedAt(null);
    setAccumulatedHiddenMs(0);
    setLastHiddenAt(null);
    sessionIdRef.current = null;
  }

  // Auto-finish when countdown hits zero
  useEffect(() => {
    if (!running || paused || mode === "stopwatch") return;
    if (targetMs > 0 && elapsedMs >= targetMs) {
      finish("completed");
    }
  }, [elapsedMs, mode, paused, running, targetMs, finish]);

  const start = useCallback(
    (overrides?: StartOverrides) => {
      if (overrides?.title) setTitle(overrides.title);
      if (overrides?.tag) setTag(overrides.tag);

      const nextMode = overrides?.mode ?? mode;
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
      setAccumulatedHiddenMs(0);
      setLastHiddenAt(nextMode === "flip" && document.hidden ? startTs : null);
      setRunning(true);
      setPaused(false);
      setNow(startTs);
    },
    [mode]
  );

  const pause = useCallback(() => {
    if (!running || paused) return;
    setPaused(true);
    setPauseStartedAt(Date.now());
    // In flip mode, also stop counting any hidden window
    if (mode === "flip" && lastHiddenAt) {
      setAccumulatedHiddenMs((acc) => acc + (Date.now() - lastHiddenAt));
      setLastHiddenAt(null);
    }
  }, [running, paused, mode, lastHiddenAt]);

  const resume = useCallback(() => {
    if (!running || !paused) return;
    if (pauseStartedAt) {
      setPausedMs((p) => p + (Date.now() - pauseStartedAt));
    }
    setPauseStartedAt(null);
    setPaused(false);
    if (mode === "flip" && document.hidden) {
      setLastHiddenAt(Date.now());
    }
  }, [running, paused, pauseStartedAt, mode]);

  const value: TimerContextValue = {
    mode,
    title,
    tag,
    hours,
    minutes,
    running,
    paused,
    startedAt,
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

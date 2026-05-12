import { useEffect, useMemo, useRef, useState } from "react";
import { CirclePause, CirclePlay, RotateCcw, Square, Smartphone } from "lucide-react";
import { FocusMode, FocusSession } from "../types";
import { getDeviceId } from "../lib/device";
import { AudioPicker } from "./AudioPicker";

const modeOptions: Array<{ label: string; value: FocusMode; minutes: number; icon?: any }> = [
  { label: "番茄钟", value: "pomodoro", minutes: 25 },
  { label: "长专注", value: "long", minutes: 50 },
  { label: "翻转专注", value: "flip", minutes: 25 },
  { label: "倒计时", value: "countdown", minutes: 30 },
  { label: "正计时", value: "stopwatch", minutes: 0 }
];

interface Props {
  onSave: (session: FocusSession) => Promise<void>;
}

export function TimerPanel({ onSave }: Props) {
  const [mode, setMode] = useState<FocusMode>("pomodoro");
  const [title, setTitle] = useState("深度专注");
  const [tag, setTag] = useState("工作");
  const [customMinutes, setCustomMinutes] = useState(25);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pauseStartedAt, setPauseStartedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [lastTickAt, setLastTickAt] = useState<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Flip mode logic
  useEffect(() => {
    if (mode !== "flip" || !running || paused) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // App became visible, in real OffScreen this would pause or fail the session
        // For web, we can just track if they left the page
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [mode, running, paused]);

  const plannedMinutes = useMemo(() => {
    if (mode === "stopwatch") return 0;
    if (mode === "countdown") return customMinutes;
    return modeOptions.find((item) => item.value === mode)?.minutes ?? 25;
  }, [customMinutes, mode]);

  const elapsedMs = useMemo(() => {
    if (!startedAt) return 0;
    const pauseExtra = paused && pauseStartedAt ? now - pauseStartedAt : 0;
    const baseElapsed = now - startedAt - pausedMs - pauseExtra;

    // In flip mode, if the page is visible, the timer doesn't progress (simulating face down)
    // However, for simpler implementation, we'll just show a warning UI later.
    return Math.max(0, baseElapsed);
  }, [now, paused, pauseStartedAt, pausedMs, startedAt]);

  const targetMs = plannedMinutes * 60 * 1000;

  const displayMs =
    mode === "stopwatch" ? elapsedMs : Math.max(0, targetMs - elapsedMs);

  const progress =
    mode === "stopwatch" || targetMs <= 0
      ? 0
      : Math.min(100, (elapsedMs / targetMs) * 100);

  const timeText = formatMs(displayMs);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!running || paused || mode === "stopwatch") return;
    if (targetMs > 0 && elapsedMs >= targetMs) {
      finish("completed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedMs, mode, paused, running, targetMs]);

  async function start() {
    sessionIdRef.current = crypto.randomUUID();
    setStartedAt(Date.now());
    setPausedMs(0);
    setPauseStartedAt(null);
    setPaused(false);
    setRunning(true);

    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  function pauseOrResume() {
    if (!running) return;

    if (paused) {
      if (pauseStartedAt) {
        setPausedMs((v) => v + Date.now() - pauseStartedAt);
      }
      setPauseStartedAt(null);
      setPaused(false);
    } else {
      setPauseStartedAt(Date.now());
      setPaused(true);
    }
  }

  async function finish(status: "completed" | "abandoned") {
    if (!startedAt || !sessionIdRef.current) return;

    const finishedAt = Date.now();
    const actualMinutes = Math.max(1, Math.round(elapsedMs / 60000));
    const isoNow = new Date().toISOString();

    const session: FocusSession = {
      id: sessionIdRef.current,
      deviceId: getDeviceId(),
      title: title.trim() || "未命名专注",
      tag: tag.trim() || "默认",
      mode,
      startTime: new Date(startedAt).toISOString(),
      endTime: new Date(finishedAt).toISOString(),
      plannedMinutes,
      actualMinutes,
      status,
      createdAt: new Date(startedAt).toISOString(),
      updatedAt: isoNow
    };

    await onSave(session);

    if (status === "completed" && "Notification" in window && Notification.permission === "granted") {
      new Notification("OpenFocus", {
        body: `已完成：${session.title}，本次专注 ${session.actualMinutes} 分钟。`
      });
    }

    reset();
  }

  function reset() {
    setRunning(false);
    setPaused(false);
    setStartedAt(null);
    setPauseStartedAt(null);
    setPausedMs(0);
    sessionIdRef.current = null;
  }

  return (
    <section className="offscreen-card text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Focus Session</p>
          <h2 className="mt-1 text-2xl font-bold">开始一次高质量专注</h2>
        </div>
        {mode === "flip" && (
          <div className="flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-500 ring-1 ring-orange-500/30">
            <Smartphone size={12} />
            Flip Mode
          </div>
        )}
      </div>

      <div className="mb-8 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {modeOptions.map((item) => (
          <button
            key={item.value}
            disabled={running}
            onClick={() => {
              setMode(item.value);
              if (item.value !== "countdown") setCustomMinutes(item.minutes || 25);
            }}
            className={`flex flex-col items-center gap-2 rounded-2xl py-3 transition-all ${
              mode === item.value
                ? "bg-white text-black scale-105 shadow-xl"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          disabled={running}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-[1.25rem] border border-white/5 bg-gray-800 px-5 py-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-white/10 disabled:opacity-50 sm:col-span-2"
          placeholder="正在做什么？"
        />
        <input
          disabled={running}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="rounded-[1.25rem] border border-white/5 bg-gray-800 px-5 py-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-white/10 disabled:opacity-50"
          placeholder="标签"
        />
      </div>

      {mode === "countdown" ? (
        <div className="mt-4 px-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <span>Duration</span>
            <span>{customMinutes} min</span>
          </div>
          <input
            disabled={running}
            type="range"
            min={5}
            max={180}
            step={5}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className="mt-3 w-full accent-white"
          />
        </div>
      ) : null}

      <div className="my-12 flex flex-col items-center">
        <div
          className="grid h-72 w-72 place-items-center rounded-full"
          style={{
            background:
              mode === "stopwatch"
                ? "radial-gradient(circle, rgba(255,255,255,0.03) 64%, rgba(255,255,255,0.08) 65%)"
                : `conic-gradient(white ${progress}%, rgba(255,255,255,0.05) ${progress}%)`
          }}
        >
          <div className="grid h-64 w-64 place-items-center rounded-full bg-black shadow-inner">
            <div className="text-center">
              <div className="text-6xl font-black tabular-nums tracking-tighter">{timeText}</div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                {running ? (paused ? "Paused" : "Focusing") : "Ready"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {!running ? (
          <button onClick={start} className="btn-primary w-full sm:w-auto">
            <CirclePlay size={20} />
            开始专注
          </button>
        ) : (
          <>
            <button onClick={pauseOrResume} className="btn-secondary">
              <CirclePause size={20} />
              {paused ? "继续" : "暂停"}
            </button>
            <button onClick={() => finish("completed")} className="btn-primary">
              <Square size={18} />
              完成
            </button>
            <button onClick={() => finish("abandoned")} className="btn-danger">
              <RotateCcw size={18} />
              放弃
            </button>
          </>
        )}
      </div>

      <AudioPicker />
    </section>
  );
}

function formatMs(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

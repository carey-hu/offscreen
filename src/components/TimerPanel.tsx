import { useEffect, useMemo, useRef, useState } from "react";
import { CirclePause, CirclePlay, RotateCcw, Square } from "lucide-react";
import { FocusMode, FocusSession } from "../types";
import { getDeviceId } from "../lib/device";

const modeOptions: Array<{ label: string; value: FocusMode; minutes: number }> = [
  { label: "番茄钟", value: "pomodoro", minutes: 25 },
  { label: "长专注", value: "long", minutes: 50 },
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
  const sessionIdRef = useRef<string | null>(null);

  const plannedMinutes = useMemo(() => {
    if (mode === "stopwatch") return 0;
    if (mode === "countdown") return customMinutes;
    return modeOptions.find((item) => item.value === mode)?.minutes ?? 25;
  }, [customMinutes, mode]);

  const elapsedMs = useMemo(() => {
    if (!startedAt) return 0;
    const pauseExtra = paused && pauseStartedAt ? now - pauseStartedAt : 0;
    return Math.max(0, now - startedAt - pausedMs - pauseExtra);
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
    <section className="rounded-[2rem] bg-gray-950 p-6 text-white shadow-xl">
      <div className="mb-5">
        <p className="text-sm text-gray-400">当前专注</p>
        <h2 className="mt-1 text-2xl font-semibold">开始一次高质量专注</h2>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {modeOptions.map((item) => (
          <button
            key={item.value}
            disabled={running}
            onClick={() => {
              setMode(item.value);
              if (item.value !== "countdown") setCustomMinutes(item.minutes || 25);
            }}
            className={`rounded-2xl px-3 py-2 text-sm transition ${
              mode === item.value
                ? "bg-white text-gray-950"
                : "bg-white/10 text-gray-300 hover:bg-white/15"
            } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          disabled={running}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-gray-500 disabled:opacity-70 sm:col-span-2"
          placeholder="任务名称，例如：论文修改"
        />
        <input
          disabled={running}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-gray-500 disabled:opacity-70"
          placeholder="标签"
        />
      </div>

      {mode === "countdown" ? (
        <div className="mt-3">
          <label className="text-sm text-gray-400">倒计时时长：{customMinutes} 分钟</label>
          <input
            disabled={running}
            type="range"
            min={5}
            max={180}
            step={5}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>
      ) : null}

      <div className="my-8 flex flex-col items-center">
        <div
          className="grid h-64 w-64 place-items-center rounded-full"
          style={{
            background:
              mode === "stopwatch"
                ? "radial-gradient(circle, rgba(255,255,255,.08) 58%, rgba(255,255,255,.16) 59%)"
                : `conic-gradient(white ${progress}%, rgba(255,255,255,.12) ${progress}%)`
          }}
        >
          <div className="grid h-56 w-56 place-items-center rounded-full bg-gray-950">
            <div className="text-center">
              <div className="text-5xl font-semibold tabular-nums">{timeText}</div>
              <p className="mt-3 text-sm text-gray-400">
                {running ? (paused ? "已暂停" : "专注中") : "准备开始"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {!running ? (
          <button onClick={start} className="btn-primary">
            <CirclePlay size={20} />
            开始
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

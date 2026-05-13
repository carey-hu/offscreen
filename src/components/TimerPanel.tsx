import { useEffect, useMemo, useRef, useState } from "react";
import { CirclePlay, Square, RotateCcw, Smartphone, ChevronDown } from "lucide-react";
import { FocusMode, FocusSession } from "../types";
import { getDeviceId } from "../lib/device";
import { AudioPicker } from "./AudioPicker";
import { WheelPicker } from "./WheelPicker";

const modeOptions: Array<{ label: string; value: FocusMode; minutes: number }> = [
  { label: "番茄钟", value: "pomodoro", minutes: 25 },
  { label: "倒计时", value: "countdown", minutes: 30 },
  { label: "正计时", value: "stopwatch", minutes: 0 }
];

interface Props {
  onSave: (session: FocusSession) => Promise<void>;
}

export function TimerPanel({ onSave }: Props) {
  const [mode, setMode] = useState<FocusMode>("countdown");
  const [title, setTitle] = useState("深度专注");
  const [tag, setTag] = useState("工作");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [accumulatedHiddenMs, setAccumulatedHiddenMs] = useState(0);
  const [lastHiddenAt, setLastHiddenAt] = useState<number | null>(null);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  const plannedMinutes = useMemo(() => {
    if (mode === "stopwatch") return 0;
    return hours * 60 + minutes;
  }, [hours, minutes, mode]);

  const targetMs = plannedMinutes * 60 * 1000;

  const elapsedMs = useMemo(() => {
    if (!startedAt) return 0;
    if (mode === "flip") {
      const currentHiddenExtra = (lastHiddenAt && !paused) ? now - lastHiddenAt : 0;
      return Math.max(0, accumulatedHiddenMs + currentHiddenExtra);
    }
    const baseElapsed = now - startedAt - pausedMs;
    return Math.max(0, baseElapsed);
  }, [now, paused, startedAt, mode, accumulatedHiddenMs, lastHiddenAt, pausedMs]);

  const displayMs = mode === "stopwatch" ? elapsedMs : Math.max(0, targetMs - elapsedMs);
  const progress = (mode === "stopwatch" || targetMs <= 0) ? 0 : Math.min(100, (elapsedMs / targetMs) * 100);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!running || paused || mode === "stopwatch") return;
    if (targetMs > 0 && elapsedMs >= targetMs) finish("completed");
  }, [elapsedMs, mode, paused, running, targetMs]);

  async function start() {
    sessionIdRef.current = crypto.randomUUID();
    setStartedAt(Date.now());
    setPausedMs(0);
    setRunning(true);
    setAccumulatedHiddenMs(0);
  }

  async function finish(status: "completed" | "abandoned") {
    if (!startedAt || !sessionIdRef.current) return;
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
  }

  function reset() {
    setRunning(false);
    setPaused(false);
    setStartedAt(null);
    setPausedMs(0);
    setAccumulatedHiddenMs(0);
    setLastHiddenAt(null);
    setIsInterrupted(false);
  }

  return (
    <div className="flex flex-col items-center">
      {/* Mode Selectors */}
      <div className="flex items-center gap-2 mb-8">
        <button className="flex items-center gap-2 bg-[#22222b] px-4 py-2 rounded-xl text-xs font-bold text-gray-400">
          <span>专注于</span>
          <span className="text-white">🐟 full time 数量</span>
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="flex gap-4 mb-10">
        {modeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            disabled={running}
            className={`pill-button ${mode === opt.value ? "pill-button-active" : ""}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Timer Display */}
      <div className="relative mb-12">
        <div
          className="grid h-[380px] w-[380px] place-items-center rounded-full border-[12px] border-[#22222b]"
          style={{
            background: `conic-gradient(#8a8aff ${progress}%, transparent ${progress}%)`,
            maskImage: 'radial-gradient(transparent 64%, black 65%)',
            WebkitMaskImage: 'radial-gradient(transparent 64%, black 65%)'
          }}
        />
        {/* Progress Ring Overlay (Secondary) */}
        <div className="absolute inset-0 grid h-[380px] w-[380px] place-items-center rounded-full border-[12px] border-[#22222b] opacity-20" />

        <div className="absolute inset-0 flex items-center justify-center">
          {!running ? (
            <div className="flex items-center gap-4">
              <WheelPicker value={hours} onChange={setHours} max={23} label="小时" />
              <WheelPicker value={minutes} onChange={setMinutes} max={59} label="分钟" />
            </div>
          ) : (
            <div className="text-center">
              <div className="text-7xl font-black tracking-tighter tabular-nums">
                {formatMs(displayMs)}
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-gray-600">
                {paused ? "Paused" : "Focusing"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-xs space-y-4">
        {!running ? (
          <button onClick={start} className="btn-primary w-full text-indigo-400">
            开始专注
          </button>
        ) : (
          <div className="flex gap-3">
             <button onClick={() => setPaused(!paused)} className="btn-secondary flex-1">
               {paused ? "继续" : "暂停"}
             </button>
             <button onClick={() => finish("completed")} className="btn-primary flex-1 !bg-white !text-black">
               完成
             </button>
             <button onClick={() => finish("abandoned")} className="btn-danger p-4">
               <RotateCcw size={20} />
             </button>
          </div>
        )}
      </div>

      <div className="mt-12 w-full">
         <AudioPicker />
      </div>
    </div>
  );
}

function formatMs(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(v: number) {
  return v.toString().padStart(2, "0");
}

import { RotateCcw, ChevronDown, Coffee } from "lucide-react";
import { FocusMode } from "../types";
import { WheelPicker } from "./WheelPicker";
import { useTimer } from "../contexts/TimerContext";
import { useState } from "react";

const modeOptions: Array<{ label: string; value: FocusMode }> = [
  { label: "番茄钟",   value: "pomodoro" },
  { label: "长专注",   value: "long" },
  { label: "倒计时",   value: "countdown" },
  { label: "正计时",   value: "stopwatch" }
];

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function TimerPanel() {
  const t = useTimer();
  const [editing, setEditing] = useState(false);

  const dashOffset = RING_CIRCUMFERENCE * (1 - Math.min(1, t.progress / 100));

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-6 sm:mb-8 max-w-full">
        {editing ? (
          <div className="flex items-center gap-2 bg-card px-3 sm:px-4 py-2 rounded-xl text-xs font-bold">
            <input
              value={t.title}
              onChange={(e) => t.setTitle(e.target.value)}
              className="bg-transparent text-primary outline-none w-24 sm:w-28"
              placeholder="标题"
            />
            <span className="text-faint">·</span>
            <input
              value={t.tag}
              onChange={(e) => t.setTag(e.target.value)}
              className="bg-transparent text-[var(--accent-text)] outline-none w-16 sm:w-20"
              placeholder="标签"
            />
            <button
              onClick={() => setEditing(false)}
              className="ml-2 text-muted hover:text-primary"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            disabled={t.running}
            className="flex items-center gap-2 bg-card px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-primary transition disabled:opacity-60 max-w-full"
          >
            <span className="shrink-0">专注于</span>
            <span className="text-primary truncate max-w-[120px] sm:max-w-[200px]">{t.title}</span>
            <span className="text-[var(--accent-text)] truncate max-w-[80px]">#{t.tag}</span>
            <ChevronDown size={14} className="shrink-0" />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3 flex-wrap justify-center max-w-full">
        {modeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => t.setMode(opt.value)}
            disabled={t.running}
            className={`pill-button disabled:opacity-50 disabled:cursor-not-allowed ${
              t.mode === opt.value ? "pill-button-active" : ""
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!t.running && (
        <button
          onClick={() => t.startBreak()}
          className="mb-8 sm:mb-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition active:scale-95"
          style={{
            background: "rgba(48, 209, 88, 0.12)",
            color: "#30D158"
          }}
        >
          <Coffee size={13} strokeWidth={2.25} />
          短休息 · {t.shortBreakMinutes} 分钟
        </button>
      )}

      {t.running && <div className="mb-8 sm:mb-10" />}

      <div
        className="relative mb-10 sm:mb-12"
        style={{ width: "min(380px, 82vw)", height: "min(380px, 82vw)" }}
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8a8aff" />
              <stop offset="50%" stopColor="#a89aff" />
              <stop offset="100%" stopColor="#c08aff" />
            </linearGradient>
            <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--bg-surface)"
            strokeWidth="3"
          />

          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="3.2"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            filter="url(#ring-glow)"
            style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          {!t.running ? (
            <div className="flex flex-col items-center">
              {t.mode === "stopwatch" ? (
                <div className="text-6xl sm:text-8xl font-black tracking-tighter tabular-nums text-primary">
                  00:00
                </div>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4">
                  <WheelPicker value={t.hours} onChange={t.setHours} max={23} label="小时" />
                  <WheelPicker value={t.minutes} onChange={t.setMinutes} max={59} label="分钟" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl sm:text-8xl font-black tracking-tighter tabular-nums text-primary">
                {formatMs(t.displayMs)}
              </div>
              <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-faint">
                {t.paused ? "Paused" : "Focusing"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {!t.running ? (
          <button onClick={() => t.start()} className="btn-primary w-full">
            开始专注
          </button>
        ) : (
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => (t.paused ? t.resume() : t.pause())}
              className="btn-secondary flex-1 !px-4 sm:!px-6 !text-sm !py-3.5"
            >
              {t.paused ? "继续" : "暂停"}
            </button>
            <button
              onClick={() => t.finish("completed")}
              className="btn-primary flex-1 !px-4 sm:!px-6 !text-sm !py-3.5"
            >
              完成
            </button>
            <button onClick={() => t.finish("abandoned")} className="btn-danger !px-3 sm:!px-3.5 !py-3.5">
              <RotateCcw size={20} />
            </button>
          </div>
        )}
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

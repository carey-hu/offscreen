import { RotateCcw, ChevronDown, Smartphone } from "lucide-react";
import { FocusMode } from "../types";
import { AudioPicker } from "./AudioPicker";
import { WheelPicker } from "./WheelPicker";
import { useTimer } from "../contexts/TimerContext";
import { useState } from "react";

const modeOptions: Array<{ label: string; value: FocusMode }> = [
  { label: "番茄钟",   value: "pomodoro" },
  { label: "长专注",   value: "long" },
  { label: "倒计时",   value: "countdown" },
  { label: "正计时",   value: "stopwatch" },
  { label: "翻转",     value: "flip" }
];

export function TimerPanel() {
  const t = useTimer();
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* Title / Tag editor */}
      <div className="flex items-center gap-2 mb-8">
        {editing ? (
          <div className="flex items-center gap-2 bg-[#22222b] px-4 py-2 rounded-xl text-xs font-bold">
            <input
              value={t.title}
              onChange={(e) => t.setTitle(e.target.value)}
              className="bg-transparent text-white outline-none w-28"
              placeholder="标题"
            />
            <span className="text-gray-600">·</span>
            <input
              value={t.tag}
              onChange={(e) => t.setTag(e.target.value)}
              className="bg-transparent text-indigo-300 outline-none w-20"
              placeholder="标签"
            />
            <button
              onClick={() => setEditing(false)}
              className="ml-2 text-gray-500 hover:text-white"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            disabled={t.running}
            className="flex items-center gap-2 bg-[#22222b] px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition disabled:opacity-60"
          >
            <span>专注于</span>
            <span className="text-white">{t.title}</span>
            <span className="text-indigo-400/80">#{t.tag}</span>
            <ChevronDown size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-10 flex-wrap justify-center">
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

      {/* Main Timer Display */}
      <div className="relative mb-12">
        <div
          className="grid h-[380px] w-[380px] place-items-center rounded-full border-[12px] border-[#22222b]"
          style={{
            background: `conic-gradient(#8a8aff ${t.progress}%, transparent ${t.progress}%)`,
            maskImage: "radial-gradient(transparent 64%, black 65%)",
            WebkitMaskImage: "radial-gradient(transparent 64%, black 65%)"
          }}
        />
        <div className="absolute inset-0 grid h-[380px] w-[380px] place-items-center rounded-full border-[12px] border-[#22222b] opacity-20" />

        <div className="absolute inset-0 flex items-center justify-center">
          {!t.running ? (
            <div className="flex flex-col items-center">
              {t.mode === "stopwatch" ? (
                <div className="text-7xl font-black tracking-tighter tabular-nums text-white">
                  00:00
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <WheelPicker value={t.hours} onChange={t.setHours} max={23} label="小时" />
                  <WheelPicker value={t.minutes} onChange={t.setMinutes} max={59} label="分钟" />
                </div>
              )}
              {t.mode === "flip" && (
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  <Smartphone size={12} />
                  <span>扣屏即专注 · 翻回即暂停</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-7xl font-black tracking-tighter tabular-nums">
                {formatMs(t.displayMs)}
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-gray-600">
                {t.paused ? "Paused" : t.mode === "flip" ? "Flip Mode" : "Focusing"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-xs space-y-4">
        {!t.running ? (
          <button onClick={() => t.start()} className="btn-primary w-full text-indigo-400">
            开始专注
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => (t.paused ? t.resume() : t.pause())}
              className="btn-secondary flex-1"
            >
              {t.paused ? "继续" : "暂停"}
            </button>
            <button
              onClick={() => t.finish("completed")}
              className="btn-primary flex-1 !bg-white !text-black"
            >
              完成
            </button>
            <button onClick={() => t.finish("abandoned")} className="btn-danger p-4">
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

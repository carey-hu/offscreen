import { format } from "date-fns";
import { CalendarDays, RefreshCw, Send, Sparkles, Zap } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { MoodEntry, StarPosition } from "../types";
import { settleNewStar, getDropX, getRandomR, JarBounds, PhysicsStar } from "../lib/physics";
import { makeStarPath } from "../lib/starPath";
import { computeGalaxyGlow } from "../lib/galaxyGlow";

interface Props {
  entries: MoodEntry[];
  todayCount: number;
  streak: number;
  onViewCalendar: () => void;
  onAddOne: (content: string) => Promise<void>;
  onAddMany: (entries: Array<{ content: string }>) => Promise<void>;
  onReset: () => Promise<void>;
}

function hasPosition(e: MoodEntry): e is MoodEntry & { position: StarPosition } {
  return e.position !== undefined;
}

function entryCountByDate(entries: MoodEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  entries.forEach((e) => m.set(e.date, (m.get(e.date) ?? 0) + 1));
  return m;
}

const JAR_BOUNDS: JarBounds = {
  left: 42, right: 258, bottom: 310, floor: 314, neck: 120,
  gravity: 0.55, bounce: 0.35, friction: 0.85
};

function computeAllPositions(entries: MoodEntry[]): Map<string, PhysicsStar> {
  const result = new Map<string, PhysicsStar>();
  const existing: PhysicsStar[] = [];
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const entry of sorted) {
    if (entry.position) {
      const p = entry.position;
      result.set(entry.id, { x: p.x, y: p.y, r: p.r, rot: p.rot });
      existing.push({ x: p.x, y: p.y, r: p.r, rot: p.rot });
    } else {
      const r = getRandomR();
      const dropX = getDropX(JAR_BOUNDS);
      const pos = settleNewStar({ x: dropX, r }, existing, JAR_BOUNDS);
      result.set(entry.id, pos);
      existing.push(pos);
    }
  }
  return result;
}

// 3D depth-based star color — deeper stars are warmer/darker
function starFill(y: number, bottom: number): string {
  const depth = (y - 130) / (bottom - 130); // 0 at top, 1 at bottom
  const t = Math.max(0, Math.min(1, depth));
  const r = 255;
  const g = Math.round(220 - t * 80);
  const b = Math.round(140 - t * 100);
  return `rgb(${r},${g},${b})`;
}

const QUICK_CONTENTS = [
  "阳光洒在书桌上", "喝到了好喝的咖啡", "完成了运动目标",
  "朋友发来暖心消息", "看到路边小花开了", "学到了新技巧",
  "吃到一顿美味的饭", "傍晚天空特别美", "听到很喜欢的歌",
  "收到意外的惊喜", "工作效率很高", "帮助了需要帮助的人",
  "发现一本好看的书", "和好朋友聊天", "做了一个好梦",
  "天气好适合散步", "做出了满意的作品", "小猫主动来蹭我",
  "解锁了新成就", "心情莫名很平静"
];

export function StarJarView({ entries, todayCount, streak, onViewCalendar, onAddOne, onAddMany, onReset }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [filling, setFilling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const countMap = useMemo(() => entryCountByDate(entries), [entries]);
  const glow = useMemo(() => computeGalaxyGlow(entries.length), [entries]);
  const starPositions = useMemo(() => computeAllPositions(entries), [entries]);

  const newestEntryId = useMemo(() => {
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => a.createdAt > b.createdAt ? a : b).id;
  }, [entries]);

  async function handleSend() {
    const v = text.trim();
    if (!v || sending) return;
    setSending(true);
    await onAddOne(v);
    setText("");
    setSending(false);
    inputRef.current?.focus();
  }

  async function handleFill() {
    setFilling(true);
    await onAddMany(QUICK_CONTENTS.slice(0, 10).map((c) => ({ content: c })));
    setFilling(false);
  }

  async function handleReset() {
    if (!confirm("清空所有星星？这将删除全部心情记录。")) return;
    setResetting(true);
    await onReset();
    setResetting(false);
  }

  const dates = useMemo(() => Array.from(countMap.keys()), [countMap]);
  const entriesWithPos = useMemo(() => entries.filter(hasPosition), [entries]);

  return (
    <div className="flex flex-col items-center">
      {/* Galaxy level */}
      <div className="mb-2">
        <span className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: "var(--star-glow)" }}>
          {glow.level}
        </span>
      </div>

      {/* Streak */}
      <div className="mb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">连续亮星</span>
        </div>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl sm:text-5xl font-black tabular-nums" style={{ color: "var(--star-glow)" }}>{streak}</span>
          <span className="text-base font-black text-muted">天</span>
        </div>
      </div>

      {/* 3D perspective jar container */}
      <div
        className="relative cursor-pointer group mb-4 select-none"
        onClick={onViewCalendar}
        style={{
          width: 300,
          height: 420,
          perspective: "800px"
        }}
      >
        <svg
          viewBox="0 0 300 430"
          className="w-full h-full"
          style={{
            overflow: "visible",
            transform: "rotateX(4deg)",
            transformStyle: "preserve-3d"
          }}
        >
          <defs>
            {/* Star per-element glow filter */}
            <filter id="starGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="starGlowSoft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Galaxy glow gradients */}
            <radialGradient id="galaxyCore">
              <stop offset="0%" stopColor="#fff8d6" stopOpacity="1" />
              <stop offset="35%" stopColor="#ffe08a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#f0a040" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="galaxyMid">
              <stop offset="0%" stopColor="#fff0b0" stopOpacity="0.65" />
              <stop offset="55%" stopColor="#e89050" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8050a0" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="galaxyOuter">
              <stop offset="0%" stopColor="#c0a0e0" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#7060b0" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#403060" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="galaxyHalo">
              <stop offset="0%" stopColor="#90a8e8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#405080" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="jarInnerGlow">
              <stop offset="0%" stopColor="#fff6c8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#e09040" stopOpacity="0" />
            </radialGradient>

            {/* Glass material */}
            <linearGradient id="glassBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(251,191,36,0.12)" />
              <stop offset="30%" stopColor="rgba(251,191,36,0.03)" />
              <stop offset="70%" stopColor="rgba(251,191,36,0.02)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0.06)" />
            </linearGradient>
            <linearGradient id="glassHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="12%" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            <clipPath id="jarClip">
              <path d="
                M 135 112
                C 132 98, 122 92, 112 92
                L 58 92
                C 42 92, 40 104, 40 116
                L 40 126
                C 16 155, 14 185, 14 225
                C 14 295, 26 345, 60 375
                C 80 390, 105 398, 150 400
                C 195 398, 220 390, 240 375
                C 274 345, 286 295, 286 225
                C 286 185, 284 155, 260 126
                L 260 116
                C 260 104, 258 92, 242 92
                L 188 92
                C 178 92, 168 98, 165 112
                L 165 125
                C 165 136, 172 140, 178 140
                L 190 140
                L 190 210
                C 190 255, 170 280, 150 290
                C 130 280, 110 255, 110 210
                L 110 140
                L 122 140
                C 128 140, 135 136, 135 125 Z
              " />
            </clipPath>
          </defs>

          {/* Galaxy glow — behind jar */}
          <g style={{ animation: `galaxyBreathing ${4 + entries.length * 0.3}s ease-in-out infinite` }}>
            <ellipse cx="150" cy="260" rx={glow.halo.rx} ry={glow.halo.ry}
              fill="url(#galaxyHalo)" opacity={glow.halo.opacity} />
            <ellipse cx="150" cy="260" rx={glow.outer.rx} ry={glow.outer.ry}
              fill="url(#galaxyOuter)" opacity={glow.outer.opacity} />
            <ellipse cx="150" cy="260" rx={glow.mid.rx} ry={glow.mid.ry}
              fill="url(#galaxyMid)" opacity={glow.mid.opacity} />
            <ellipse cx="150" cy="260" rx={glow.core.rx} ry={glow.core.ry}
              fill="url(#galaxyCore)" opacity={glow.core.opacity} />
          </g>

          {/* Jar glass body */}
          <path
            d="M 135 112 C 132 98, 122 92, 112 92 L 58 92 C 42 92, 40 104, 40 116 L 40 126 C 16 155, 14 185, 14 225 C 14 295, 26 345, 60 375 C 80 390, 105 398, 150 400 C 195 398, 220 390, 240 375 C 274 345, 286 295, 286 225 C 286 185, 284 155, 260 126 L 260 116 C 260 104, 258 92, 242 92 L 188 92 C 178 92, 168 98, 165 112 L 165 125 C 165 136, 172 140, 178 140 L 190 140 L 190 210 C 190 255, 170 280, 150 290 C 130 280, 110 255, 110 210 L 110 140 L 122 140 C 128 140, 135 136, 135 125 Z"
            fill="url(#glassBody)"
            stroke="rgba(251,191,36,0.18)"
            strokeWidth="1.5"
          />

          {/* Jar inner bottom glow */}
          <ellipse cx="150" cy="350" rx="105" ry="55"
            fill="url(#jarInnerGlow)" opacity={glow.inner.opacity} />

          {/* Glass highlight */}
          <path
            d="M 52 135 C 45 170, 44 210, 48 240 L 64 235 C 58 210, 58 165, 64 140 Z"
            fill="url(#glassHighlight)" opacity="0.45"
          />

          {/* Stars — clipped to jar interior */}
          <g clipPath="url(#jarClip)">
            {entriesWithPos.map((entry) => {
              const pos = starPositions.get(entry.id);
              if (!pos) return null;
              const isToday = entry.date === todayStr;
              const fill = starFill(pos.y, JAR_BOUNDS.floor);
              const path = makeStarPath(pos.x, pos.y, pos.r, pos.rot);
              const isNew = entry.id === newestEntryId;
              return (
                <g key={entry.id} filter={isToday ? "url(#starGlow)" : "url(#starGlowSoft)"}>
                  <path
                    d={path}
                    fill={fill}
                    opacity={isToday ? 1 : 0.75}
                    style={{
                      animation: isNew
                        ? "starSettle 0.7s cubic-bezier(0.16,1,0.3,1) forwards"
                        : undefined
                    }}
                  />
                </g>
              );
            })}

            {/* Placeholder when empty */}
            {entries.length === 0 && (
              <g opacity="0.25" style={{ animation: "galaxyBreathing 3s ease-in-out infinite" }}>
                <path d={makeStarPath(150, 240, 18, 0)} fill="#fff6c8" filter="url(#starGlowSoft)" />
              </g>
            )}
          </g>

          {/* Sparkle particles */}
          {Array.from({ length: 14 }, (_, i) => {
            const sx = 30 + ((i * 73 + 41) % 240);
            const sy = 110 + ((i * 67 + 29) % 270);
            return (
              <circle key={i} cx={sx} cy={sy} r={1.5 + (i % 4)}
                fill="#fff6c8" opacity="0"
                style={{ animation: `sparkle ${2 + i * 0.5}s ease-in-out ${i * 0.4}s infinite` }}
              />
            );
          })}
        </svg>
      </div>

      {/* Bottom input bar */}
      <div className="w-full max-w-sm flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="今天有什么开心的事？"
            className="w-full rounded-2xl bg-card px-4 py-3 text-sm font-bold text-primary outline-none ring-1 ring-subtle focus:ring-2 focus:ring-amber-400/50 placeholder:text-faint transition"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="grid h-11 w-11 place-items-center rounded-2xl transition active:scale-95 disabled:opacity-30 shrink-0"
          style={{ background: "var(--star-bright)", color: "#1c1c1e" }}
        >
          <Send size={18} />
        </button>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <button onClick={onViewCalendar}
          className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold transition active:scale-95"
          style={{ background: "rgba(251,191,36,0.1)", color: "var(--star-bright)" }}>
          <CalendarDays size={14} /> 查看日历
        </button>
        <button onClick={handleFill} disabled={filling}
          className="flex items-center gap-1 rounded-full px-4 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-40"
          style={{ background: "rgba(251,191,36,0.06)", color: "var(--star-dim)" }}>
          <Zap size={14} /> {filling ? "..." : "填充10颗"}
        </button>
        <button onClick={handleReset} disabled={resetting || entries.length === 0}
          className="flex items-center gap-1 rounded-full px-3 py-2.5 text-xs font-bold text-muted hover:text-red-400 transition disabled:opacity-30">
          <RefreshCw size={14} /> 清空
        </button>
      </div>
    </div>
  );
}

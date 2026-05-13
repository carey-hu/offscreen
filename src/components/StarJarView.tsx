import { format } from "date-fns";
import { Send, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { MoodEntry, StarPosition } from "../types";
import { settleNewStar, getDropX, getRandomR, JarBounds, PhysicsStar } from "../lib/physics";
import { makeRoundedStarPath } from "../lib/starPath";
import { computeGalaxyGlow } from "../lib/galaxyGlow";

interface Props {
  entries: MoodEntry[];
  todayCount: number;
  streak: number;
  onViewCalendar: () => void;
  onAddOne: (content: string) => Promise<void>;
  onReset: () => Promise<void>;
}

function hasPosition(e: MoodEntry): e is MoodEntry & { position: StarPosition } {
  return e.position !== undefined;
}

const JAR_BOUNDS: JarBounds = {
  left: 48, right: 272, bottom: 340, floor: 365, neck: 120,
  gravity: 0.5, bounce: 0.3, friction: 0.85
};

// Star positions — irregular distribution throughout jar volume
function computeStarLayout(entries: MoodEntry[]): Map<string, PhysicsStar> {
  const result = new Map<string, PhysicsStar>();
  const placed: PhysicsStar[] = [];
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (entry.position) {
      const p = entry.position;
      // Remap: spread through jar volume using golden-ratio distribution
      const phi = (1 + Math.sqrt(5)) / 2;
      const frac = sorted.length > 1 ? ((i * phi) % 1) : 0.55;
      const bandH = JAR_BOUNDS.floor - JAR_BOUNDS.neck - 100;
      const baseY = JAR_BOUNDS.neck + 40 + bandH * (0.15 + frac * 0.7);
      const jitterY = Math.sin(i * 3.1 + 0.9) * (bandH * 0.08);
      const jitterX = Math.cos(i * 2.4 + 1.2) * 15;
      const x = Math.min(JAR_BOUNDS.right - p.r - 10, Math.max(JAR_BOUNDS.left + p.r + 10, p.x + jitterX));
      const y = Math.min(JAR_BOUNDS.floor - p.r, Math.max(JAR_BOUNDS.neck + 20, baseY + jitterY));

      result.set(entry.id, { x, y, r: p.r, rot: p.rot });
      placed.push({ x, y, r: p.r, rot: p.rot });
    } else {
      const r = getRandomR();
      const dropX = getDropX(JAR_BOUNDS);
      const pos = settleNewStar({ x: dropX, r }, placed, JAR_BOUNDS);
      result.set(entry.id, pos);
      placed.push(pos);
    }
  }
  return result;
}

function starColor(i: number, n: number): string {
  const t = n > 0 ? i / n : 0;
  const r = 255;
  const g = Math.round(235 - t * 55);
  const b = Math.round(175 - t * 115);
  return `rgb(${r},${g},${b})`;
}

export function StarJarView({ entries, todayCount, streak, onViewCalendar, onAddOne, onReset }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const total = entries.length;
  const glow = useMemo(() => computeGalaxyGlow(total), [total]);
  const starPositions = useMemo(() => computeStarLayout(entries), [entries]);
  const entriesWithPos = useMemo(() => entries.filter(hasPosition), [entries]);

  // Jar outer glow radius scales with star count (0 → 40px blur)
  const jarGlowBlur = Math.min(40, 4 + total * 1.4);
  const jarGlowOpacity = Math.min(0.55, 0.05 + total * 0.02);

  async function handleSend() {
    const v = text.trim();
    if (!v || sending) return;
    setSending(true);
    await onAddOne(v);
    setText("");
    setSending(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col items-center">
      {/* ── Three stats ── */}
      <div className="w-full max-w-[320px] flex justify-between mb-5 px-2">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">今日星星</span>
          <span className="text-2xl font-black tabular-nums" style={{ color: "var(--star-bright)" }}>
            {todayCount}<span className="text-xs font-bold text-muted ml-0.5">颗</span>
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">连续亮星</span>
          <span className="text-2xl font-black tabular-nums" style={{ color: "var(--star-glow)" }}>
            {streak}<span className="text-xs font-bold text-muted ml-0.5">天</span>
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">累计星星</span>
          <span className="text-2xl font-black tabular-nums" style={{ color: "var(--star-bright)" }}>
            {total}<span className="text-xs font-bold text-muted ml-0.5">颗</span>
          </span>
        </div>
      </div>

      {/* ── Fat round glass jar ── */}
      <div
        className="relative mb-5 select-none cursor-pointer"
        style={{ width: 320, height: 420 }}
        onClick={onViewCalendar}
      >
        <svg
          viewBox="0 0 320 490"
          className="w-full h-full"
          style={{
            overflow: "visible",
            filter: `drop-shadow(0 0 var(--glow-blur) rgba(var(--jar-glow-rgb), var(--glow-opacity)))`,
            transition: "filter 0.8s ease",
            "--glow-blur": `${jarGlowBlur}px`,
            "--glow-opacity": jarGlowOpacity,
          } as React.CSSProperties}
        >
          <defs>
            {/* Star glow filters — strong for today, soft for others */}
            <filter id="sgStrong" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="sgSoft" x="-45%" y="-45%" width="190%" height="190%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Galaxy glow behind jar */}
            <radialGradient id="gCore" cx="50%" cy="58%" r="35%">
              <stop offset="0%" stopColor="#fff8d6" stopOpacity="0.55" />
              <stop offset="35%" stopColor="#ffe08a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#e89840" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gMid" cx="50%" cy="58%" r="50%">
              <stop offset="0%" stopColor="#fff0b0" stopOpacity="0.3" />
              <stop offset="55%" stopColor="#e0a060" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#7060b0" stopOpacity="0" />
            </radialGradient>

            {/* Inner bottom glow */}
            <radialGradient id="innerGlow" cx="50%" cy="88%" r="38%">
              <stop offset="0%" stopColor="#fff4c0" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#e8a050" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#c07030" stopOpacity="0" />
            </radialGradient>

            {/* Glass fill — very subtle */}
            <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="35%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="70%" stopColor="rgba(255,248,235,0.02)" />
              <stop offset="100%" stopColor="rgba(255,235,210,0.06)" />
            </linearGradient>

            {/* Left highlight */}
            <linearGradient id="hlL" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
              <stop offset="8%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Right rim light */}
            <linearGradient id="hlR" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="5%" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Jar interior clip */}
            <clipPath id="jarInterior">
              <path d="
                M 140 102
                C 137 92, 130 87, 122 87
                L 82 87
                C 67 87, 62 95, 62 105
                L 62 118
                C 40 155, 36 200, 36 275
                C 36 355, 54 415, 92 442
                C 118 458, 142 464, 160 464
                C 178 464, 202 458, 228 442
                C 266 415, 284 355, 284 275
                C 284 200, 280 155, 258 118
                L 258 105
                C 258 95, 253 87, 238 87
                L 198 87
                C 190 87, 183 92, 180 102
              " />
            </clipPath>
          </defs>

          {/* Galaxy glow behind jar */}
          <g style={{ animation: `galaxyBreathing ${4 + total * 0.25}s ease-in-out infinite` }}>
            <ellipse cx="160" cy="300" rx={glow.mid.rx + 15} ry={glow.mid.ry + 12}
              fill="url(#gMid)" opacity={glow.mid.opacity} />
            <ellipse cx="160" cy="300" rx={glow.core.rx + 8} ry={glow.core.ry + 6}
              fill="url(#gCore)" opacity={glow.core.opacity} />
          </g>

          {/* Stars clipped to jar interior */}
          <g clipPath="url(#jarInterior)">
            {entriesWithPos.map((entry, idx) => {
              const pos = starPositions.get(entry.id);
              if (!pos) return null;
              const isToday = entry.date === todayStr;
              const color = starColor(idx, entriesWithPos.length);
              const path = makeRoundedStarPath(pos.x, pos.y, pos.r, pos.rot);
              const animName = `starFloat${1 + (idx % 5)}`;
              const delay = (idx * 0.37) % 4.5;
              return (
                <g key={entry.id} filter={isToday ? "url(#sgStrong)" : "url(#sgSoft)"}>
                  <path
                    d={path}
                    fill={color}
                    stroke="var(--jar-stroke)"
                    strokeWidth="1.2"
                    opacity={isToday ? 1 : 0.7 + (idx % 3) * 0.1}
                    style={{
                      animation: `${animName} ${5.5 + (idx % 3) * 1.1}s ease-in-out ${delay}s infinite, starDrop 0.65s cubic-bezier(0.16,1,0.3,1) forwards`
                    }}
                  />
                </g>
              );
            })}

            {/* Empty state */}
            {total === 0 && (
              <g opacity="0.15" style={{ animation: "galaxyBreathing 3.5s ease-in-out infinite" }}>
                <path d={makeRoundedStarPath(160, 290, 26, 0)} fill="#fff8d0" filter="url(#sgSoft)" />
              </g>
            )}
          </g>

          {/* Inner bottom glow */}
          <ellipse cx="160" cy="440" rx="105" ry="32"
            fill="url(#innerGlow)" opacity={glow.inner.opacity}
            style={{ transition: "opacity 0.8s ease" }}
          />

          {/* ── Fat round glass jar body ── */}
          <path
            d="
              M 140 102
              C 137 92, 130 87, 122 87
              L 82 87
              C 67 87, 62 95, 62 105
              L 62 118
              C 40 155, 36 200, 36 275
              C 36 355, 54 415, 92 442
              C 118 458, 142 464, 160 464
              C 178 464, 202 458, 228 442
              C 266 415, 284 355, 284 275
              C 284 200, 280 155, 258 118
              L 258 105
              C 258 95, 253 87, 238 87
              L 198 87
              C 190 87, 183 92, 180 102
            "
            fill="url(#glass)"
            stroke="var(--jar-stroke)"
            strokeWidth="1.5"
          />

          {/* Glass left highlight */}
          <path
            d="M 55 125 C 46 175, 46 240, 50 310 L 66 305 C 59 240, 59 180, 67 135 Z"
            fill="url(#hlL)"
          />

          {/* Glass right edge light */}
          <path
            d="M 265 125 C 274 175, 274 240, 270 310 L 254 305 C 261 240, 261 180, 253 135 Z"
            fill="url(#hlR)"
          />

          {/* Neck ring */}
          <ellipse cx="160" cy="87" rx="58" ry="7" fill="none" stroke="var(--jar-stroke-neck)" strokeWidth="1" />

          {/* Sparkle particles */}
          {Array.from({ length: 16 }, (_, i) => {
            const sx = 38 + ((i * 71 + 37) % 244);
            const sy = 100 + ((i * 63 + 29) % 360);
            return (
              <circle key={i} cx={sx} cy={sy} r={1 + (i % 5) * 0.5}
                fill="#fff8d0" opacity="0"
                style={{ animation: `sparkleParticle ${2.5 + i * 0.4}s ease-in-out ${i * 0.32}s infinite` }}
              />
            );
          })}
        </svg>
      </div>

      {/* ── Bottom input bar ── */}
      <div className="w-full max-w-[320px] flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder={total >= 30 ? "星星已满，继续添加将替换最早的一颗" : "今天有什么开心的事？"}
            className="w-full rounded-2xl bg-card/80 backdrop-blur px-4 py-3 text-sm font-bold text-primary outline-none ring-1 ring-subtle focus:ring-2 focus:ring-amber-400/40 placeholder:text-faint/60 transition-all duration-300"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="grid h-11 w-11 place-items-center rounded-2xl transition-all duration-200 active:scale-90 disabled:opacity-30 shrink-0 shadow-lg shadow-amber-500/10"
          style={{ background: "var(--star-bright)", color: "#1c1c1e" }}
        >
          <Send size={18} />
        </button>
      </div>

      {/* ── Clear button ── */}
      <button
        onClick={async () => {
          if (!confirm("清空所有星星？此操作不可撤销。")) return;
          await onReset();
        }}
        disabled={total === 0}
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-muted/50 hover:text-red-400/80 transition-colors duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <Trash2 size={13} /> 清空全部星星
      </button>
    </div>
  );
}

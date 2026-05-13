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
  left: 45, right: 275, bottom: 440, floor: 470, neck: 80,
  gravity: 0.5, bounce: 0.3, friction: 0.85
};

// Star positions — irregular distribution throughout jar volume
function computeStarLayout(entries: MoodEntry[]): Map<string, PhysicsStar> {
  const result = new Map<string, PhysicsStar>();
  const placed: PhysicsStar[] = [];
  const withPos = entries.filter(hasPosition);
  const sorted = [...withPos].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i].position!;
    const phi = (1 + Math.sqrt(5)) / 2;
    const frac = sorted.length > 1 ? ((i * phi) % 1) : 0.55;
    const bandH = JAR_BOUNDS.floor - JAR_BOUNDS.neck - 100;
    const baseY = JAR_BOUNDS.neck + 40 + bandH * (0.05 + frac * 0.88);
    const jitterY = Math.sin(i * 3.1 + 0.9) * (bandH * 0.14);
    const jitterX = Math.cos(i * 2.4 + 1.2) * 18;
    const x = Math.min(JAR_BOUNDS.right - p.r - 10, Math.max(JAR_BOUNDS.left + p.r + 10, p.x + jitterX));
    const y = Math.min(JAR_BOUNDS.floor - p.r - 4, Math.max(JAR_BOUNDS.neck + 20, baseY + jitterY));

    result.set(sorted[i].id, { x, y, r: p.r, rot: p.rot });
    placed.push({ x, y, r: p.r, rot: p.rot });
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
  const entriesWithPos = useMemo(() => entries.filter(hasPosition), [entries]);
  const visibleStars = entriesWithPos.length;
  const total = entries.length;
  const glow = useMemo(() => computeGalaxyGlow(visibleStars), [visibleStars]);
  const starPositions = useMemo(() => computeStarLayout(entries), [entries]);

  // Jar outer glow radius scales with visible star count (0 → 40px blur)
  const jarGlowBlur = Math.min(40, 4 + visibleStars * 1.4);
  const jarGlowOpacity = Math.min(0.55, 0.05 + visibleStars * 0.02);

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

            {/* Inner bottom glow */}
            <radialGradient id="innerGlow" cx="50%" cy="92%" r="38%">
              <stop offset="0%" stopColor="#fff4c0" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#e8a050" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#c07030" stopOpacity="0" />
            </radialGradient>

            {/* Glass fill */}
            <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.01)" />
              <stop offset="65%" stopColor="rgba(255,248,235,0.03)" />
              <stop offset="100%" stopColor="rgba(255,235,210,0.08)" />
            </linearGradient>

            {/* Jar interior clip — round bottle */}
            <clipPath id="jarInterior">
              <path d="
                M 130 72
                C 128 110, 128 130, 126 148
                C 90 172, 50 225, 40 290
                C 30 355, 50 420, 80 455
                C 110 475, 140 478, 160 478
                C 180 478, 210 475, 240 455
                C 270 420, 290 355, 280 290
                C 270 225, 230 172, 194 148
                C 192 130, 192 110, 190 72
                C 188 60, 178 54, 160 54
                C 142 54, 132 60, 130 72
                Z
              " />
            </clipPath>

            {/* Outer jar glow — behind body, scales with star count */}
            <radialGradient id="outerGlow" cx="50%" cy="58%" r="50%">
              <stop offset="0%" stopColor="rgba(251,191,36,0.15)" />
              <stop offset="50%" stopColor="rgba(251,191,36,0.05)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0)" />
            </radialGradient>
          </defs>

          {/* Outer glow ring around entire jar */}
          <ellipse cx="160" cy="290" rx={130 + visibleStars * 2} ry={190 + visibleStars * 3}
            fill="url(#outerGlow)"
            opacity={Math.min(0.7, 0.08 + visibleStars * 0.025)}
            style={{ transition: "opacity 0.8s ease" }}
          />

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

            {/* Inner bottom glow — clipped to jar interior */}
            <ellipse cx="160" cy="460" rx="80" ry="22"
              fill="url(#innerGlow)" opacity={glow.inner.opacity}
              style={{ transition: "opacity 0.8s ease" }}
            />
          </g>

          {/* ── Round glass bottle body ── */}
          <path
            d="
              M 130 72
              C 128 110, 128 130, 126 148
              C 90 172, 50 225, 40 290
              C 30 355, 50 420, 80 455
              C 110 475, 140 478, 160 478
              C 180 478, 210 475, 240 455
              C 270 420, 290 355, 280 290
              C 270 225, 230 172, 194 148
              C 192 130, 192 110, 190 72
              C 188 60, 178 54, 160 54
              C 142 54, 132 60, 130 72
              Z
            "
            fill="url(#glass)"
            stroke="var(--jar-stroke)"
            strokeWidth="1.5"
          />

          {/* ── Cork stopper ── */}
          <path
            d="
              M 132 72
              L 132 55
              C 130 40, 128 28, 123 16
              C 120 6, 128 2, 140 1
              C 152 0, 168 0, 180 1
              C 192 2, 200 6, 197 16
              C 192 28, 190 40, 188 55
              L 188 72
              C 186 75, 178 77, 160 77
              C 142 77, 134 75, 132 72
              Z
            "
            fill="#c4956b"
            stroke="#a0724a"
            strokeWidth="0.8"
          />
          {/* Cork wood grain lines */}
          <path d="M 142 68 C 150 66, 170 66, 178 68" fill="none" stroke="#a0724a" strokeWidth="0.5" opacity="0.6" />
          <path d="M 138 58 C 148 56, 172 56, 182 58" fill="none" stroke="#a0724a" strokeWidth="0.5" opacity="0.5" />
          <path d="M 136 48 C 146 46, 174 46, 184 48" fill="none" stroke="#a0724a" strokeWidth="0.5" opacity="0.6" />
          <path d="M 134 38 C 144 36, 176 36, 186 38" fill="none" stroke="#a0724a" strokeWidth="0.5" opacity="0.5" />
          <path d="M 132 28 C 144 26, 176 26, 188 28" fill="none" stroke="#a0724a" strokeWidth="0.5" opacity="0.6" />
          <path d="M 130 18 C 140 16, 180 16, 190 18" fill="none" stroke="#a0724a" strokeWidth="0.5" opacity="0.5" />

          {/* Sparkle particles */}
          {Array.from({ length: 16 }, (_, i) => {
            const sx = 48 + ((i * 71 + 37) % 224);
            const sy = 155 + ((i * 63 + 29) % 310);
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
            placeholder="今天有什么开心的事？"
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

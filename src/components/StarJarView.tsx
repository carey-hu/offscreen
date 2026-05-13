import { format } from "date-fns";
import { Send, Trash2, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MoodEntry, StarPosition } from "../types";
import { makeRoundedStarPath } from "../lib/starPath";
import { computeGalaxyGlow } from "../lib/galaxyGlow";
import { useJarPhysics } from "../hooks/useJarPhysics";
import { CYLINDER } from "../lib/physics";

interface Props {
  entries: MoodEntry[];
  todayCount: number;
  streak: number;
  onViewCalendar: () => void;
  onAddOne: (content: string) => Promise<void>;
  onReset: () => Promise<void>;
  onClearJar: () => Promise<void>;
}

function hasPosition(e: MoodEntry): e is MoodEntry & { position: StarPosition } {
  return e.position !== undefined;
}

function starColor(i: number, n: number): string {
  const t = n > 0 ? i / n : 0;
  const r = 255;
  const g = Math.round(235 - t * 55);
  const b = Math.round(175 - t * 115);
  return `rgb(${r},${g},${b})`;
}

// ── Pour-out scatter animation ──
interface PourStar {
  id: string;
  fromX: number;
  fromY: number;
  r: number;
  color: string;
  rot: number;
  tx: number;
  ty: number;
  delay: number;
  duration: number;
}

export function StarJarView({ entries, todayCount, streak, onViewCalendar, onAddOne, onReset, onClearJar }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isPouring, setIsPouring] = useState(false);
  const [pourStars, setPourStars] = useState<PourStar[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const jarRef = useRef<HTMLDivElement>(null);
  const pourTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pourOrigin, setPourOrigin] = useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 });

  // Cleanup pour timeout on unmount
  useEffect(() => {
    return () => {
      if (pourTimeoutRef.current) clearTimeout(pourTimeoutRef.current);
    };
  }, []);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const entriesWithPos = useMemo(() => entries.filter(hasPosition), [entries]);
  const visibleStars = entriesWithPos.length;
  const total = entries.length;
  const glow = useMemo(() => computeGalaxyGlow(visibleStars), [visibleStars]);

  // Real-time physics
  const { positions: livePositions } = useJarPhysics({
    entries,
    enabled: visibleStars > 0 && !isPouring,
  });

  // Jar outer glow scales with star count
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

  function handlePour() {
    if (isPouring || visibleStars === 0) return;

    const jarEl = jarRef.current;
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight / 2 - 40;
    let svgScale = 1;
    if (jarEl) {
      const rect = jarEl.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      svgScale = rect.width / 320;
    }
    setPourOrigin({ x: originX, y: originY, scale: svgScale });

    const stars: PourStar[] = [];

    for (let i = 0; i < entriesWithPos.length; i++) {
      const entry = entriesWithPos[i];
      const pos = entry.position!;

      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 500;
      stars.push({
        id: entry.id,
        fromX: (pos.x - 160) * svgScale,
        fromY: (pos.y - 245) * svgScale,
        r: pos.r * svgScale,
        color: starColor(i, entriesWithPos.length),
        rot: pos.rot,
        tx: Math.cos(angle) * dist + (Math.random() - 0.5) * 300,
        ty: Math.sin(angle) * dist - 200 + (Math.random() - 0.5) * 400,
        delay: i * 0.04,
        duration: 1.8 + Math.random() * 1.4,
      });
    }

    setPourStars(stars);
    setIsPouring(true);

    // After animation, clear jar positions (keeps entries & counts)
    pourTimeoutRef.current = setTimeout(async () => {
      await onClearJar();
      setPourStars([]);
      setIsPouring(false);
    }, 3500);
  }

  // Cylinder SVG — 4:3 h:w ratio
  const { left, right, top, bottom, floor, cornerR } = CYLINDER;
  const cylinderPath = `
    M ${left} ${top}
    L ${left} ${bottom}
    C ${left} ${bottom + cornerR}, ${left + cornerR * 0.7} ${floor}, ${left + cornerR} ${floor}
    L ${right - cornerR} ${floor}
    C ${right - cornerR * 0.7} ${floor}, ${right} ${bottom + cornerR}, ${right} ${bottom}
    L ${right} ${top}
  `;
  const cylinderClipPath = cylinderPath + " Z";

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

      {/* ── Cylinder glass jar ── */}
      <div
        ref={jarRef}
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
            {/* Star glow filters */}
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
            <radialGradient id="innerGlow" cx="50%" cy="95%" r="35%">
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

            {/* Jar interior clip — cylinder */}
            <clipPath id="jarInterior">
              <path d={cylinderClipPath} />
            </clipPath>

            {/* Outer jar glow */}
            <radialGradient id="outerGlow" cx="50%" cy="55%" r="50%">
              <stop offset="0%" stopColor="rgba(251,191,36,0.15)" />
              <stop offset="50%" stopColor="rgba(251,191,36,0.05)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0)" />
            </radialGradient>
          </defs>

          {/* Outer glow ring behind jar */}
          <ellipse cx="160" cy="240" rx={140 + visibleStars * 2} ry={190 + visibleStars * 3}
            fill="url(#outerGlow)"
            opacity={Math.min(0.7, 0.08 + visibleStars * 0.025)}
            style={{ transition: "opacity 0.8s ease" }}
          />

          {/* Stars clipped to jar interior */}
          <g clipPath="url(#jarInterior)">
            {entriesWithPos.map((entry, idx) => {
              const livePos = livePositions.get(entry.id) ?? (entry.position ? { x: entry.position.x, y: entry.position.y, r: entry.position.r, rot: entry.position.rot, vx: 0, vy: 0 } : null);
              if (!livePos) return null;
              const isToday = entry.date === todayStr;
              const color = starColor(idx, entriesWithPos.length);
              const path = makeRoundedStarPath(livePos.x, livePos.y, livePos.r, livePos.rot);
              return (
                <g key={entry.id} filter={isToday ? "url(#sgStrong)" : "url(#sgSoft)"}>
                  <path
                    d={path}
                    fill={color}
                    stroke="var(--jar-stroke)"
                    strokeWidth="1.2"
                    opacity={isToday ? 1 : 0.7 + (idx % 3) * 0.1}
                    style={{ transition: "opacity 0.3s ease" }}
                  />
                </g>
              );
            })}

            {/* Empty state */}
            {visibleStars === 0 && (
              <g opacity="0.15" style={{ animation: "galaxyBreathing 3.5s ease-in-out infinite" }}>
                <path d={makeRoundedStarPath(160, 220, 26, 0)} fill="#fff8d0" filter="url(#sgSoft)" />
              </g>
            )}

            {/* Inner bottom glow */}
            <ellipse cx="160" cy={floor} rx="100" ry="14"
              fill="url(#innerGlow)" opacity={glow.inner.opacity}
              style={{ transition: "opacity 0.8s ease" }}
            />
          </g>

          {/* ── Cylinder glass body ── */}
          <path
            d={cylinderClipPath}
            fill="url(#glass)"
            stroke="var(--jar-stroke)"
            strokeWidth="1.5"
          />

          {/* ── Top rim (front arc only, no back line across opening) ── */}
          <path
            d={`M ${left} ${top} A ${(right - left) / 2} 8 0 0 0 ${right} ${top}`}
            fill="none"
            stroke="var(--jar-stroke)"
            strokeWidth="1.5"
          />

          {/* Sparkle particles */}
          {Array.from({ length: 16 }, (_, i) => {
            const sx = left + 15 + ((i * 71 + 37) % (right - left - 30));
            const sy = top + 30 + ((i * 63 + 29) % (floor - top - 40));
            return (
              <circle key={i} cx={sx} cy={sy} r={1 + (i % 5) * 0.5}
                fill="#fff8d0" opacity="0"
                style={{ animation: `sparkleParticle ${2.5 + i * 0.4}s ease-in-out ${i * 0.32}s infinite` }}
              />
            );
          })}
        </svg>

        {/* ── Pour button (visible at 30 stars) ── */}
        {visibleStars >= 30 && !isPouring && (
          <button
            onClick={(e) => { e.stopPropagation(); handlePour(); }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-black
              bg-amber-500/90 text-white shadow-lg shadow-amber-500/30
              hover:bg-amber-400 active:scale-95 transition-all duration-200
              animate-bounce"
            style={{ zIndex: 10 }}
          >
            <Zap size={16} /> 倾倒星星
          </button>
        )}
      </div>

      {/* ── Pour-out scatter overlay ── */}
      {isPouring && pourStars.length > 0 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 100 }}
        >
          {pourStars.map((ps) => (
            <div
              key={ps.id}
              className="absolute"
              style={{
                left: `${pourOrigin.x + ps.fromX}px`,
                top: `${pourOrigin.y + ps.fromY}px`,
                width: 0,
                height: 0,
                animation: `pourOut ${ps.duration}s cubic-bezier(0.25,0.1,0.25,1) ${ps.delay}s forwards`,
                "--tx": `${ps.tx}px`,
                "--ty": `${ps.ty}px`,
              } as React.CSSProperties}
            >
              <svg
                width={ps.r * 2}
                height={ps.r * 2}
                viewBox={`0 0 ${ps.r * 2} ${ps.r * 2}`}
                style={{
                  transform: "translate(-50%, -50%)",
                  animation: `pourFlash 0.35s ease-in-out ${ps.delay}s infinite`,
                }}
              >
                <defs>
                  <filter id={`ps-${ps.id}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d={makeRoundedStarPath(ps.r, ps.r, ps.r, ps.rot)}
                  fill={ps.color}
                  filter={`url(#ps-${ps.id})`}
                  opacity="0.9"
                />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom input bar (hidden during pour) ── */}
      {!isPouring && (
        <>
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
        </>
      )}
    </div>
  );
}

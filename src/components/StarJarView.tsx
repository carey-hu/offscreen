import { ArrowUp, Sparkles, Trash2 } from "lucide-react";
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

const MAX_BRIGHT_CHARS = 15;

// Character count → 0-1 brightness (codepoint-aware so emojis count as one)
function brightnessOf(content: string): number {
  const len = [...content].length;
  return Math.min(len / MAX_BRIGHT_CHARS, 1);
}

// Brightness-driven star fill — muted amber at low end, bright cream at full
function starFill(brightness: number): string {
  const t = brightness;
  const r = Math.round(178 + t * 77);
  const g = Math.round(120 + t * 130);
  const b = Math.round(50 + t * 165);
  return `rgb(${r},${g},${b})`;
}

function pickFilter(brightness: number): string {
  if (brightness < 0.34) return "sgDim";
  if (brightness < 0.67) return "sgMid";
  return "sgBright";
}

interface PourStar {
  id: string;
  fromX: number;
  fromY: number;
  r: number;
  color: string;
  rot: number;
  tx: number;       // horizontal end offset (px)
  peak: number;     // initial upward leap (px, negative)
  spin: number;     // total rotation during fall (deg)
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

  useEffect(() => {
    return () => {
      if (pourTimeoutRef.current) clearTimeout(pourTimeoutRef.current);
    };
  }, []);

  const entriesWithPos = useMemo(() => entries.filter(hasPosition), [entries]);
  const visibleStars = entriesWithPos.length;
  const total = entries.length;
  const glow = useMemo(() => computeGalaxyGlow(visibleStars), [visibleStars]);

  const { positions: livePositions } = useJarPhysics({
    entries,
    enabled: visibleStars > 0 && !isPouring,
  });

  // Outer haze intensity, gated lower for Apple subtlety
  const hazeOpacity = Math.min(0.55, 0.10 + visibleStars * 0.018);
  const hazeScale = 1 + Math.min(0.25, visibleStars * 0.008);

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
      // Horizontal scatter (small fan), screen px
      const tx = (Math.random() - 0.5) * 320;
      // Small upward leap before gravity takes over
      const peak = -(28 + Math.random() * 40);
      // 1.5–3 full rotations, random direction
      const spin = (Math.random() < 0.5 ? -1 : 1) * (540 + Math.random() * 540);
      const duration = 1.6 + Math.random() * 0.7;
      const delay = i * 0.05 + Math.random() * 0.1;
      stars.push({
        id: entry.id,
        fromX: (pos.x - 160) * svgScale,
        fromY: (pos.y - 245) * svgScale,
        r: pos.r * svgScale,
        color: starFill(brightnessOf(entry.content)),
        rot: pos.rot,
        tx,
        peak,
        spin,
        delay,
        duration,
      });
    }

    setPourStars(stars);
    setIsPouring(true);
    pourTimeoutRef.current = setTimeout(async () => {
      await onClearJar();
      setPourStars([]);
      setIsPouring(false);
    }, 4500);
  }

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
      {/* ── Stats card ── */}
      <div className="sj-card w-full max-w-[320px] rounded-2xl mb-6 px-4 py-3.5 grid grid-cols-3 relative">
        <Stat label="今日" value={todayCount} unit="颗" tone="bright" />
        <div className="absolute left-1/3 top-3 bottom-3 w-px sj-divider" />
        <Stat label="连续" value={streak} unit="天" tone="glow" />
        <div className="absolute left-2/3 top-3 bottom-3 w-px sj-divider" />
        <Stat label="累计" value={total} unit="颗" tone="muted" />
      </div>

      {/* ── Cylinder glass jar ── */}
      <div
        ref={jarRef}
        className="relative mb-6 select-none cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
        style={{ width: 320, height: 420 }}
        onClick={onViewCalendar}
      >
        <svg
          viewBox="0 0 320 490"
          className="w-full h-full"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Star glow filters — 3 levels driven by entry char count */}
            <filter id="sgDim" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="sgMid" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="sgBright" x="-65%" y="-65%" width="230%" height="230%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glass body — vertical gradient, very subtle */}
            <linearGradient id="glassBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--jar-glass-top)" />
              <stop offset="50%" stopColor="var(--jar-glass-top)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--jar-glass-bot)" />
            </linearGradient>

            {/* Inner shadow — top rim depth, fades within first third */}
            <linearGradient id="rimShadow" x1="0" y1="50" x2="0" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--jar-inner-shadow)" stopOpacity="0.9" />
              <stop offset="40%" stopColor="var(--jar-inner-shadow)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--jar-inner-shadow)" stopOpacity="0" />
            </linearGradient>

            {/* Left highlight — vertical glass shine */}
            <linearGradient id="glassHl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.16)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Inner bottom glow */}
            <radialGradient id="innerGlow" cx="50%" cy="95%" r="38%">
              <stop offset="0%" stopColor="var(--star-particle)" stopOpacity="0.45" />
              <stop offset="55%" stopColor="var(--star-bright)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--star-bright)" stopOpacity="0" />
            </radialGradient>

            {/* Outer haze — warm cream around jar */}
            <radialGradient id="outerHaze" cx="50%" cy="55%" r="50%">
              <stop offset="0%" stopColor="var(--jar-haze-strong)" />
              <stop offset="55%" stopColor="var(--jar-haze-soft)" />
              <stop offset="100%" stopColor="rgba(245,158,11,0)" />
            </radialGradient>

            <clipPath id="jarInterior">
              <path d={cylinderClipPath} />
            </clipPath>
          </defs>

          {/* Outer haze halo */}
          <ellipse
            cx="160"
            cy="240"
            rx={160 * hazeScale}
            ry={210 * hazeScale}
            fill="url(#outerHaze)"
            opacity={hazeOpacity}
            style={{ transition: "opacity 0.8s ease, transform 0.8s ease" }}
          />

          {/* Stars clipped to jar interior */}
          <g clipPath="url(#jarInterior)">
            {/* Inner bottom glow */}
            <ellipse
              cx="160"
              cy={floor}
              rx="110"
              ry="16"
              fill="url(#innerGlow)"
              opacity={glow.inner.opacity}
              style={{ transition: "opacity 0.8s ease" }}
            />

            {!isPouring && entriesWithPos.map((entry) => {
              const livePos = livePositions.get(entry.id) ?? (entry.position ? { x: entry.position.x, y: entry.position.y, r: entry.position.r, rot: entry.position.rot, vx: 0, vy: 0 } : null);
              if (!livePos) return null;
              const brightness = brightnessOf(entry.content);
              const color = starFill(brightness);
              const filterId = pickFilter(brightness);
              const opacity = 0.45 + brightness * 0.55;
              const path = makeRoundedStarPath(livePos.x, livePos.y, livePos.r, livePos.rot);
              return (
                <g key={entry.id} filter={`url(#${filterId})`}>
                  <path
                    d={path}
                    fill={color}
                    opacity={opacity}
                    style={{ transition: "opacity 0.3s ease, fill 0.3s ease" }}
                  />
                </g>
              );
            })}

            {/* Empty state — single dim star */}
            {visibleStars === 0 && (
              <g opacity="0.12" style={{ animation: "galaxyBreathing 4s ease-in-out infinite" }}>
                <path d={makeRoundedStarPath(160, 230, 24, 0)} fill="var(--star-fill-mid)" filter="url(#sgMid)" />
              </g>
            )}

            {/* Sparkle particles — fewer and softer */}
            {Array.from({ length: 8 }, (_, i) => {
              const sx = left + 24 + ((i * 71 + 37) % (right - left - 48));
              const sy = top + 40 + ((i * 63 + 29) % (floor - top - 60));
              return (
                <circle
                  key={i}
                  cx={sx}
                  cy={sy}
                  r={0.8 + (i % 4) * 0.4}
                  fill="var(--sparkle-fill)"
                  opacity="0"
                  style={{ animation: `sparkleParticle ${3 + i * 0.5}s ease-in-out ${i * 0.5}s infinite` }}
                />
              );
            })}
          </g>

          {/* Glass body fill */}
          <path d={cylinderClipPath} fill="url(#glassBody)" />

          {/* Inner top-rim shadow (depth) */}
          <path d={cylinderClipPath} fill="url(#rimShadow)" opacity="0.65" clipPath="url(#jarInterior)" />

          {/* Vertical highlight band — left */}
          <rect x={left + 8} y={top + 12} width="3" height={floor - top - 30} fill="url(#glassHl)" opacity="0.7" rx="1.5" />

          {/* Glass body stroke */}
          <path
            d={cylinderPath}
            fill="none"
            stroke="var(--jar-stroke)"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />

          {/* Top rim ellipse */}
          <ellipse
            cx="160"
            cy={top}
            rx={(right - left) / 2}
            ry="7"
            fill="var(--jar-rim-fill)"
            stroke="var(--jar-stroke)"
            strokeWidth="1.25"
          />
          {/* Inner rim hairline */}
          <ellipse
            cx="160"
            cy={top + 1.5}
            rx={(right - left) / 2 - 4}
            ry="4.5"
            fill="none"
            stroke="var(--jar-stroke-soft)"
            strokeWidth="0.8"
          />
        </svg>

        {/* ── Pour button (visible at 30 stars) ── */}
        {visibleStars >= 30 && !isPouring && (
          <button
            onClick={(e) => { e.stopPropagation(); handlePour(); }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-lg active:scale-95 transition-all duration-200"
            style={{
              background: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
              boxShadow: "0 4px 14px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
              zIndex: 10,
            }}
          >
            <Sparkles size={14} /> 倾倒星星
          </button>
        )}
      </div>

      {/* ── Pour-out scatter overlay ── */}
      {isPouring && pourStars.length > 0 && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
          {pourStars.map((ps) => (
            <div
              key={ps.id}
              className="absolute"
              style={{
                left: `${pourOrigin.x + ps.fromX}px`,
                top: `${pourOrigin.y + ps.fromY}px`,
                width: 0,
                height: 0,
                animation: `pourFall ${ps.duration}s linear ${ps.delay}s forwards`,
                filter: `drop-shadow(0 0 6px rgba(245,200,90,0.55))`,
                "--tx": `${ps.tx}px`,
                "--peak": `${ps.peak}px`,
                "--spin": `${ps.spin}deg`,
              } as React.CSSProperties}
            >
              <svg
                width={ps.r * 2}
                height={ps.r * 2}
                viewBox={`0 0 ${ps.r * 2} ${ps.r * 2}`}
                style={{ transform: "translate(-50%, -50%)" }}
              >
                <path
                  d={makeRoundedStarPath(ps.r, ps.r, ps.r, ps.rot)}
                  fill={ps.color}
                />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* ── Input bar + clear ── */}
      {!isPouring && (
        <>
          <div className="w-full max-w-[340px] flex items-center gap-2 mb-3">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="今天有什么开心的事？"
              className="sj-input flex-1 rounded-full px-5 py-3 text-[14px] font-medium text-primary outline-none placeholder:text-faint/70"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              aria-label="添加心情"
              className="grid h-11 w-11 place-items-center rounded-full transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              style={{
                background: text.trim()
                  ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)"
                  : "var(--bg-surface)",
                color: text.trim() ? "#1c1c1e" : "var(--text-muted)",
                boxShadow: text.trim()
                  ? "0 4px 12px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.3)"
                  : "none",
              }}
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={async () => {
              if (!confirm("清空所有星星？此操作不可撤销。")) return;
              await onReset();
            }}
            disabled={total === 0}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium text-faint hover:text-red-500/80 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={11} /> 清空全部
          </button>
        </>
      )}
    </div>
  );
}

// ── Sub-components ──

interface StatProps {
  label: string;
  value: number;
  unit: string;
  tone: "bright" | "glow" | "muted";
}

function Stat({ label, value, unit, tone }: StatProps) {
  const color =
    tone === "bright" ? "var(--star-bright)"
    : tone === "glow" ? "var(--star-glow)"
    : "var(--text-primary)";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-semibold tracking-wider text-muted">{label}</span>
      <span className="text-xl font-bold tabular-nums leading-tight" style={{ color }}>
        {value}
        <span className="text-[11px] font-semibold text-muted ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

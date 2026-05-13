import { format } from "date-fns";
import { CalendarDays, RefreshCw, Sparkles, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { MoodEntry, StarPosition } from "../types";
import { settleNewStar, getDropX, getRandomR, JarBounds, PhysicsStar } from "../lib/physics";
import { makeStarPath } from "../lib/starPath";
import { computeGalaxyGlow } from "../lib/galaxyGlow";

interface Props {
  entries: MoodEntry[];
  todayCount: number;
  streak: number;
  onViewCalendar: () => void;
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

function brightnessForCount(count: number, isToday: boolean) {
  if (count === 0) return { fill: "#fff6c8", filter: "none", op: isToday ? 0.2 : 0 };
  if (count <= 2) return { fill: "#ffe88c", filter: "drop-shadow(0 0 3px rgba(255,200,80,0.4))", op: 0.55 };
  if (count <= 5) return { fill: "#ffd43b", filter: "drop-shadow(0 0 6px rgba(255,180,40,0.55))", op: 0.78 };
  return { fill: "#ffc107", filter: "drop-shadow(0 0 10px rgba(255,160,20,0.7)) drop-shadow(0 0 20px rgba(255,200,80,0.3))", op: 1 };
}

// Computes physics positions for all entries — only runs when entries change
// Existing entries keep their stored position; new entries without position get physics
function computeAllPositions(
  entries: MoodEntry[],
  bounds: JarBounds
): Map<string, PhysicsStar> {
  const result = new Map<string, PhysicsStar>();
  const existing: PhysicsStar[] = [];

  // Sort by createdAt so older stars settle first (bottom of jar)
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const entry of sorted) {
    if (entry.position) {
      // Use stored position
      const p = entry.position;
      result.set(entry.id, { x: p.x, y: p.y, r: p.r, rot: p.rot });
      existing.push({ x: p.x, y: p.y, r: p.r, rot: p.rot });
    } else {
      // Compute new position via physics
      const r = getRandomR();
      const dropX = getDropX(bounds);
      const pos = settleNewStar({ x: dropX, r }, existing, bounds);
      result.set(entry.id, pos);
      existing.push(pos);
    }
  }

  return result;
}

export function StarJarView({ entries, todayCount, streak, onViewCalendar, onAddMany, onReset }: Props) {
  const [resetting, setResetting] = useState(false);
  const [filling, setFilling] = useState(false);
  const [newStarId, setNewStarId] = useState<string | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const countMap = useMemo(() => entryCountByDate(entries), [entries]);
  const glow = useMemo(() => computeGalaxyGlow(entries.length), [entries]);
  const starPositions = useMemo(() => computeAllPositions(entries, {
    left: 62, right: 218, bottom: 310, floor: 312, neck: 115,
    gravity: 0.42, bounce: 0.28, friction: 0.78
  }), [entries]);

  // Track the newest entry for drop animation
  const newestEntryId = useMemo(() => {
    if (entries.length === 0) return null;
    return entries.reduce((a, b) =>
      a.createdAt > b.createdAt ? a : b
    ).id;
  }, [entries]);

  async function handleFill() {
    setFilling(true);
    const items = Array.from({ length: 30 }, (_, i) => ({
      content: [
        "阳光洒在书桌上",
        "喝到了特别好喝的咖啡",
        "完成了今天的运动目标",
        "朋友发来暖心的消息",
        "看到路边的小花开了",
        "学会了新的小技巧",
        "吃到了一顿美味的饭",
        "傍晚的天空特别美",
        "听到一首很喜欢的歌",
        "收到意料之外的惊喜",
        "工作效率很高的一天",
        "帮助了需要帮助的人",
        "发现一本好看的书",
        "和好久不见的朋友聊天",
        "做了一个好梦",
        "天气特别好适合散步",
        "做出了满意的作品",
        "小猫主动来蹭我",
        "解锁了一项新成就",
        "心情莫名地很平静"
      ][i % 20]
    }));
    await onAddMany(items);
    setNewStarId(null);
    setFilling(false);
  }

  async function handleReset() {
    if (!confirm("清空所有星星？这将删除全部心情记录。")) return;
    setResetting(true);
    await onReset();
    setResetting(false);
  }

  const dates = useMemo(() => Array.from(countMap.keys()), [countMap]);

  // Last added star gets drop animation
  const dropAnimatedId = newStarId ?? newestEntryId;

  return (
    <div className="flex flex-col items-center">
      {/* Galaxy level label */}
      <div className="mb-2">
        <span
          className="text-[11px] font-black uppercase tracking-[0.3em]"
          style={{ color: "var(--star-glow)" }}
        >
          {glow.level}
        </span>
      </div>

      {/* Streak banner */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles size={18} className="text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">
            连续亮星
          </span>
        </div>
        <div className="flex items-baseline justify-center gap-1">
          <span
            className="text-5xl sm:text-6xl font-black tabular-nums"
            style={{ color: "var(--star-glow)" }}
          >
            {streak}
          </span>
          <span className="text-lg font-black text-muted">天</span>
        </div>
        {streak === 0 && (
          <p className="mt-1 text-[10px] font-bold text-faint">
            写下第一条好心情，开始积累你的星星吧
          </p>
        )}
        {streak >= 7 && streak < 30 && (
          <p className="mt-1 text-[10px] font-bold text-amber-400">
            🔥 已经坚持一周了，太棒了
          </p>
        )}
        {streak >= 30 && (
          <p className="mt-1 text-[10px] font-bold text-amber-400">
            👑 连续一个月亮星，你是星光守护者
          </p>
        )}
      </div>

      {/* SVG Jar */}
      <div
        className="relative cursor-pointer group mb-6 select-none"
        onClick={onViewCalendar}
        style={{ width: 280, height: 380 }}
      >
        <svg
          viewBox="0 0 280 390"
          className="w-full h-full"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Galaxy glow gradients */}
            <radialGradient id="galaxyCore">
              <stop offset="0%" stopColor="#fff6c8" stopOpacity="1" />
              <stop offset="40%" stopColor="#ffd87a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="galaxyMid">
              <stop offset="0%" stopColor="#fff2b8" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#e89a3c" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7a4a8c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="galaxyOuter">
              <stop offset="0%" stopColor="#a68fd0" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#6a5aa8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3a3160" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="galaxyHalo">
              <stop offset="0%" stopColor="#8aa8e0" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#4a5a8a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="jarInnerGlow">
              <stop offset="0%" stopColor="#fff6c8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#e89a3c" stopOpacity="0" />
            </radialGradient>

            {/* Glass body gradient */}
            <linearGradient id="glassBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(251,191,36,0.15)" />
              <stop offset="30%" stopColor="rgba(251,191,36,0.04)" />
              <stop offset="70%" stopColor="rgba(251,191,36,0.02)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0.08)" />
            </linearGradient>

            {/* Glass highlight */}
            <linearGradient id="glassHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="15%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            <clipPath id="jarClip">
              <path d="M 90 105
                C 90 95, 80 88, 70 88
                L 45 88
                C 30 88, 28 98, 28 110
                L 28 118
                C 10 140, 10 160, 10 200
                C 10 260, 20 310, 60 340
                C 80 352, 100 358, 140 360
                C 180 358, 200 352, 220 340
                C 260 310, 270 260, 270 200
                C 270 160, 270 140, 252 118
                L 252 110
                C 252 98, 250 88, 235 88
                L 210 88
                C 200 88, 190 95, 190 105
                L 190 115
                C 190 125, 195 128, 200 128
                L 210 128
                L 210 195
                C 210 230, 185 260, 140 270
                C 95 260, 70 230, 70 195
                L 70 128
                L 80 128
                C 85 128, 90 125, 90 115 Z" />
            </clipPath>
          </defs>

          {/* Galaxy glow layers — behind the jar, centered */}
          <g style={{ animation: `galaxyBreathing ${4 + entries.length * 0.3}s ease-in-out infinite` }}>
            <ellipse
              cx="140" cy="250" rx={glow.halo.rx} ry={glow.halo.ry}
              fill="url(#galaxyHalo)" opacity={glow.halo.opacity}
            />
            <ellipse
              cx="140" cy="250" rx={glow.outer.rx} ry={glow.outer.ry}
              fill="url(#galaxyOuter)" opacity={glow.outer.opacity}
            />
            <ellipse
              cx="140" cy="250" rx={glow.mid.rx} ry={glow.mid.ry}
              fill="url(#galaxyMid)" opacity={glow.mid.opacity}
            />
            <ellipse
              cx="140" cy="250" rx={glow.core.rx} ry={glow.core.ry}
              fill="url(#galaxyCore)" opacity={glow.core.opacity}
            />
          </g>

          {/* Jar glass body */}
          <path
            d="M 90 105
              C 90 95, 80 88, 70 88
              L 45 88
              C 30 88, 28 98, 28 110
              L 28 118
              C 10 140, 10 160, 10 200
              C 10 260, 20 310, 60 340
              C 80 352, 100 358, 140 360
              C 180 358, 200 352, 220 340
              C 260 310, 270 260, 270 200
              C 270 160, 270 140, 252 118
              L 252 110
              C 252 98, 250 88, 235 88
              L 210 88
              C 200 88, 190 95, 190 105
              L 190 115
              C 190 125, 195 128, 200 128
              L 210 128
              L 210 195
              C 210 230, 185 260, 140 270
              C 95 260, 70 230, 70 195
              L 70 128
              L 80 128
              C 85 128, 90 125, 90 115 Z"
            fill="url(#glassBody)"
            stroke="rgba(251,191,36,0.2)"
            strokeWidth="1.5"
          />

          {/* Inner jar glow at bottom */}
          <ellipse
            cx="140" cy="330" rx="90" ry="50"
            fill="url(#jarInnerGlow)"
            opacity={glow.inner.opacity}
          />

          {/* Glass highlight reflection */}
          <path
            d="M 40 130 C 35 160, 35 200, 40 230 L 55 225 C 50 200, 50 150, 55 135 Z"
            fill="url(#glassHighlight)"
            opacity="0.5"
          />

          {/* Stars container — clipped to jar interior */}
          <g clipPath="url(#jarClip)">
            {/* Historical stars (non-today) */}
            {dates.map((d) => {
              if (d === todayStr) return null;
              const count = countMap.get(d) ?? 0;
              const b = brightnessForCount(count, false);
              if (b.op === 0) return null;

              // Find all entries for this date that have positions
              const dateEntries = entries.filter((e) => e.date === d && hasPosition(e));
              return dateEntries.map((entry) => {
                const pos = starPositions.get(entry.id);
                if (!pos) return null;
                const path = makeStarPath(pos.x, pos.y, pos.r, pos.rot);
                return (
                  <path
                    key={entry.id}
                    d={path}
                    fill={b.fill}
                    opacity={b.op}
                    style={{ filter: b.filter }}
                  />
                );
              });
            })}

            {/* Today's star entries */}
            {entries.filter((e) => e.date === todayStr && hasPosition(e)).map((entry) => {
              const pos = starPositions.get(entry.id);
              if (!pos) return null;
              const b = brightnessForCount(todayCount, true);
              const path = makeStarPath(pos.x, pos.y, pos.r, pos.rot);
              const isNew = entry.id === dropAnimatedId;
              return (
                <path
                  key={entry.id}
                  d={path}
                  fill={b.fill}
                  opacity={b.op}
                  style={{
                    filter: b.filter,
                    animation: isNew ? `starSettle 0.8s cubic-bezier(0.16,1,0.3,1) forwards` : undefined
                  }}
                />
              );
            })}

            {/* Today's placeholder star (if no entries yet) */}
            {todayCount === 0 && (
              <g opacity="0.2" style={{ animation: "galaxyBreathing 3s ease-in-out infinite" }}>
                <path
                  d={makeStarPath(140, 230, 10, 0)}
                  fill="#fff6c8"
                />
              </g>
            )}
          </g>

          {/* Sparkle particles */}
          {Array.from({ length: 12 }, (_, i) => {
            const sx = 40 + (i * 67 + 31) % 200;
            const sy = 120 + (i * 73 + 17) % 220;
            return (
              <circle
                key={i}
                cx={sx} cy={sy} r={1.5 + (i % 3)}
                fill="var(--star-particle)"
                opacity="0"
                style={{
                  animation: `sparkle ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={onViewCalendar}
          className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition active:scale-95"
          style={{
            background: "rgba(251,191,36,0.12)",
            color: "var(--star-bright)"
          }}
        >
          <CalendarDays size={16} />
          查看日历
        </button>

        <button
          onClick={handleFill}
          disabled={filling}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-40"
          style={{
            background: "rgba(251,191,36,0.08)",
            color: "var(--star-dim)"
          }}
        >
          <Zap size={14} />
          {filling ? "填充中..." : "快速填充30颗"}
        </button>

        <button
          onClick={handleReset}
          disabled={resetting || entries.length === 0}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-muted hover:text-red-400 transition disabled:opacity-30"
        >
          <RefreshCw size={14} />
          清空
        </button>
      </div>

      <p className="mt-4 text-[10px] font-bold text-faint">
        点击罐子查看日历 · 每颗星星都是你闪亮的一天
      </p>
    </div>
  );
}

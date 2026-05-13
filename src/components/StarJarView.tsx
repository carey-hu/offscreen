import { format } from "date-fns";
import { CalendarDays, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { MoodEntry } from "../types";

interface Props {
  entries: MoodEntry[];
  todayCount: number;
  streak: number;
  onViewCalendar: () => void;
}

const FLOAT_ANIMS = ["starFloat1", "starFloat2", "starFloat3", "starFloat4", "starFloat5"];

function hashDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getBrightness(count: number, isToday: boolean) {
  if (count === 0) return { opacity: isToday ? 0.15 : 0, glow: 0, scale: 0.5, hasPulse: false };
  if (count <= 2) return { opacity: isToday ? 0.35 : 0.2, glow: 0.1, scale: 0.7, hasPulse: false };
  if (count <= 5) return { opacity: isToday ? 0.65 : 0.4, glow: 0.25, scale: 0.85, hasPulse: false };
  return { opacity: isToday ? 1 : 0.55, glow: isToday ? 0.6 : 0.3, scale: 1, hasPulse: isToday };
}

function starEmoji(count: number): string {
  if (count === 0) return "";
  if (count <= 2) return "⭐";
  if (count <= 5) return "🌟";
  return "💫";
}

export function StarJarView({ entries, todayCount, streak, onViewCalendar }: Props) {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Unique dates with entries
  const dateCounts = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => m.set(e.date, (m.get(e.date) ?? 0) + 1));
    return m;
  }, [entries]);

  const dates = useMemo(() => Array.from(dateCounts.keys()), [dateCounts]);
  const b = getBrightness(todayCount, true);

  // Sparkle positions (deterministic random)
  const sparkles = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const seed = (i * 137 + 53) % 100;
      return {
        top: `${10 + (seed * 7) % 78}%`,
        left: `${8 + (seed * 11) % 80}%`,
        delay: `${(i * 0.3) % 3}s`,
        size: 4 + (seed % 6)
      };
    });
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Streak banner */}
      <div className="mb-8 sm:mb-10 text-center">
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
        {streak >= 7 && (
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

      {/* Jar container */}
      <div
        className="relative flex flex-col items-center cursor-pointer group mb-6"
        onClick={onViewCalendar}
      >
        {/* Jar rim */}
        <div
          className="w-28 h-3 rounded-full z-10 relative"
          style={{
            background: "linear-gradient(180deg, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0.15) 100%)",
            boxShadow: "0 2px 8px rgba(251,191,36,0.2)"
          }}
        />

        {/* Jar neck */}
        <div
          className="w-14 h-12 -mt-1 relative z-10"
          style={{
            background: "linear-gradient(180deg, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 100%)",
            borderLeft: "2px solid rgba(251,191,36,0.15)",
            borderRight: "2px solid rgba(251,191,36,0.15)"
          }}
        />

        {/* Jar shoulder */}
        <div
          className="w-72 h-6 -mt-1 relative z-10"
          style={{
            background: "linear-gradient(180deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.03) 100%)",
            clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)",
            borderLeft: "2px solid rgba(251,191,36,0.12)",
            borderRight: "2px solid rgba(251,191,36,0.12)"
          }}
        />

        {/* Jar body */}
        <div
          className="w-72 h-72 relative overflow-hidden transition-transform group-hover:scale-[1.02]"
          style={{
            background: `
              radial-gradient(ellipse at 30% 10%, rgba(251,191,36,0.1) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 90%, rgba(251,191,36,0.06) 0%, transparent 50%),
              linear-gradient(180deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.02) 50%, rgba(251,191,36,0.05) 100%)
            `,
            borderRadius: "0 0 5rem 5rem",
            border: "2px solid rgba(251,191,36,0.15)",
            borderTop: "none",
            boxShadow: `
              inset 0 0 60px rgba(251,191,36,0.08),
              0 8px 32px rgba(0,0,0,0.08),
              0 2px 8px rgba(251,191,36,0.1)
            `,
            animation: "jarWobble 8s ease-in-out infinite",
            backdropFilter: "blur(2px)"
          }}
        >
          {/* Glass reflection highlight */}
          <div
            className="absolute left-3 top-6 w-6 h-32 rounded-full opacity-30 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)"
            }}
          />

          {/* Historical stars */}
          {dates.map((d) => {
            if (d === todayStr) return null;
            const count = dateCounts.get(d) ?? 0;
            const b2 = getBrightness(count, false);
            const h = hashDate(d);
            const top = 12 + (h % 73);
            const left = 10 + ((h * 7) % 75);
            const animIdx = h % FLOAT_ANIMS.length;
            const duration = 3 + (h % 5);
            const delay = (h % 3) * 0.7;

            return (
              <div
                key={d}
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  opacity: b2.opacity,
                  transform: `scale(${b2.scale})`,
                  filter: b2.glow > 0.08 ? `drop-shadow(0 0 ${b2.glow * 25}px var(--star-glow))` : undefined,
                  animation: `${FLOAT_ANIMS[animIdx]} ${duration}s ease-in-out ${delay}s infinite`,
                  fontSize: 14 + (count > 3 ? 4 : 0)
                }}
              >
                {starEmoji(count)}
              </div>
            );
          })}

          {/* Today's star — centered, prominent */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              animation: b.hasPulse ? "starGlowPulse 3s ease-in-out infinite" : undefined
            }}
          >
            <span
              className="text-5xl"
              style={{
                opacity: b.opacity,
                transform: `scale(${b.scale})`,
                filter: b.glow > 0 ? `drop-shadow(0 0 ${b.glow * 30}px var(--star-glow)) drop-shadow(0 0 ${b.glow * 60}px var(--star-bright))` : undefined
              }}
            >
              {todayCount === 0 ? "✨" : starEmoji(todayCount)}
            </span>
          </div>

          {/* Sparkle particles */}
          {sparkles.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: s.size,
                height: s.size,
                top: s.top,
                left: s.left,
                background: "radial-gradient(circle, var(--star-particle) 0%, transparent 70%)",
                animation: `sparkle ${2 + i * 0.3}s ease-in-out ${s.delay} infinite`
              }}
            />
          ))}
        </div>

        {/* Jar base shadow */}
        <div
          className="w-60 h-3 -mt-1 rounded-full opacity-30"
          style={{
            background: "radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)"
          }}
        />
      </div>

      {/* View calendar button */}
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

      {/* Hint text */}
      <p className="mt-4 text-[10px] font-bold text-faint">
        点击罐子或按钮查看日历 · 每颗星星都是你闪亮的一天
      </p>
    </div>
  );
}

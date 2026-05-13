import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { MoodEntry } from "../types";

interface Props {
  entries: MoodEntry[];
  onSelectDate: (date: string) => void;
  onBack: () => void;
}

function entryCountByDate(entries: MoodEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  entries.forEach((e) => {
    map.set(e.date, (map.get(e.date) ?? 0) + 1);
  });
  return map;
}

function starStyle(count: number, isTodayDate: boolean) {
  if (count === 0) {
    return { opacity: isTodayDate ? 0.15 : 0.08, scale: 0.5, glow: 0, emoji: "·" };
  }
  if (count <= 2) {
    return { opacity: 0.35, scale: 0.7, glow: 0.05, emoji: "⭐" };
  }
  if (count <= 5) {
    return { opacity: 0.65, scale: 0.85, glow: 0.2, emoji: "🌟" };
  }
  return { opacity: 1, scale: 1, glow: 0.4, emoji: "💫" };
}

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export function StarJarCalendar({ entries, onSelectDate, onBack }: Props) {
  const [cursor, setCursor] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const countMap = entryCountByDate(entries);
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const gridStart = viewMode === "month"
    ? startOfWeek(monthStart, { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });
  const gridEnd = viewMode === "month"
    ? endOfWeek(monthEnd, { weekStartsOn: 1 })
    : endOfWeek(new Date(), { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-muted hover:text-primary transition"
        >
          <ChevronLeft size={14} />
          回到罐子
        </button>

        <div className="flex items-center gap-2 bg-card rounded-xl px-2 py-1">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition ${
              viewMode === "month"
                ? "bg-surface-active text-primary"
                : "text-muted hover:text-secondary"
            }`}
          >
            月
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition ${
              viewMode === "week"
                ? "bg-surface-active text-primary"
                : "text-muted hover:text-secondary"
            }`}
          >
            周
          </button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="w-full flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => setCursor(viewMode === "month" ? subMonths(cursor, 1) : subMonths(cursor, 0))}
          className="text-muted hover:text-primary transition"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-black text-primary">
          {format(cursor, viewMode === "month" ? "yyyy年 M月" : "M月d日 这一周", { locale: zhCN })}
        </span>
        <button
          onClick={() => setCursor(viewMode === "month" ? addMonths(cursor, 1) : addMonths(cursor, 0))}
          className="text-muted hover:text-primary transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 w-full mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-black uppercase tracking-widest text-faint py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5 w-full">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const count = countMap.get(key) ?? 0;
          const s = starStyle(count, isToday(day));
          const inMonth = viewMode === "week" || isSameMonth(day, cursor);
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              disabled={!inMonth}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center transition hover:scale-105 ${
                !inMonth ? "opacity-20 pointer-events-none" : ""
              } ${
                today ? "ring-2 ring-amber-400/60" : ""
              }`}
              style={{
                background: count > 0
                  ? `rgba(251,191,36,${Math.min(0.18, count * 0.03)})`
                  : "transparent"
              }}
            >
              <span
                className="text-lg leading-none"
                style={{
                  opacity: s.opacity,
                  transform: `scale(${s.scale})`,
                  filter: s.glow > 0
                    ? `drop-shadow(0 0 ${s.glow * 20}px var(--star-glow))`
                    : undefined
                }}
              >
                {count > 0 ? s.emoji : <span className="text-[10px] text-faint">{format(day, "d")}</span>}
              </span>
              <span
                className={`text-[10px] font-bold mt-0.5 ${
                  count > 0 ? "text-primary" : "text-faint"
                }`}
              >
                {format(day, "d")}
              </span>
              {count > 0 && (
                <span className="text-[8px] font-black text-amber-500/60">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-6 text-[10px] font-bold text-faint">
        <Star size={10} className="opacity-30" />
        <span className="opacity-30">少</span>
        <span className="opacity-50">⭐</span>
        <span className="opacity-75">🌟</span>
        <span>💫</span>
        <span className="opacity-30">多</span>
      </div>
    </div>
  );
}

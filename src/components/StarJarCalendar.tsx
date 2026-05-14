import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { MoodEntry } from "../types";
import { makeRoundedStarPath } from "../lib/starPath";

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

interface StarLook {
  scale: number;
  opacity: number;
  glow: number;
}

function starLook(count: number): StarLook {
  if (count === 0) return { scale: 0, opacity: 0, glow: 0 };
  if (count <= 2) return { scale: 0.55, opacity: 0.55, glow: 0 };
  if (count <= 5) return { scale: 0.75, opacity: 0.85, glow: 2 };
  return { scale: 0.95, opacity: 1, glow: 4 };
}

function cellFill(count: number): string {
  if (count === 0) return "transparent";
  const alpha = Math.min(0.16, 0.035 + count * 0.022);
  return `rgba(245, 158, 11, ${alpha})`;
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
      {/* Top row: back + segmented control */}
      <div className="w-full flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-0.5 text-[13px] font-medium text-muted hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={2.25} />
          <span>返回</span>
        </button>

        <div
          className="flex items-center rounded-full p-0.5"
          style={{ background: "var(--bg-surface)" }}
        >
          {(["month", "week"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3.5 py-1 text-[11px] font-semibold rounded-full transition ${
                viewMode === m
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted hover:text-secondary"
              }`}
            >
              {m === "month" ? "月" : "周"}
            </button>
          ))}
        </div>
      </div>

      {/* Month/week title */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => viewMode === "month" && setCursor(subMonths(cursor, 1))}
          disabled={viewMode === "week"}
          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-primary hover:bg-surface transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} strokeWidth={2.25} />
        </button>
        <span className="text-[17px] font-semibold text-primary tracking-tight">
          {format(cursor, viewMode === "month" ? "yyyy年 M月" : "M月d日 这一周", { locale: zhCN })}
        </span>
        <button
          onClick={() => viewMode === "month" && setCursor(addMonths(cursor, 1))}
          disabled={viewMode === "week"}
          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-primary hover:bg-surface transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} strokeWidth={2.25} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 w-full mb-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold tracking-wider text-faint py-1.5"
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
          const look = starLook(count);
          const inMonth = viewMode === "week" || isSameMonth(day, cursor);
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              disabled={!inMonth}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                inMonth ? "hover:scale-[1.04] active:scale-95" : "opacity-30 pointer-events-none"
              }`}
              style={{
                background: cellFill(count),
                boxShadow: today ? "inset 0 0 0 1.5px var(--star-bright)" : undefined,
              }}
            >
              {/* Star (or placeholder space) */}
              <div className="h-[20px] flex items-center justify-center">
                {count > 0 ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" style={{
                    opacity: look.opacity,
                    transform: `scale(${look.scale})`,
                    filter: look.glow > 0 ? `drop-shadow(0 0 ${look.glow}px var(--star-glow))` : undefined,
                  }}>
                    <path
                      d={makeRoundedStarPath(10, 10, 9, 0)}
                      fill="var(--star-bright)"
                    />
                  </svg>
                ) : null}
              </div>

              {/* Date */}
              <span
                className={`text-[12px] mt-0.5 leading-none tabular-nums ${
                  today ? "font-bold text-primary" : count > 0 ? "font-semibold text-primary" : "font-medium text-muted"
                }`}
              >
                {format(day, "d")}
              </span>

              {/* Count badge */}
              {count > 0 && (
                <span
                  className="absolute top-1 right-1 text-[9px] font-bold tabular-nums leading-none"
                  style={{ color: "var(--star-bright)" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-6 text-[10px] font-medium text-faint">
        <span>少</span>
        {[1, 3, 6, 10].map((n) => {
          const look = starLook(n);
          return (
            <svg key={n} width="14" height="14" viewBox="0 0 20 20" style={{
              opacity: look.opacity,
              filter: look.glow > 0 ? `drop-shadow(0 0 ${look.glow}px var(--star-glow))` : undefined,
            }}>
              <path d={makeRoundedStarPath(10, 10, 9, 0)} fill="var(--star-bright)" />
            </svg>
          );
        })}
        <span>多</span>
      </div>
    </div>
  );
}

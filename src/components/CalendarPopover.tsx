import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { FocusSession } from "../types";
import { completedSessions } from "../lib/stats";

interface Props {
  open: boolean;
  sessions: FocusSession[];
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export function CalendarPopover({ open, sessions, selectedDate, onSelect, onClose }: Props) {
  const [cursor, setCursor] = useState<Date>(selectedDate);

  const minutesByDay = useMemo(() => {
    const map = new Map<string, number>();
    completedSessions(sessions).forEach((s) => {
      const key = format(parseISO(s.startTime), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + s.actualMinutes);
    });
    return map;
  }, [sessions]);

  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  const cells: Date[] = Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const maxMinutes = Math.max(1, ...Array.from(minutesByDay.values()));
  const today = new Date();

  if (!open) return null;

  function intensity(date: Date): { bg: string } {
    const key = format(date, "yyyy-MM-dd");
    const mins = minutesByDay.get(key) ?? 0;
    if (mins === 0) return { bg: "transparent" };
    const ratio = mins / maxMinutes;
    const alpha = 0.18 + ratio * 0.65;
    return { bg: `rgba(138, 138, 255, ${alpha.toFixed(2)})` };
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-14 z-50 w-[min(340px,90vw)] rounded-[1.5rem] bg-card p-4 sm:p-5 shadow-2xl ring-1 ring-subtle">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-muted hover:text-primary"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              点击日期查看详情
            </p>
            <p className="mt-0.5 text-sm font-black text-primary">
              {format(cursor, "yyyy年 M月", { locale: zhCN })}
            </p>
          </div>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-muted hover:text-primary"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-black uppercase tracking-wider text-muted"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const mins = minutesByDay.get(key) ?? 0;
            const inMonth = isSameMonth(d, cursor);
            const isSelected = isSameDay(d, selectedDate);
            const isToday = isSameDay(d, today);
            const { bg } = intensity(d);

            const textClass = !inMonth
              ? "text-faint opacity-40"
              : mins > 0
              ? "text-primary"
              : "text-muted";

            return (
              <button
                key={key}
                onClick={() => {
                  onSelect(d);
                  onClose();
                }}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition ${textClass} ${
                  isSelected ? "ring-2 ring-indigo-400" : ""
                } hover:ring-1 hover:ring-indigo-400/40`}
                style={{ background: inMonth ? bg : "transparent" }}
              >
                <span className={isToday ? "text-indigo-400" : ""}>{d.getDate()}</span>
                {mins > 0 && inMonth && (
                  <span className="text-[8px] font-black leading-none mt-0.5 opacity-80">
                    {mins}m
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted">
          <span>专注热度</span>
          <div className="flex items-center gap-1">
            {[0.18, 0.35, 0.55, 0.75].map((a) => (
              <span
                key={a}
                className="h-2 w-3 rounded-sm"
                style={{ background: `rgba(138, 138, 255, ${a})` }}
              />
            ))}
            <span className="ml-1 text-faint">高</span>
          </div>
        </div>
      </div>
    </>
  );
}

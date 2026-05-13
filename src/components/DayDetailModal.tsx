import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { FocusSession, Task, TaskNote } from "../types";
import { getNotesByDate } from "../lib/storage";
import { tagColor } from "../lib/colors";

interface Props {
  open: boolean;
  date: Date | null;
  sessions: FocusSession[];
  tasks: Task[];
  onClose: () => void;
}

interface Group {
  key: string;
  taskId?: string;
  title: string;
  tag: string;
  icon: string;
  totalMinutes: number;
  sessionCount: number;
  notes: TaskNote[];
}

export function DayDetailModal({ open, date, sessions, tasks, onClose }: Props) {
  const [notes, setNotes] = useState<TaskNote[]>([]);

  useEffect(() => {
    if (!open || !date) {
      setNotes([]);
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    getNotesByDate(dateStr).then(setNotes);
  }, [open, date]);

  if (!open || !date) return null;

  const daySessions = sessions.filter((s) => isSameDay(parseISO(s.startTime), date));
  const completed = daySessions.filter((s) => s.status === "completed");

  // Group sessions by taskId (or title+tag fallback for legacy)
  const groups = new Map<string, Group>();
  daySessions.forEach((s) => {
    const key = s.taskId ?? `__${s.title}__${s.tag}`;
    const task = s.taskId ? tasks.find((t) => t.id === s.taskId) : undefined;
    const existing = groups.get(key);
    if (existing) {
      if (s.status === "completed") existing.totalMinutes += s.actualMinutes;
      existing.sessionCount += 1;
    } else {
      groups.set(key, {
        key,
        taskId: s.taskId,
        title: task?.title ?? s.title,
        tag: task?.tag ?? s.tag,
        icon: task?.icon ?? "🎯",
        totalMinutes: s.status === "completed" ? s.actualMinutes : 0,
        sessionCount: 1,
        notes: []
      });
    }
  });

  // Attach notes by taskId
  notes.forEach((n) => {
    const group = Array.from(groups.values()).find((g) => g.taskId === n.taskId);
    if (group) {
      group.notes.push(n);
    } else {
      // Note exists for a task that had no sessions today — still show
      const task = tasks.find((t) => t.id === n.taskId);
      if (task) {
        groups.set(`note-only-${task.id}`, {
          key: `note-only-${task.id}`,
          taskId: task.id,
          title: task.title,
          tag: task.tag,
          icon: task.icon,
          totalMinutes: 0,
          sessionCount: 0,
          notes: [n]
        });
      }
    }
  });

  const groupList = Array.from(groups.values()).sort(
    (a, b) => b.totalMinutes - a.totalMinutes
  );

  const totalAll = completed.reduce((sum, s) => sum + s.actualMinutes, 0);
  const totalHours = Math.floor(totalAll / 60);
  const totalMins = totalAll % 60;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-[2rem] bg-[#22222b] p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Day journal
            </p>
            <h3 className="mt-0.5 text-xl sm:text-2xl font-black text-white">
              {format(date, "yyyy 年 M月d日 EEEE", { locale: zhCN })}
            </h3>
            <p className="mt-1 text-xs font-bold text-indigo-300">
              <Clock size={11} className="inline -mt-0.5 mr-1" />
              专注 {totalHours > 0 ? `${totalHours} 小时 ` : ""}
              {totalMins} 分钟 · 共 {completed.length} 次会话
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#2a2a35] text-gray-400 hover:text-white shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {groupList.length === 0 ? (
          <div className="flex-1 grid place-items-center text-xs font-bold uppercase tracking-widest text-gray-600">
            这一天没有专注记录或备注
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
            {groupList.map((g) => {
              const accent = tagColor(g.tag);
              return (
                <div
                  key={g.key}
                  className="relative rounded-2xl bg-[#1a1a22] p-4 sm:p-5 overflow-hidden"
                >
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ background: accent }}
                  />
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="grid h-11 w-11 place-items-center rounded-full text-xl shrink-0"
                      style={{ background: `${accent}22` }}
                    >
                      {g.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-black text-white truncate">{g.title}</h4>
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase"
                          style={{ background: `${accent}33`, color: accent }}
                        >
                          {g.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {g.totalMinutes > 0
                          ? `${g.totalMinutes} 分钟 · ${g.sessionCount} 次`
                          : g.notes.length > 0
                          ? "仅备注"
                          : `${g.sessionCount} 次`}
                      </p>
                    </div>
                  </div>

                  {g.notes.length > 0 ? (
                    <div className="space-y-2 mt-3 pl-2 border-l-2 border-white/5">
                      {g.notes.map((n) => (
                        <p
                          key={n.id}
                          className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap break-words pl-3"
                        >
                          {n.content}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 pl-2 text-xs text-gray-600 italic">
                      暂无备注
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

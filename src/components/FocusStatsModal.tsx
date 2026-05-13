import { X, Clock } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { FocusSession } from "../types";
import { tagColor } from "../lib/colors";

interface Props {
  open: boolean;
  date: Date;
  sessions: FocusSession[];
  onClose: () => void;
}

export function FocusStatsModal({ open, date, sessions, onClose }: Props) {
  if (!open) return null;

  const daySessions = sessions.filter((s) => isSameDay(parseISO(s.startTime), date));
  const completed = daySessions.filter((s) => s.status === "completed");
  const totalMin = completed.reduce((sum, s) => sum + s.actualMinutes, 0);
  const totalHours = Math.floor(totalMin / 60);
  const totalMins = totalMin % 60;
  const failed = daySessions.filter((s) => s.status === "abandoned").length;

  const dayTags = Array.from(new Set(completed.map((s) => s.tag))).sort();

  const hourly = Array.from({ length: 24 }).map((_, hour) => {
    const row: Record<string, string | number> = { hour: hour.toString().padStart(2, "0") };
    dayTags.forEach((tag) => (row[tag] = 0));
    return row;
  });
  completed.forEach((s) => {
    const h = parseISO(s.startTime).getHours();
    hourly[h][s.tag] = (hourly[h][s.tag] as number) + s.actualMinutes;
  });

  const tagMap = new Map<string, number>();
  completed.forEach((s) => {
    tagMap.set(s.tag, (tagMap.get(s.tag) ?? 0) + s.actualMinutes);
  });
  const topTags = Array.from(tagMap.entries())
    .map(([tag, minutes]) => ({ tag, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-[2rem] bg-card p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Focus Stats
            </p>
            <h3 className="mt-0.5 text-xl sm:text-2xl font-black text-primary">
              {format(date, "yyyy 年 M月d日 EEEE", { locale: zhCN })}
            </h3>
            <p className="mt-1 text-xs font-bold text-indigo-400">
              <Clock size={11} className="inline -mt-0.5 mr-1" />
              专注 {totalHours > 0 ? `${totalHours} 小时 ` : ""}
              {totalMins} 分钟 · {completed.length} 次完成 · {failed} 次放弃
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted hover:text-primary shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
          {completed.length === 0 ? (
            <div className="pt-12 pb-16 text-center">
              <p className="text-4xl mb-4">📊</p>
              <p className="text-sm font-bold text-muted">这一天还没有专注记录</p>
              <p className="mt-1 text-xs text-faint">完成一次专注后这里会有统计分析</p>
            </div>
          ) : (
            <>
              <section>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3">
                  每小时分布
                </p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" vertical={false} />
                      <XAxis dataKey="hour" stroke="var(--axis-stroke)" tick={{ fontSize: 10 }} interval={2} />
                      <YAxis stroke="var(--axis-stroke)" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 12,
                          color: "var(--text-primary)"
                        }}
                        formatter={(v: number, name) => [`${v}分钟`, name]}
                        labelFormatter={(h) => `${h}:00`}
                      />
                      {dayTags.map((tag) => (
                        <Bar
                          key={tag}
                          dataKey={tag}
                          stackId="a"
                          fill={tagColor(tag)}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3">
                  标签分布
                </p>
                {topTags.length > 0 ? (
                  <div className="space-y-3">
                    {topTags.map((t) => (
                      <div key={t.tag}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-secondary">{t.tag}</span>
                          <span className="text-xs font-bold text-muted">{t.minutes}m</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              background: tagColor(t.tag),
                              width: `${topTags[0].minutes > 0 ? (t.minutes / topTags[0].minutes) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-faint">--</p>
                )}
              </section>

              <section>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3">
                  会话明细
                </p>
                <div className="space-y-2">
                  {completed.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-2xl bg-page px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary truncate">{s.title}</span>
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase shrink-0"
                            style={{
                              background: `${tagColor(s.tag)}33`,
                              color: tagColor(s.tag)
                            }}
                          >
                            {s.tag}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-semibold text-muted">
                          {format(parseISO(s.startTime), "HH:mm")} · {s.actualMinutes}分钟
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

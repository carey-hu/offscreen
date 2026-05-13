import { isSameDay, parseISO, subDays, format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { FocusSession } from "../types";
import { completedSessions, tagStats } from "../lib/stats";
import { tagColor } from "../lib/colors";

interface Props {
  sessions: FocusSession[];
  selectedDate: Date;
}

const TOOLTIP_STYLE = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  color: "var(--text-primary)"
} as const;

export function ScreenTimePanel({ sessions, selectedDate }: Props) {
  const day = sessions.filter((s) => isSameDay(parseISO(s.startTime), selectedDate));
  const dayCompleted = completedSessions(day);
  const totalMin = dayCompleted.reduce((sum, s) => sum + s.actualMinutes, 0);

  const dayTags = Array.from(new Set(dayCompleted.map((s) => s.tag))).sort();
  const allTags = Array.from(new Set(completedSessions(sessions).map((s) => s.tag))).sort();

  const hourly = Array.from({ length: 24 }).map((_, hour) => {
    const row: Record<string, string | number> = { hour: hour.toString().padStart(2, "0") };
    dayTags.forEach((tag) => (row[tag] = 0));
    return row;
  });
  dayCompleted.forEach((s) => {
    const h = parseISO(s.startTime).getHours();
    hourly[h][s.tag] = (hourly[h][s.tag] as number) + s.actualMinutes;
  });

  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const row: Record<string, string | number> = { label: format(date, "MM-dd"), _date: date.toISOString() };
    allTags.forEach((tag) => (row[tag] = 0));
    return row;
  });
  completedSessions(sessions).forEach((s) => {
    const d = parseISO(s.startTime);
    const row = weekly.find((w) => isSameDay(new Date(w._date as string), d));
    if (row) row[s.tag] = (row[s.tag] as number) + s.actualMinutes;
  });

  const tags = tagStats(sessions).slice(0, 8);

  return (
    <div className="space-y-6">
      <section className="offscreen-card">
        <div className="mb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            Daily focus
          </p>
          <h3 className="mt-1 text-2xl font-black text-primary">
            今日 · {Math.floor(totalMin / 60) > 0 ? `${Math.floor(totalMin / 60)}小时 ` : ""}
            {totalMin % 60}分钟
          </h3>
        </div>
        <div className="h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" vertical={false} />
              <XAxis dataKey="hour" stroke="var(--axis-stroke)" tick={{ fontSize: 10 }} interval={2} />
              <YAxis stroke="var(--axis-stroke)" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number, name) => [`${v}分钟`, name]}
                labelFormatter={(h) => `${h}:00`}
              />
              {dayTags.length > 0 ? (
                dayTags.map((tag) => (
                  <Bar
                    key={tag}
                    dataKey={tag}
                    stackId="a"
                    fill={tagColor(tag)}
                    radius={[4, 4, 0, 0]}
                  />
                ))
              ) : (
                <Bar dataKey="_empty" fill="transparent" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {dayTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {dayTags.map((tag) => (
              <div key={tag} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ background: tagColor(tag) }} />
                <span className="text-[11px] font-bold text-secondary">{tag}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="offscreen-card">
          <div className="mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              7 day trend
            </p>
            <h3 className="mt-1 text-xl font-black text-primary">本周走势</h3>
          </div>
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--axis-stroke)" tick={{ fontSize: 10 }} />
                <YAxis stroke="var(--axis-stroke)" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number, name) => [`${v}分钟`, name]}
                />
                {allTags.length > 0 ? (
                  allTags.map((tag) => (
                    <Bar
                      key={tag}
                      dataKey={tag}
                      stackId="w"
                      fill={tagColor(tag)}
                      radius={[4, 4, 0, 0]}
                    />
                  ))
                ) : (
                  <Bar dataKey="_empty" fill="transparent" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="offscreen-card">
          <div className="mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              Tag breakdown
            </p>
            <h3 className="mt-1 text-xl font-black text-primary">标签占比</h3>
          </div>
          {tags.length === 0 ? (
            <div className="h-48 mt-4 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-faint">
              暂无数据
            </div>
          ) : (
            <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tags}
                    dataKey="minutes"
                    nameKey="tag"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {tags.map((entry) => (
                      <Cell key={entry.tag} fill={tagColor(entry.tag)} />
                    ))}
                  </Pie>
                  <Legend
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, name) => [`${v}分钟`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="offscreen-card">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Note</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Web/PWA 无法读取系统屏幕使用时间。这里的统计仅来自本应用内的专注会话记录。
        </p>
      </section>
    </div>
  );
}

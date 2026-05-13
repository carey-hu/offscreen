import { isSameDay, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { FocusSession } from "../types";
import { completedSessions, lastSevenDays, tagStats } from "../lib/stats";

interface Props {
  sessions: FocusSession[];
  selectedDate: Date;
}

const PIE_COLORS = ["#8a8aff", "#b0b0ff", "#6666cc", "#4d4d99", "#3d3d4d", "#5a5a7a"];

export function ScreenTimePanel({ sessions, selectedDate }: Props) {
  const day = sessions.filter((s) => isSameDay(parseISO(s.startTime), selectedDate));
  const dayCompleted = completedSessions(day);
  const totalMin = dayCompleted.reduce((sum, s) => sum + s.actualMinutes, 0);

  // Hourly distribution for selected date
  const hourly = Array.from({ length: 24 }).map((_, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}`,
    minutes: 0
  }));
  dayCompleted.forEach((s) => {
    const h = parseISO(s.startTime).getHours();
    hourly[h].minutes += s.actualMinutes;
  });

  const week = lastSevenDays(sessions);
  const tags = tagStats(sessions).slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="offscreen-card">
        <div className="mb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Daily focus
          </p>
          <h3 className="mt-1 text-2xl font-black text-white">
            今日 · {Math.floor(totalMin / 60) > 0 ? `${Math.floor(totalMin / 60)}小时 ` : ""}
            {totalMin % 60}分钟
          </h3>
        </div>
        <div className="h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="#666"
                tick={{ fontSize: 10 }}
                interval={2}
              />
              <YAxis stroke="#666" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "#22222b",
                  border: "1px solid #353545",
                  borderRadius: 12,
                  color: "#fff"
                }}
                formatter={(v: number) => [`${v}分钟`, "专注"]}
                labelFormatter={(h) => `${h}:00`}
              />
              <Bar dataKey="minutes" fill="#8a8aff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="offscreen-card">
          <div className="mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              7 day trend
            </p>
            <h3 className="mt-1 text-xl font-black text-white">本周走势</h3>
          </div>
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={week}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
                <XAxis dataKey="label" stroke="#666" tick={{ fontSize: 10 }} />
                <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "#22222b",
                    border: "1px solid #353545",
                    borderRadius: 12,
                    color: "#fff"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#8a8aff"
                  strokeWidth={3}
                  dot={{ fill: "#8a8aff", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="offscreen-card">
          <div className="mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              Tag breakdown
            </p>
            <h3 className="mt-1 text-xl font-black text-white">标签占比</h3>
          </div>
          {tags.length === 0 ? (
            <div className="h-48 mt-4 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-gray-600">
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
                    {tags.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#22222b",
                      border: "1px solid #353545",
                      borderRadius: 12,
                      color: "#fff"
                    }}
                    formatter={(v: number, name) => [`${v}分钟`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="offscreen-card">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Note</p>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Web/PWA 无法读取系统屏幕使用时间。这里的统计仅来自本应用内的专注会话记录。
        </p>
      </section>
    </div>
  );
}

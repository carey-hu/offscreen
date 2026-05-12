import { Award, CalendarDays, Flame, Timer } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FocusSession } from "../types";
import {
  currentStreakDays,
  lastSevenDays,
  tagStats,
  todaySessions,
  totalMinutes,
  weekSessions
} from "../lib/stats";
import { StatCard } from "./StatCard";

interface Props {
  sessions: FocusSession[];
}

export function StatsPanel({ sessions }: Props) {
  const today = todaySessions(sessions);
  const week = weekSessions(sessions);
  const sevenDays = lastSevenDays(sessions);
  const tags = tagStats(sessions);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="今日专注"
          value={`${totalMinutes(today)}`}
          icon={<Timer size={18} />}
          hint="MINUTES"
        />
        <StatCard
          title="本周专注"
          value={`${totalMinutes(week)}`}
          icon={<CalendarDays size={18} />}
          hint="MINUTES"
        />
        <StatCard
          title="专注天数"
          value={`${currentStreakDays(sessions)}`}
          icon={<Flame size={18} />}
          hint="DAYS STREAK"
        />
        <StatCard
          title="累计完成"
          value={`${sessions.filter(s => s.status === 'completed').length}`}
          icon={<Award size={18} />}
          hint="SESSIONS"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="offscreen-card lg:col-span-2">
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Trends</p>
            <h3 className="mt-1 text-2xl font-black">近 7 日趋势</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sevenDays}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 800 }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Bar
                  dataKey="minutes"
                  fill="#ffffff"
                  radius={[8, 8, 8, 8]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="offscreen-card">
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Tags</p>
            <h3 className="mt-1 text-2xl font-black">标签分布</h3>
          </div>

          <div className="space-y-3">
            {tags.length === 0 ? (
              <p className="rounded-2xl bg-gray-800/50 p-6 text-sm font-semibold text-gray-600">
                暂无标签统计
              </p>
            ) : (
              tags.slice(0, 6).map((item) => (
                <div key={item.tag} className="flex items-center justify-between rounded-[1.25rem] bg-gray-800/50 px-5 py-4 transition hover:bg-gray-800">
                  <span className="text-sm font-bold text-gray-300">{item.tag}</span>
                  <span className="text-xs font-black text-white">{item.minutes}m</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

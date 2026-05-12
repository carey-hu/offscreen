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
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="今日专注"
          value={`${totalMinutes(today)} 分钟`}
          icon={<Timer size={20} />}
          hint={`${today.length} 条记录`}
        />
        <StatCard
          title="本周专注"
          value={`${totalMinutes(week)} 分钟`}
          icon={<CalendarDays size={20} />}
          hint="周一至今天"
        />
        <StatCard
          title="连续天数"
          value={`${currentStreakDays(sessions)} 天`}
          icon={<Flame size={20} />}
          hint="有完成记录即计入"
        />
        <StatCard
          title="累计专注"
          value={`${totalMinutes(sessions)} 分钟`}
          icon={<Award size={20} />}
          hint={`${sessions.length} 条总记录`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">近 7 日趋势</h3>
            <p className="text-sm text-gray-500">按完成的专注分钟统计</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sevenDays}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="minutes" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">标签排行</h3>
            <p className="text-sm text-gray-500">查看时间投入方向</p>
          </div>

          <div className="space-y-3">
            {tags.length === 0 ? (
              <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                暂无标签统计。完成一次专注后会显示。
              </p>
            ) : (
              tags.slice(0, 6).map((item) => (
                <div key={item.tag} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <span className="font-medium text-gray-800">{item.tag}</span>
                  <span className="text-sm text-gray-500">{item.minutes} 分钟</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

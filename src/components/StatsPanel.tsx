import { Clock } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";
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
import { currentStreakDays, lastSevenDays, tagStats, totalMinutes } from "../lib/stats";
import { StatCard } from "./StatCard";

interface Props {
  sessions: FocusSession[];
  selectedDate?: Date;
  summaryOnly?: boolean;
}

export function StatsPanel({ sessions, selectedDate, summaryOnly }: Props) {
  const refDate = selectedDate ?? new Date();
  const dateSessions = sessions.filter((s) =>
    isSameDay(parseISO(s.startTime), refDate)
  );
  const totalMin = totalMinutes(dateSessions);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  const latest = dateSessions.find((s) => s.status === "completed");
  const latestMinutes = latest?.actualMinutes ?? 0;
  const failedCount = dateSessions.filter((s) => s.status === "abandoned").length;

  if (summaryOnly) {
    return (
      <div className="grid grid-cols-3 gap-6">
        <div className="offscreen-card relative overflow-hidden h-44">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
            专注时长
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">
              {hours > 0 ? `${hours}小时` : ""}
              {mins}分钟
            </span>
          </div>
          <p className="mt-1 text-[10px] font-black text-gray-600 uppercase tracking-widest">
            专注
          </p>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 opacity-20 text-indigo-400 rotate-12">
            <LotusIcon />
          </div>
        </div>

        <div className="offscreen-card relative overflow-hidden h-44">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
            最新动态
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">{latestMinutes}分钟</span>
          </div>
          <p className="mt-1 text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1">
            {latest ? latest.title.slice(0, 6) : "暂无"} <Clock size={10} className="fill-gray-600" />
          </p>
          <div className="absolute -bottom-2 -right-2 h-20 w-20 opacity-30 text-indigo-300">
            <div className="relative h-full w-full">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-400/30" />
              <div className="absolute top-1/2 left-1/2 h-1/2 w-1 bg-indigo-400/50 -translate-x-1/2 -translate-y-full rounded-full origin-bottom rotate-45" />
            </div>
          </div>
        </div>

        <div className="offscreen-card relative overflow-hidden h-44">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
            失败次数
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">{failedCount}次</span>
          </div>
          <p className="mt-1 text-[10px] font-black text-gray-600 uppercase tracking-widest">
            失败次数
          </p>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 opacity-20 flex items-center justify-center text-6xl grayscale">
            😵
          </div>
        </div>
      </div>
    );
  }

  // Full view
  const weekData = lastSevenDays(sessions);
  const tags = tagStats(sessions).slice(0, 6);
  const streak = currentStreakDays(sessions);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="今日专注"
          value={`${hours > 0 ? `${hours}h ` : ""}${mins}m`}
          hint="Today focused"
        />
        <StatCard
          title="连续天数"
          value={`${streak} 天`}
          hint={streak > 0 ? "Keep going" : "Start today"}
        />
        <StatCard
          title="放弃次数"
          value={`${failedCount} 次`}
          hint="Today abandoned"
        />
      </div>

      <section className="offscreen-card">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Last 7 days
          </p>
          <h3 className="mt-1 text-xl font-black text-white">过去 7 天专注分钟数</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
              <XAxis dataKey="label" stroke="#666" tick={{ fontSize: 11 }} />
              <YAxis stroke="#666" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#22222b",
                  border: "1px solid #353545",
                  borderRadius: 12,
                  color: "#fff"
                }}
              />
              <Bar dataKey="minutes" fill="#8a8aff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {tags.length > 0 && (
        <section className="offscreen-card">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Tags</p>
            <h3 className="mt-1 text-xl font-black text-white">标签分布</h3>
          </div>
          <div className="space-y-2">
            {tags.map((t) => {
              const max = tags[0].minutes;
              const pct = max > 0 ? (t.minutes / max) * 100 : 0;
              return (
                <div key={t.tag} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-bold text-gray-400 truncate">{t.tag}</div>
                  <div className="flex-1 h-2 rounded-full bg-[#2a2a35] overflow-hidden">
                    <div
                      className="h-full bg-indigo-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-xs font-bold text-gray-300 tabular-nums">
                    {t.minutes}m
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function LotusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,21C10.5,18.5 4,16 4,11C4,7.5 7,6 8,6C8.5,6 9,6.5 9.5,7C10.5,8 11.5,10 12,12C12.5,10 13.5,8 14.5,7C15,6.5 15.5,6 16,6C17,6 20,7.5 20,11C20,16 13.5,18.5 12,21Z" />
    </svg>
  );
}

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
  onOpenFocusStats?: () => void;
  onOpenSessionHistory?: () => void;
  moodTodayCount?: number;
  onOpenStarJar?: () => void;
}

export function StatsPanel({ sessions, selectedDate, summaryOnly, onOpenFocusStats, onOpenSessionHistory, moodTodayCount, onOpenStarJar }: Props) {
  // Summary cards always reflect TODAY regardless of the navigated date
  const todayRef = new Date();
  const todaySess = sessions.filter((s) => isSameDay(parseISO(s.startTime), todayRef));
  const todayCompleted = todaySess.filter((s) => s.status === "completed");
  const todayTotal = totalMinutes(todayCompleted);
  const todayHours = Math.floor(todayTotal / 60);
  const todayMins = todayTotal % 60;

  // Latest completed session (across all days, newest first since storage sorts by startTime desc)
  const latestEver = sessions.find((s) => s.status === "completed");
  const latestMins = latestEver?.actualMinutes ?? 0;
  const latestTitle = latestEver?.title ?? "";
  if (summaryOnly) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:gap-6">
        <button
          onClick={onOpenFocusStats}
          className="offscreen-card relative overflow-hidden h-40 sm:h-44 w-full text-left cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2">
            专注时长
          </p>
          {todayTotal === 0 ? (
            <>
              <div className="text-2xl sm:text-3xl font-black text-faint">--</div>
              <p className="mt-1 text-[10px] font-black text-faint uppercase tracking-widest">
                今日尚未专注
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-primary">
                  {todayHours > 0 ? `${todayHours}h ` : ""}
                  {todayMins}m
                </span>
              </div>
              <p className="mt-1 text-[10px] font-black text-faint uppercase tracking-widest">
                今日 · {todayCompleted.length} 次会话
              </p>
            </>
          )}
          <div className="absolute -bottom-4 -right-4 h-20 w-20 sm:h-24 sm:w-24 opacity-20 text-indigo-400 rotate-12">
            <LotusIcon />
          </div>
        </button>

        <button
          onClick={onOpenSessionHistory}
          className="offscreen-card relative overflow-hidden h-40 sm:h-44 w-full text-left cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2">
            最新动态
          </p>
          {latestMins === 0 ? (
            <>
              <div className="text-2xl sm:text-3xl font-black text-faint">--</div>
              <p className="mt-1 text-[10px] font-black text-faint uppercase tracking-widest">
                暂无完成记录
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-primary">
                  {latestMins}m
                </span>
              </div>
              <p className="mt-1 text-[10px] font-black text-faint uppercase tracking-widest flex items-center gap-1 truncate">
                <Clock size={10} />
                <span className="truncate">{latestTitle || "最新"}</span>
              </p>
            </>
          )}
          <div className="absolute -bottom-2 -right-2 h-16 w-16 sm:h-20 sm:w-20 opacity-30 text-indigo-300">
            <div className="relative h-full w-full">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-400/30" />
              <div className="absolute top-1/2 left-1/2 h-1/2 w-1 bg-indigo-400/50 -translate-x-1/2 -translate-y-full rounded-full origin-bottom rotate-45" />
            </div>
          </div>
        </button>

        <button
          onClick={onOpenStarJar}
          className="offscreen-card relative overflow-hidden h-40 sm:h-44 w-full text-left cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2">
            今日星星
          </p>
          {(!moodTodayCount || moodTodayCount === 0) ? (
            <>
              <div className="text-2xl sm:text-3xl font-black text-faint">--</div>
              <p className="mt-1 text-[10px] font-black text-faint uppercase tracking-widest">
                今日尚未记录
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl sm:text-4xl font-black"
                  style={{ color: "var(--star-glow)" }}
                >
                  {moodTodayCount}
                </span>
                <span className="text-sm font-bold" style={{ color: "var(--star-bright)" }}>
                  {moodTodayCount <= 2 ? "⭐" : moodTodayCount <= 5 ? "🌟" : "💫"}
                </span>
              </div>
              <p className="mt-1 text-[10px] font-black text-faint uppercase tracking-widest">
                今日心情记录
              </p>
            </>
          )}
          <div className="absolute -bottom-4 -right-4 h-20 w-20 sm:h-24 sm:w-24 opacity-20 flex items-center justify-center text-5xl sm:text-6xl">
            {moodTodayCount && moodTodayCount > 0 ? "⭐" : "✨"}
          </div>
        </button>
      </div>
    );
  }

  // Full view — use selectedDate
  const refDate = selectedDate ?? new Date();
  const dateSessions = sessions.filter((s) => isSameDay(parseISO(s.startTime), refDate));
  const dateCompleted = dateSessions.filter((s) => s.status === "completed");
  const dateTotal = totalMinutes(dateCompleted);
  const dateHours = Math.floor(dateTotal / 60);
  const dateMins = dateTotal % 60;
  const dateFailed = dateSessions.filter((s) => s.status === "abandoned").length;

  const weekData = lastSevenDays(sessions);
  const tags = tagStats(sessions).slice(0, 6);
  const streak = currentStreakDays(sessions);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="当日专注"
          value={`${dateHours > 0 ? `${dateHours}h ` : ""}${dateMins}m`}
          hint="Selected date"
        />
        <StatCard
          title="连续天数"
          value={`${streak} 天`}
          hint={streak > 0 ? "Keep going" : "Start today"}
        />
        <StatCard
          title="放弃次数"
          value={`${dateFailed} 次`}
          hint="Selected date"
        />
      </div>

      <section className="offscreen-card">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            Last 7 days
          </p>
          <h3 className="mt-1 text-xl font-black text-primary">过去 7 天专注分钟数</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--axis-stroke)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--axis-stroke)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  color: "var(--text-primary)"
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Tags</p>
            <h3 className="mt-1 text-xl font-black text-primary">标签分布</h3>
          </div>
          <div className="space-y-2">
            {tags.map((t) => {
              const max = tags[0].minutes;
              const pct = max > 0 ? (t.minutes / max) * 100 : 0;
              return (
                <div key={t.tag} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-bold text-muted truncate">{t.tag}</div>
                  <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                    <div className="h-full bg-indigo-400" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-16 text-right text-xs font-bold text-secondary tabular-nums">
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

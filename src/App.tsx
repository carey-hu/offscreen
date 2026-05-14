import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useCallback, useState } from "react";
import { TimerPanel } from "./components/TimerPanel";
import { StatsPanel } from "./components/StatsPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { TaskSidebar } from "./components/TaskSidebar";
import { ScreenTimePanel } from "./components/ScreenTimePanel";
import { StarJarPage } from "./components/StarJarPage";
import { CalendarPopover } from "./components/CalendarPopover";
import { DayDetailModal } from "./components/DayDetailModal";
import { FocusStatsModal } from "./components/FocusStatsModal";
import { SessionHistoryModal } from "./components/SessionHistoryModal";
import { useSessions } from "./hooks/useSessions";
import { useSettings } from "./hooks/useSettings";
import { useTasks } from "./hooks/useTasks";
import { useMoodEntries } from "./hooks/useMoodEntries";
import { useThemeApplier } from "./hooks/useThemeApplier";
import { useSync } from "./hooks/useSync";
import { TimerProvider } from "./contexts/TimerContext";
import { Task } from "./types";

export default function App() {
  const { sessions, upsert: upsertSession, remove: removeSession, clear, refresh: refreshSessions } = useSessions();
  const { tasks, upsert: upsertTask, remove: removeTask, refresh: refreshTasks } = useTasks();
  const { settings, update: updateSettings, refresh: refreshSettings } = useSettings();
  const { entries: moodEntries, upsert: upsertMood, remove: removeMood, refresh: refreshMoods } = useMoodEntries();
  const [activeTab, setActiveTab] = useState<"stats" | "focus" | "settings" | "starjar">("focus");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [detailDate, setDetailDate] = useState<Date | null>(null);
  const [focusStatsOpen, setFocusStatsOpen] = useState(false);
  const [sessionHistoryOpen, setSessionHistoryOpen] = useState(false);

  useThemeApplier(settings.theme);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshSessions(),
      refreshTasks(),
      refreshSettings(),
      refreshMoods()
    ]);
  }, [refreshSessions, refreshTasks, refreshSettings, refreshMoods]);

  const sync = useSync({ onSynced: refreshAll });

  function shiftDate(days: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  }

  const ensureTask = useCallback(
    async ({ title, tag, plannedMinutes }: { title: string; tag: string; plannedMinutes?: number }) => {
      const existing = tasks.find(
        (t) => t.title.trim() === title.trim() && t.tag.trim() === tag.trim()
      );
      if (existing) return existing.id;
      const id = crypto.randomUUID();
      const task: Task = {
        id,
        title: title.trim() || "未命名",
        tag: tag.trim() || "未分类",
        icon: "🎯",
        description: "--",
        plannedMinutes: plannedMinutes ?? 25
      };
      await upsertTask(task);
      return id;
    },
    [tasks, upsertTask]
  );

  return (
    <TimerProvider settings={settings} onSave={upsertSession} onEnsureTask={ensureTask}>
      <main className="min-h-screen bg-page text-primary selection:bg-indigo-500/30">
        <header className="relative flex items-center justify-center gap-3 px-4 sm:px-8 py-4 sm:py-6">
          <nav className="w-full sm:w-auto flex items-center justify-center bg-card p-1 rounded-2xl shadow-xl">
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "stats"
                  ? "bg-surface-active text-primary"
                  : "text-muted hover:text-secondary"
              }`}
            >
              统计
            </button>
            <button
              onClick={() => setActiveTab("focus")}
              className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "focus"
                  ? "bg-surface-active text-primary"
                  : "text-muted hover:text-secondary"
              }`}
            >
              专注
            </button>
            <button
              onClick={() => setActiveTab("starjar")}
              className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "starjar"
                  ? "bg-surface-active text-primary"
                  : "text-muted hover:text-secondary"
              }`}
            >
              星星罐
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "settings"
                  ? "bg-surface-active text-primary"
                  : "text-muted hover:text-secondary"
              }`}
            >
              设置
            </button>
          </nav>

          <div className="absolute right-4 sm:right-8 flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 bg-card px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-secondary shadow-lg">
              <button
                onClick={() => shiftDate(-1)}
                className="text-muted hover:text-primary transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="hidden sm:inline">
                {format(selectedDate, "M月d日 EEEE", { locale: zhCN })}
              </span>
              <span className="sm:hidden">
                {format(selectedDate, "M月d日", { locale: zhCN })}
              </span>
              <button
                onClick={() => shiftDate(1)}
                className="text-muted hover:text-primary transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setCalendarOpen((o) => !o)}
                className={`grid h-10 w-10 place-items-center rounded-xl transition shadow-lg ${
                  calendarOpen
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-card text-muted hover:text-primary"
                }`}
                title="日历 · 每日专注"
              >
                <Calendar size={20} />
              </button>
              <CalendarPopover
                open={calendarOpen}
                sessions={sessions}
                selectedDate={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setDetailDate(d);
                }}
                onClose={() => setCalendarOpen(false)}
              />
            </div>
          </div>
        </header>

        {activeTab === "starjar" ? (
          <div className="mx-auto max-w-[600px] px-4 sm:px-8 pb-12">
            <StarJarPage
              entries={moodEntries}
              onUpsert={upsertMood}
              onDelete={removeMood}
            />
          </div>
        ) : (
          <div className="mx-auto grid max-w-[1400px] gap-6 sm:gap-8 px-4 sm:px-8 pb-12 lg:grid-cols-[1fr_400px]">
            <div className="space-y-8 sm:space-y-12">
              {activeTab === "focus" ? (
                  <>
                    <TimerPanel />
                    <StatsPanel
                      sessions={sessions}
                      selectedDate={selectedDate}
                      summaryOnly
                      onOpenFocusStats={() => setFocusStatsOpen(true)}
                      onOpenSessionHistory={() => setSessionHistoryOpen(true)}
                      moodTodayCount={moodEntries.filter((e) => e.date === new Date().toISOString().slice(0, 10)).length}
                      onOpenStarJar={() => setActiveTab("starjar")}
                    />
                  </>
              ) : activeTab === "settings" ? (
                <SettingsPanel
                  sessions={sessions}
                  settings={settings}
                  onUpdateSettings={updateSettings}
                  onClear={clear}
                  onRefresh={refreshSessions}
                  sync={sync}
                />
              ) : (
                <ScreenTimePanel sessions={sessions} selectedDate={selectedDate} />
              )}
            </div>

            <TaskSidebar
              tasks={tasks}
              onUpsertTask={upsertTask}
              onRemoveTask={removeTask}
            />
          </div>
        )}

        <DayDetailModal
          open={detailDate !== null}
          date={detailDate}
          sessions={sessions}
          tasks={tasks}
          onClose={() => setDetailDate(null)}
        />

        <FocusStatsModal
          open={focusStatsOpen}
          date={selectedDate}
          sessions={sessions}
          onClose={() => setFocusStatsOpen(false)}
        />

        <SessionHistoryModal
          open={sessionHistoryOpen}
          sessions={sessions}
          onClose={() => setSessionHistoryOpen(false)}
          onSaveSession={upsertSession}
        />
      </main>
    </TimerProvider>
  );
}

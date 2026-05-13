import { ChevronLeft, ChevronRight, LayoutGrid, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useCallback, useState } from "react";
import { TimerPanel } from "./components/TimerPanel";
import { StatsPanel } from "./components/StatsPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { TaskSidebar } from "./components/TaskSidebar";
import { ScreenTimePanel } from "./components/ScreenTimePanel";
import { SessionList } from "./components/SessionList";
import { CalendarPopover } from "./components/CalendarPopover";
import { DayDetailModal } from "./components/DayDetailModal";
import { useSessions } from "./hooks/useSessions";
import { useSettings } from "./hooks/useSettings";
import { useTasks } from "./hooks/useTasks";
import { TimerProvider } from "./contexts/TimerContext";
import { Task } from "./types";

export default function App() {
  const { sessions, upsert: upsertSession, remove: removeSession, clear, refresh } = useSessions();
  const { tasks, upsert: upsertTask, remove: removeTask } = useTasks();
  const { settings, update: updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"stats" | "focus" | "settings">("focus");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [historyView, setHistoryView] = useState(false);
  const [createTaskSignal, setCreateTaskSignal] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [detailDate, setDetailDate] = useState<Date | null>(null);

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
      <main className="min-h-screen bg-[#1a1a22] text-white selection:bg-indigo-500/30">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-6">
          <div className="order-1 flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setHistoryView((v) => !v)}
              className={`grid h-10 w-10 place-items-center rounded-xl transition shadow-lg ${
                historyView ? "bg-indigo-500/20 text-indigo-300" : "bg-[#22222b] text-gray-400 hover:text-white"
              }`}
              title="切换历史视图"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setCreateTaskSignal((s) => s + 1)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-[#22222b] text-gray-400 hover:text-white transition shadow-lg"
              title="新建任务"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="order-2 sm:order-3 flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 bg-[#22222b] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-300 shadow-lg">
              <button
                onClick={() => shiftDate(-1)}
                className="text-gray-500 hover:text-white transition"
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
                className="text-gray-500 hover:text-white transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setCalendarOpen((o) => !o)}
                className={`grid h-10 w-10 place-items-center rounded-xl transition shadow-lg ${
                  calendarOpen
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "bg-[#22222b] text-gray-400 hover:text-white"
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

          <nav className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-center bg-[#22222b] p-1 rounded-2xl shadow-xl">
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "stats" ? "bg-[#3d3d4d] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              屏幕使用时间
            </button>
            <button
              onClick={() => setActiveTab("focus")}
              className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "focus" ? "bg-[#3d3d4d] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              专注
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "settings" ? "bg-[#3d3d4d] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              设置
            </button>
          </nav>
        </header>

        <div className="mx-auto grid max-w-[1400px] gap-6 sm:gap-8 px-4 sm:px-8 pb-12 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8 sm:space-y-12">
            {activeTab === "focus" ? (
              historyView ? (
                <SessionList sessions={sessions} onRemove={removeSession} />
              ) : (
                <>
                  <TimerPanel />
                  <StatsPanel sessions={sessions} selectedDate={selectedDate} summaryOnly />
                </>
              )
            ) : activeTab === "settings" ? (
              <SettingsPanel
                sessions={sessions}
                settings={settings}
                onUpdateSettings={updateSettings}
                onClear={clear}
                onRefresh={refresh}
              />
            ) : (
              <ScreenTimePanel sessions={sessions} selectedDate={selectedDate} />
            )}
          </div>

          <TaskSidebar
            tasks={tasks}
            onUpsertTask={upsertTask}
            onRemoveTask={removeTask}
            openCreateSignal={createTaskSignal}
            onConsumedCreateSignal={() => {}}
          />
        </div>

        <DayDetailModal
          open={detailDate !== null}
          date={detailDate}
          sessions={sessions}
          tasks={tasks}
          onClose={() => setDetailDate(null)}
        />
      </main>
    </TimerProvider>
  );
}

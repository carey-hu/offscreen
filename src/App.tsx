import { ChevronLeft, ChevronRight, LayoutGrid, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useState } from "react";
import { TimerPanel } from "./components/TimerPanel";
import { StatsPanel } from "./components/StatsPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { TaskSidebar } from "./components/TaskSidebar";
import { ScreenTimePanel } from "./components/ScreenTimePanel";
import { SessionList } from "./components/SessionList";
import { CalendarPopover } from "./components/CalendarPopover";
import { useSessions } from "./hooks/useSessions";
import { useSettings } from "./hooks/useSettings";
import { TimerProvider } from "./contexts/TimerContext";

export default function App() {
  const { sessions, upsert, remove, clear, refresh } = useSessions();
  const { settings, update: updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"stats" | "focus" | "settings">("focus");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [historyView, setHistoryView] = useState(false);
  const [createTaskSignal, setCreateTaskSignal] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);

  function shiftDate(days: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  }

  return (
    <TimerProvider settings={settings} onSave={upsert}>
      <main className="min-h-screen bg-[#1a1a22] text-white selection:bg-indigo-500/30">
        <header className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
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

          <nav className="flex items-center bg-[#22222b] p-1 rounded-2xl shadow-xl">
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-2 text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "stats" ? "bg-[#3d3d4d] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              屏幕使用时间
            </button>
            <button
              onClick={() => setActiveTab("focus")}
              className={`px-6 py-2 text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "focus" ? "bg-[#3d3d4d] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              专注
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-2 text-sm font-bold rounded-[0.85rem] transition ${
                activeTab === "settings" ? "bg-[#3d3d4d] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              设置
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-[#22222b] px-4 py-2 rounded-xl text-sm font-bold text-gray-300 shadow-lg">
              <button
                onClick={() => shiftDate(-1)}
                className="text-gray-500 hover:text-white transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span>{format(selectedDate, "M月d日 EEEE", { locale: zhCN })}</span>
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
                onSelect={(d) => setSelectedDate(d)}
                onClose={() => setCalendarOpen(false)}
              />
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1400px] gap-8 px-8 pb-12 lg:grid-cols-[1fr_400px]">
          <div className="space-y-12">
            {activeTab === "focus" ? (
              historyView ? (
                <SessionList sessions={sessions} onRemove={remove} />
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
            openCreateSignal={createTaskSignal}
            onConsumedCreateSignal={() => {}}
          />
        </div>
      </main>
    </TimerProvider>
  );
}

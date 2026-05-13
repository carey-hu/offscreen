import { ChevronLeft, ChevronRight, LayoutGrid, Plus, Calendar, Smartphone } from "lucide-react";
import { TimerPanel } from "./components/TimerPanel";
import { StatsPanel } from "./components/StatsPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { TaskSidebar } from "./components/TaskSidebar";
import { useSessions } from "./hooks/useSessions";
import { useState } from "react";

export default function App() {
  const { sessions, loading, upsert, clear, refresh } = useSessions();
  const [activeTab, setActiveTab] = useState<"stats" | "focus" | "settings">("focus");

  return (
    <main className="min-h-screen bg-[#1a1a22] text-white selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4">
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-[#22222b] text-gray-400 hover:text-white transition shadow-lg">
            <LayoutGrid size={20} />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-[#22222b] text-gray-400 hover:text-white transition shadow-lg">
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
            <ChevronLeft size={16} className="text-gray-600 cursor-pointer" />
            <span>5月12日 周二</span>
            <ChevronRight size={16} className="text-gray-600 cursor-pointer" />
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-[#22222b] text-gray-400 hover:text-white transition shadow-lg">
            <Calendar size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto grid max-w-[1400px] gap-8 px-8 pb-12 lg:grid-cols-[1fr_400px]">
        {/* Left Side: Timer & Stats Summary */}
        <div className="space-y-12">
          {activeTab === "focus" ? (
            <>
              <TimerPanel onSave={upsert} />
              <StatsPanel sessions={sessions} summaryOnly />
            </>
          ) : activeTab === "settings" ? (
            <SettingsPanel sessions={sessions} onClear={clear} onRefresh={refresh} />
          ) : (
             <div className="offscreen-card h-[600px] flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest">
               Screen Time Analysis Placeholder
             </div>
          )}
        </div>

        {/* Right Side: Task Sidebar */}
        <TaskSidebar onTaskStart={(task) => {
          // Task start logic handled in TimerPanel by setting title/tag
          console.log("Starting task:", task.title);
        }} />
      </div>
    </main>
  );
}

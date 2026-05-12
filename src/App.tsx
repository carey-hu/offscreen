import { Github, TimerReset } from "lucide-react";
import { TimerPanel } from "./components/TimerPanel";
import { StatsPanel } from "./components/StatsPanel";
import { SessionList } from "./components/SessionList";
import { SettingsPanel } from "./components/SettingsPanel";
import { useSessions } from "./hooks/useSessions";

export default function App() {
  const { sessions, loading, upsert, remove, clear, refresh } = useSessions();

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-10">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-black shadow-2xl">
            <TimerReset size={26} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">OffScreen</h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Less Screen Time</p>
          </div>
        </div>

        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100 transition hover:bg-gray-100 sm:flex"
        >
          <Github size={18} />
          GitHub
        </a>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pb-12 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <TimerPanel onSave={upsert} />
          <SettingsPanel sessions={sessions} onClear={clear} onRefresh={refresh} />
        </div>

        <div className="space-y-8">
          {loading ? (
            <div className="offscreen-card text-center text-gray-500">
              正在加载本地数据...
            </div>
          ) : (
            <>
              <StatsPanel sessions={sessions} />
              <SessionList sessions={sessions} onRemove={remove} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

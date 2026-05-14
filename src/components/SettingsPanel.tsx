import { Bell, Check, Cloud, CloudOff, Download, Eraser, Loader2, Palette, RefreshCw, Smartphone, Timer, TriangleAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { FocusMode, FocusSession, UserSettings } from "../types";
import { isCloudSyncAvailable } from "../lib/cloudSync";
import type { SyncStatus } from "../hooks/useSync";

interface SyncState {
  status: SyncStatus;
  lastSyncAt: Date | null;
  error: string | null;
  syncNow: () => Promise<void>;
}

interface Props {
  sessions: FocusSession[];
  settings: UserSettings;
  onUpdateSettings: (patch: Partial<UserSettings>) => Promise<void> | void;
  onClear: () => Promise<void>;
  onRefresh: () => Promise<void>;
  sync: SyncState;
}

const MODE_LABELS: Record<FocusMode, string> = {
  pomodoro: "番茄钟",
  long: "长专注",
  countdown: "倒计时",
  stopwatch: "正计时"
};

export function SettingsPanel({
  sessions,
  settings,
  onUpdateSettings,
  onClear,
  sync
}: Props) {
  function exportJson() {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openfocus-sessions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function toggleNotifications() {
    if (settings.notificationEnabled) {
      await onUpdateSettings({ notificationEnabled: false });
      return;
    }
    if (typeof Notification === "undefined") {
      alert("当前浏览器不支持通知。");
      return;
    }
    const perm = await Notification.requestPermission();
    await onUpdateSettings({ notificationEnabled: perm === "granted" });
  }

  return (
    <div className="space-y-6">
      <section className="offscreen-card">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Preferences</p>
          <h3 className="mt-1 text-2xl font-black text-primary">专注偏好</h3>
        </div>

        <div className="grid gap-4">
          <label className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm font-bold text-secondary">
              <Timer size={16} />
              <span>默认模式</span>
            </div>
            <select
              value={settings.defaultMode}
              onChange={(e) => onUpdateSettings({ defaultMode: e.target.value as FocusMode })}
              className="rounded-xl bg-surface px-4 py-2 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {(Object.keys(MODE_LABELS) as FocusMode[]).map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </select>
          </label>

          <NumberPref
            label="番茄钟分钟"
            value={settings.pomodoroMinutes}
            onChange={(v) => onUpdateSettings({ pomodoroMinutes: v })}
          />
          <NumberPref
            label="长专注分钟"
            value={settings.longFocusMinutes}
            onChange={(v) => onUpdateSettings({ longFocusMinutes: v })}
          />
          <NumberPref
            label="短休息分钟"
            value={settings.shortBreakMinutes}
            onChange={(v) => onUpdateSettings({ shortBreakMinutes: v })}
          />

          <label className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm font-bold text-secondary">
              <Palette size={16} />
              <span>主题</span>
            </div>
            <select
              value={settings.theme}
              onChange={(e) =>
                onUpdateSettings({ theme: e.target.value as UserSettings["theme"] })
              }
              className="rounded-xl bg-surface px-4 py-2 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="system">跟随系统</option>
              <option value="dark">深色</option>
              <option value="light">浅色</option>
            </select>
          </label>

          <button
            onClick={toggleNotifications}
            className="flex items-center justify-between gap-4 text-left"
          >
            <div className="flex items-center gap-3 text-sm font-bold text-secondary">
              <Bell size={16} />
              <span>专注完成通知</span>
            </div>
            <span
              className={`rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest ${
                settings.notificationEnabled
                  ? "bg-indigo-500/30 text-indigo-400"
                  : "bg-surface text-muted"
              }`}
            >
              {settings.notificationEnabled ? "On" : "Off"}
            </span>
          </button>
        </div>
      </section>

      <section className="offscreen-card">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Data</p>
          <h3 className="mt-1 text-2xl font-black text-primary">数据与同步</h3>
        </div>

        <div className="grid gap-3">
          <button onClick={exportJson} className="settings-btn">
            <Download size={18} />
            <span>导出 JSON 数据</span>
          </button>

          <button
            onClick={() => {
              if (confirm("确定清空全部专注记录吗？此操作不可恢复。")) {
                onClear();
              }
            }}
            className="settings-btn group"
          >
            <Eraser size={18} className="text-red-500 group-hover:text-red-400" />
            <span className="text-red-500 group-hover:text-red-400">清空本地数据</span>
          </button>

          <SyncSection sync={sync} />

          <div className="settings-btn cursor-default">
            <Smartphone size={18} />
            <span>PWA 可添加到手机桌面</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function SyncSection({ sync }: { sync: SyncState }) {
  const available = isCloudSyncAvailable();

  if (!available) {
    return (
      <div className="settings-btn cursor-default">
        <CloudOff size={18} className="text-muted" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-secondary">云同步未配置</div>
          <div className="text-[11px] font-medium text-faint mt-0.5">
            填写 .env 里的 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_USER_ID 并重启 dev
          </div>
        </div>
      </div>
    );
  }

  const { status, lastSyncAt, error, syncNow } = sync;

  const icon =
    status === "syncing" ? <Loader2 size={18} className="animate-spin text-indigo-400" /> :
    status === "error"   ? <TriangleAlert size={18} className="text-red-500" /> :
    status === "offline" ? <CloudOff size={18} className="text-muted" /> :
                           <Cloud size={18} className="text-emerald-500" />;

  const statusLabel =
    status === "syncing" ? "同步中…" :
    status === "error"   ? "同步失败" :
    status === "offline" ? "未配置" :
    lastSyncAt           ? `上次同步 ${formatDistanceToNow(lastSyncAt, { locale: zhCN, addSuffix: true })}` :
                           "尚未同步";

  return (
    <div className="rounded-[1.5rem] px-5 py-4" style={{ background: "var(--bg-surface)" }}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-secondary">云同步</div>
          <div className="text-[11px] font-medium text-faint mt-0.5 truncate">
            {statusLabel}
          </div>
        </div>
        <button
          onClick={() => { syncNow(); }}
          disabled={status === "syncing"}
          className="grid h-9 w-9 place-items-center rounded-full bg-card text-secondary hover:text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="立即同步"
        >
          {status === "idle" && lastSyncAt ? <Check size={14} /> : <RefreshCw size={14} />}
        </button>
      </div>
      {status === "error" && error && (
        <div className="mt-3 rounded-xl bg-red-500/10 p-2.5 text-[11px] font-medium text-red-500 break-words">
          {error}
        </div>
      )}
    </div>
  );
}

function NumberPref({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm font-bold text-secondary">{label}</span>
      <input
        type="number"
        min={1}
        max={240}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="w-24 rounded-xl bg-surface px-4 py-2 text-right text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </label>
  );
}

import { Bell, Cloud, Download, Eraser, Palette, Smartphone, Timer } from "lucide-react";
import { FocusMode, FocusSession, UserSettings } from "../types";
import { isCloudSyncAvailable, pullCloudSessions, pushLocalSessionsToCloud } from "../lib/cloudSync";

interface Props {
  sessions: FocusSession[];
  settings: UserSettings;
  onUpdateSettings: (patch: Partial<UserSettings>) => Promise<void> | void;
  onClear: () => Promise<void>;
  onRefresh: () => Promise<void>;
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
  onRefresh
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

  async function demoSync() {
    const userId = prompt("输入测试 user_id。正式版应替换为登录用户 ID。");
    if (!userId) return;

    await pushLocalSessionsToCloud(userId);
    await pullCloudSessions(userId);
    await onRefresh();
    alert("同步完成。");
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
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Preferences</p>
          <h3 className="mt-1 text-2xl font-black text-white">专注偏好</h3>
        </div>

        <div className="grid gap-4">
          <label className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
              <Timer size={16} />
              <span>默认模式</span>
            </div>
            <select
              value={settings.defaultMode}
              onChange={(e) => onUpdateSettings({ defaultMode: e.target.value as FocusMode })}
              className="rounded-xl bg-[#2a2a35] px-4 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-400"
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
            <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
              <Palette size={16} />
              <span>主题</span>
            </div>
            <select
              value={settings.theme}
              onChange={(e) =>
                onUpdateSettings({ theme: e.target.value as UserSettings["theme"] })
              }
              className="rounded-xl bg-[#2a2a35] px-4 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-400"
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
            <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
              <Bell size={16} />
              <span>专注完成通知</span>
            </div>
            <span
              className={`rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest ${
                settings.notificationEnabled
                  ? "bg-indigo-500/30 text-indigo-300"
                  : "bg-[#2a2a35] text-gray-500"
              }`}
            >
              {settings.notificationEnabled ? "On" : "Off"}
            </span>
          </button>
        </div>
      </section>

      <section className="offscreen-card">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Data</p>
          <h3 className="mt-1 text-2xl font-black text-white">数据与同步</h3>
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

          <button
            onClick={demoSync}
            disabled={!isCloudSyncAvailable()}
            className="settings-btn disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Cloud size={18} />
            <span>Supabase 云同步测试</span>
          </button>

          <div className="settings-btn cursor-default">
            <Smartphone size={18} />
            <span>PWA 可添加到手机桌面</span>
          </div>
        </div>

        {!isCloudSyncAvailable() ? (
          <div className="mt-6 rounded-[1.25rem] bg-gray-800/50 p-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 leading-relaxed">
            Cloud sync requires Supabase configuration.
          </div>
        ) : null}
      </section>
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
      <span className="text-sm font-bold text-gray-300">{label}</span>
      <input
        type="number"
        min={1}
        max={240}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="w-24 rounded-xl bg-[#2a2a35] px-4 py-2 text-right text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </label>
  );
}

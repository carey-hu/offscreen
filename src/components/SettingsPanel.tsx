import { Cloud, Download, Eraser, Smartphone } from "lucide-react";
import { FocusSession } from "../types";
import { isCloudSyncAvailable, pullCloudSessions, pushLocalSessionsToCloud } from "../lib/cloudSync";

interface Props {
  sessions: FocusSession[];
  onClear: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function SettingsPanel({ sessions, onClear, onRefresh }: Props) {
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

  return (
    <section className="offscreen-card">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Settings</p>
        <h3 className="mt-1 text-2xl font-black text-white">设置与数据</h3>
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
  );
}

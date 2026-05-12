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
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h3 className="text-lg font-semibold text-gray-900">设置与数据</h3>
      <p className="mt-1 text-sm text-gray-500">
        第一版以本地优先为主，后续可接入登录与云同步。
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button onClick={exportJson} className="settings-btn">
          <Download size={18} />
          导出 JSON 数据
        </button>

        <button
          onClick={() => {
            if (confirm("确定清空全部专注记录吗？此操作不可恢复。")) {
              onClear();
            }
          }}
          className="settings-btn text-red-600"
        >
          <Eraser size={18} />
          清空本地数据
        </button>

        <button
          onClick={demoSync}
          disabled={!isCloudSyncAvailable()}
          className="settings-btn disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Cloud size={18} />
          Supabase 云同步测试
        </button>

        <div className="settings-btn cursor-default">
          <Smartphone size={18} />
          PWA 可添加到手机桌面
        </div>
      </div>

      {!isCloudSyncAvailable() ? (
        <div className="mt-4 rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
          当前未配置 Supabase 环境变量，云同步按钮已禁用。复制 .env.example 为 .env 后填写密钥即可测试。
        </div>
      ) : null}
    </section>
  );
}

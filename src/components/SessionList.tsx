import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { FocusSession } from "../types";

interface Props {
  sessions: FocusSession[];
  onRemove: (id: string) => Promise<void>;
}

const statusText = {
  running: "进行中",
  paused: "已暂停",
  completed: "已完成",
  abandoned: "已放弃"
};

export function SessionList({ sessions, onRemove }: Props) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">专注记录</h3>
          <p className="text-sm text-gray-500">本地 IndexedDB 保存，后续可扩展云同步</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
          暂无记录。先完成一次专注吧。
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sessions.slice(0, 20).map((session) => (
            <div key={session.id} className="flex items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-gray-900">{session.title}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{session.tag}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      session.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {statusText[session.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {format(new Date(session.startTime), "yyyy-MM-dd HH:mm")} · 实际 {session.actualMinutes} 分钟 · 计划 {session.plannedMinutes || "不限"} 分钟
                </p>
              </div>

              <button
                onClick={() => onRemove(session.id)}
                className="rounded-2xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label="删除记录"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

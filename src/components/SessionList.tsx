import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { FocusSession } from "../types";

interface Props {
  sessions: FocusSession[];
  onRemove: (id: string) => Promise<void>;
}

export function SessionList({ sessions, onRemove }: Props) {
  return (
    <section className="offscreen-card">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">History</p>
        <h3 className="mt-1 text-2xl font-black text-primary">专注历史</h3>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-[1.5rem] bg-surface p-8 text-center text-sm font-semibold text-muted">
          暂无记录。先完成一次专注吧。
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.slice(0, 20).map((session, index) => (
            <div key={session.id} className="relative flex gap-6">
              {index !== sessions.slice(0, 20).length - 1 && (
                <div className="absolute left-3 top-8 h-full w-[2px] bg-surface" />
              )}

              <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface">
                <div
                  className={`h-2 w-2 rounded-full ${
                    session.status === "completed" ? "bg-indigo-400" : "bg-red-500"
                  }`}
                />
              </div>

              <div className="flex flex-1 items-center justify-between gap-4 pb-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-bold text-primary">{session.title}</p>
                    <span className="rounded-lg bg-surface px-2 py-1 text-[10px] font-black uppercase text-muted">
                      {session.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                    {format(new Date(session.startTime), "HH:mm")} · {session.actualMinutes}m ·{" "}
                    {session.mode}
                  </p>
                </div>

                <button
                  onClick={() => onRemove(session.id)}
                  className="rounded-xl p-2 text-faint transition hover:bg-red-500/10 hover:text-red-500"
                  aria-label="删除记录"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

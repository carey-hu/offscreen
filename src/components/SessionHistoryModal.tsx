import { useState } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { FileText, X } from "lucide-react";
import { FocusSession } from "../types";
import { tagColor } from "../lib/colors";

interface Props {
  open: boolean;
  sessions: FocusSession[];
  onClose: () => void;
  onSaveSession: (session: FocusSession) => Promise<void>;
}

export function SessionHistoryModal({ open, sessions, onClose, onSaveSession }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  if (!open) return null;

  const completed = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  function openEditor(session: FocusSession) {
    setEditingId(session.id);
    setNoteText(session.note ?? "");
  }

  async function saveNote(session: FocusSession) {
    const updated: FocusSession = { ...session, note: noteText.trim() || undefined };
    await onSaveSession(updated);
    setEditingId(null);
    setNoteText("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-[2rem] bg-card p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Session History
            </p>
            <h3 className="mt-1 text-xl sm:text-2xl font-black text-primary">
              专注记录
            </h3>
            <p className="mt-0.5 text-xs font-bold text-muted">
              共 {completed.length} 次完成 · 点击记录可写笔记
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted hover:text-primary shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {completed.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-4">📝</p>
              <p className="text-sm font-bold text-muted">暂无完成记录</p>
              <p className="mt-1 text-xs text-faint">完成一次专注后这里会显示记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completed.map((session) => {
                const accent = tagColor(session.tag);
                const isEditing = editingId === session.id;
                const hasNote = Boolean(session.note);
                const sessionDate = parseISO(session.startTime);

                return (
                  <div
                    key={session.id}
                    className="rounded-2xl bg-page overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        isEditing ? saveNote(session) : openEditor(session)
                      }
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-surface/50 transition"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: accent }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary truncate">
                            {session.title}
                          </span>
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase shrink-0"
                            style={{
                              background: `${accent}33`,
                              color: accent
                            }}
                          >
                            {session.tag}
                          </span>
                          {hasNote && (
                            <FileText size={12} className="text-indigo-400 shrink-0" />
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] font-semibold text-muted">
                          {format(sessionDate, "M月d日 HH:mm", { locale: zhCN })} · {session.actualMinutes}分钟
                        </p>
                      </div>
                      <span className="text-sm font-black text-secondary tabular-nums shrink-0">
                        {session.actualMinutes}m
                      </span>
                    </button>

                    {isEditing && (
                      <div className="px-4 pb-4 pt-0 border-t border-subtle mx-4">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="这段时间做了什么？学到了什么？…"
                          rows={3}
                          autoFocus
                          className="mt-3 w-full rounded-xl bg-surface px-3 py-2 text-sm leading-relaxed text-primary outline-none resize-y focus:ring-2 focus:ring-indigo-400"
                        />
                        <div className="mt-2 flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setNoteText("");
                            }}
                            className="rounded-full px-4 py-1.5 text-xs font-bold text-muted hover:text-primary transition"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => saveNote(session)}
                            className="rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-400 transition"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    )}

                    {!isEditing && hasNote && (
                      <div className="px-4 pb-3 mx-4">
                        <p className="text-xs leading-relaxed text-muted pl-5 border-l-2 border-subtle whitespace-pre-wrap break-words line-clamp-2">
                          {session.note}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

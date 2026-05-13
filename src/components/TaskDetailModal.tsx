import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Task, TaskNote } from "../types";
import { useTaskNotes } from "../hooks/useTaskNotes";

interface Props {
  open: boolean;
  task: Task | null;
  onClose: () => void;
}

export function TaskDetailModal({ open, task, onClose }: Props) {
  const { notes, upsert, remove } = useTaskNotes(open && task ? task.id : null);
  const [content, setContent] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (open) {
      setContent("");
      setDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [open, task?.id]);

  if (!open || !task) return null;

  async function handleAdd() {
    if (!task) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const note: TaskNote = {
      id: crypto.randomUUID(),
      taskId: task.id,
      date,
      content: trimmed,
      createdAt: now,
      updatedAt: now
    };
    await upsert(note);
    setContent("");
  }

  // Group notes by date
  const grouped = notes.reduce<Record<string, TaskNote[]>>((acc, n) => {
    (acc[n.date] = acc[n.date] ?? []).push(n);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-[2rem] bg-[#22222b] p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#2a2a35] text-2xl shrink-0">
              {task.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Task notes
              </p>
              <h3 className="mt-0.5 text-xl font-black text-white truncate">{task.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#2a2a35] text-gray-400 hover:text-white shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Add new note */}
        <div className="rounded-2xl bg-[#1a1a22] p-4 mb-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl bg-[#2a2a35] px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              记录今日做了什么
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天的进展、收获、卡点... 可换行"
            rows={5}
            className="w-full min-h-[120px] rounded-xl bg-[#2a2a35] p-3 text-sm leading-relaxed text-white outline-none resize-y focus:ring-2 focus:ring-indigo-400"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              className="btn-primary !bg-white !text-black !px-6 !py-2 !text-sm disabled:opacity-40"
            >
              添加
            </button>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
          {dates.length === 0 ? (
            <div className="rounded-2xl bg-[#1a1a22] p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-600">
              暂无记录
            </div>
          ) : (
            dates.map((d) => (
              <div key={d}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">
                  {format(parseISO(d), "M月d日 EEEE", { locale: zhCN })}
                </p>
                <div className="space-y-2">
                  {grouped[d].map((note) => (
                    <div
                      key={note.id}
                      className="group flex items-start gap-3 rounded-2xl bg-[#1a1a22] p-4"
                    >
                      <p className="flex-1 text-sm leading-relaxed text-gray-200 whitespace-pre-wrap break-words">
                        {note.content}
                      </p>
                      <button
                        onClick={() => remove(note.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition shrink-0 mt-0.5"
                        aria-label="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

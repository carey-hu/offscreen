import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Task } from "../types";

interface Props {
  open: boolean;
  initial?: Task | null;
  onClose: () => void;
  onSave: (task: Task) => Promise<void> | void;
}

const EMOJI_PRESETS = ["🧘", "🎓", "💌", "💯", "❤️", "🍦", "📚", "✏️", "💼", "☕", "🎨", "🏃"];

export function TaskModal({ open, initial, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [icon, setIcon] = useState("✏️");
  const [description, setDescription] = useState("");
  const [plannedMinutes, setPlannedMinutes] = useState<number>(25);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setTag(initial?.tag ?? "");
      setIcon(initial?.icon ?? "✏️");
      setDescription(initial?.description ?? "--");
      setPlannedMinutes(initial?.plannedMinutes ?? 25);
    }
  }, [open, initial]);

  if (!open) return null;

  const isEdit = Boolean(initial);

  async function handleSave() {
    if (!title.trim()) return;
    const task: Task = {
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim(),
      icon,
      description: description || "--",
      tag: tag.trim() || "未分类",
      plannedMinutes
    };
    await onSave(task);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[2rem] bg-card p-6 sm:p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              {isEdit ? "Edit task" : "New task"}
            </p>
            <h3 className="mt-1 text-2xl font-black text-primary">
              {isEdit ? "编辑任务" : "新建任务"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              图标
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`grid h-10 w-10 place-items-center rounded-xl text-xl transition ${
                    icon === e
                      ? "bg-indigo-500/30 ring-2 ring-indigo-400"
                      : "bg-surface hover:bg-surface-hover"
                  }`}
                >
                  {e}
                </button>
              ))}
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 4))}
                className="h-10 w-16 rounded-xl bg-surface px-2 text-center text-xl outline-none focus:ring-2 focus:ring-indigo-400 text-primary"
                placeholder="自定义"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              标题
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-surface px-4 py-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="例如:阅读"
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                标签
              </span>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-surface px-4 py-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="工作 / 学习"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                计划分钟
              </span>
              <input
                type="number"
                min={1}
                max={600}
                value={plannedMinutes}
                onChange={(e) => setPlannedMinutes(Math.max(1, Number(e.target.value) || 25))}
                className="mt-2 w-full rounded-2xl bg-surface px-4 py-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              备注
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-surface px-4 py-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="--"
            />
          </label>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            取消
          </button>
          <button onClick={handleSave} className="btn-primary flex-1">
            {isEdit ? "保存" : "新建"}
          </button>
        </div>
      </div>
    </div>
  );
}

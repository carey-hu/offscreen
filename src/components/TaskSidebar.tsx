import { Info, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Task } from "../types";
import { useTimer } from "../contexts/TimerContext";
import { TaskModal } from "./TaskModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { tagColor } from "../lib/colors";

interface Props {
  tasks: Task[];
  onUpsertTask: (task: Task) => Promise<void> | void;
  onRemoveTask: (id: string) => Promise<void> | void;
  openCreateSignal?: number;
  onConsumedCreateSignal?: () => void;
}

export function TaskSidebar({
  tasks,
  onUpsertTask,
  onRemoveTask,
  openCreateSignal,
  onConsumedCreateSignal
}: Props) {
  const timer = useTimer();

  const [editing, setEditing] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  useEffect(() => {
    if (openCreateSignal) {
      setEditing(null);
      setModalOpen(true);
      onConsumedCreateSignal?.();
    }
  }, [openCreateSignal, onConsumedCreateSignal]);

  function startTask(task: Task) {
    timer.start({
      taskId: task.id,
      title: task.title,
      tag: task.tag,
      minutes: task.plannedMinutes ?? 25
    });
  }

  return (
    <>
      <aside className="space-y-4 lg:h-[calc(100vh-140px)] lg:overflow-y-auto no-scrollbar pb-6 lg:pb-12">
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-subtle py-4 text-sm font-bold text-muted hover:text-primary hover:border-muted transition"
        >
          <Plus size={16} />
          <span>新任务</span>
        </button>

        {tasks.length === 0 && (
          <div className="text-center text-xs font-bold uppercase tracking-widest text-faint mt-8 lg:mt-12">
            暂无任务 · 点击上方新建,或直接开始专注会自动创建
          </div>
        )}

        {tasks.map((task) => {
          const accent = tagColor(task.tag);
          const isActive = timer.taskId === task.id && timer.running;
          return (
            <div
              key={task.id}
              className={`group relative flex items-center justify-between gap-3 rounded-[2rem] bg-card p-4 sm:p-5 shadow-soft transition-transform hover:scale-[1.01] overflow-hidden ${
                isActive ? "ring-2 ring-indigo-400/60" : "ring-1 ring-subtle"
              }`}
            >
              <span
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: accent }}
              />
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div
                  className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full text-xl sm:text-2xl shrink-0"
                  style={{ background: `${accent}22` }}
                >
                  {task.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-black text-primary truncate">
                      {task.title}
                    </h4>
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase"
                      style={{ background: `${accent}33`, color: accent }}
                    >
                      {task.tag}
                    </span>
                    <span className="text-[10px] font-black text-faint tracking-widest">
                      {task.plannedMinutes ? `${task.plannedMinutes}m` : "--"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  onClick={() => setDetailTask(task)}
                  className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-primary transition lg:opacity-0 lg:group-hover:opacity-100"
                  aria-label="详情"
                  title="详情 · 今日记录"
                >
                  <Info size={14} />
                </button>
                <button
                  onClick={() => {
                    setEditing(task);
                    setModalOpen(true);
                  }}
                  className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-primary transition lg:opacity-0 lg:group-hover:opacity-100"
                  aria-label="编辑"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`删除任务"${task.title}"?`)) onRemoveTask(task.id);
                  }}
                  className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full text-muted hover:bg-red-500/15 hover:text-red-500 transition lg:opacity-0 lg:group-hover:opacity-100"
                  aria-label="删除"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => startTask(task)}
                  disabled={timer.running}
                  className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-surface text-muted transition-all hover:bg-surface-hover active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: timer.running ? undefined : accent }}
                >
                  <Play size={18} fill="currentColor" />
                </button>
              </div>
            </div>
          );
        })}
      </aside>

      <TaskModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={onUpsertTask}
      />

      <TaskDetailModal
        open={detailTask !== null}
        task={detailTask}
        onClose={() => setDetailTask(null)}
      />
    </>
  );
}

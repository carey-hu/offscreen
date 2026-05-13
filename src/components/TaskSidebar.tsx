import { Info, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Task } from "../types";
import { useTasks } from "../hooks/useTasks";
import { useTimer } from "../contexts/TimerContext";
import { TaskModal } from "./TaskModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { tagColor } from "../lib/colors";

interface Props {
  openCreateSignal?: number;
  onConsumedCreateSignal?: () => void;
}

export function TaskSidebar({ openCreateSignal, onConsumedCreateSignal }: Props) {
  const { tasks, upsert, remove } = useTasks();
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
      title: task.title,
      tag: task.tag,
      minutes: task.plannedMinutes ?? 25
    });
  }

  return (
    <>
      <aside className="space-y-4 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar pb-12">
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-gray-700 py-4 text-sm font-bold text-gray-500 hover:text-white hover:border-gray-500 transition"
        >
          <Plus size={16} />
          <span>新任务</span>
        </button>

        {tasks.length === 0 && (
          <div className="text-center text-xs font-bold uppercase tracking-widest text-gray-600 mt-12">
            暂无任务 · 点击上方新建
          </div>
        )}

        {tasks.map((task) => {
          const accent = tagColor(task.tag);
          return (
            <div
              key={task.id}
              className="group relative flex items-center justify-between gap-3 rounded-[2rem] bg-[#22222b] p-5 transition-all hover:bg-[#2a2a35] hover:scale-[1.02] shadow-xl overflow-hidden"
            >
              <span
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: accent }}
              />
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="grid h-14 w-14 place-items-center rounded-full text-2xl shadow-inner shrink-0"
                  style={{ background: `${accent}22` }}
                >
                  {task.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-gray-200 truncate">{task.title}</h4>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase"
                      style={{ background: `${accent}33`, color: accent }}
                    >
                      {task.tag}
                    </span>
                    <span className="text-[10px] font-black text-gray-600 tracking-widest">
                      {task.plannedMinutes ? `${task.plannedMinutes}m` : "--"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setDetailTask(task)}
                  className="opacity-0 group-hover:opacity-100 grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-[#353545] hover:text-white transition"
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
                  className="opacity-0 group-hover:opacity-100 grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-[#353545] hover:text-white transition"
                  aria-label="编辑"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`删除任务"${task.title}"?`)) remove(task.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition"
                  aria-label="删除"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => startTask(task)}
                  disabled={timer.running}
                  className="grid h-11 w-11 place-items-center rounded-full bg-[#2a2a35] text-gray-500 transition-all hover:bg-[#3d3d4d] active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
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
        onSave={upsert}
      />

      <TaskDetailModal
        open={detailTask !== null}
        task={detailTask}
        onClose={() => setDetailTask(null)}
      />
    </>
  );
}

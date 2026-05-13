import { Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Task } from "../types";
import { useTasks } from "../hooks/useTasks";
import { useTimer } from "../contexts/TimerContext";
import { TaskModal } from "./TaskModal";

interface Props {
  openCreateSignal?: number;
  onConsumedCreateSignal?: () => void;
}

export function TaskSidebar({ openCreateSignal, onConsumedCreateSignal }: Props) {
  const { tasks, upsert, remove } = useTasks();
  const timer = useTimer();

  const [editing, setEditing] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
            暂无任务
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center justify-between gap-4 rounded-[2rem] bg-[#22222b] p-6 transition-all hover:bg-[#2a2a35] hover:scale-[1.02] shadow-xl"
          >
            <div className="flex items-center gap-5 min-w-0">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#2a2a35] text-3xl shadow-inner group-hover:bg-[#353545] transition shrink-0">
                {task.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-black text-gray-200 truncate">{task.title}</h4>
                  <span className="rounded-md bg-gray-800 px-1.5 py-0.5 text-[9px] font-black uppercase text-gray-400">
                    {task.tag}
                  </span>
                </div>
                <p className="mt-1 text-sm font-black text-gray-600 tracking-widest">
                  {task.plannedMinutes ? `${task.plannedMinutes}m` : task.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
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
                className="grid h-12 w-12 place-items-center rounded-full bg-[#2a2a35] text-gray-500 transition-all hover:bg-[#3d3d4d] hover:text-[#8a8aff] active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Play size={20} fill="currentColor" />
              </button>
            </div>
          </div>
        ))}
      </aside>

      <TaskModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={upsert}
      />
    </>
  );
}

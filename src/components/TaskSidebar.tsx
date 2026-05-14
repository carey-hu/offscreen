import { Info, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Task } from "../types";
import { useTimer } from "../contexts/TimerContext";
import { TaskModal } from "./TaskModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { taskColor } from "../lib/colors";

interface Props {
  tasks: Task[];
  onUpsertTask: (task: Task) => Promise<void> | void;
  onRemoveTask: (id: string) => Promise<void> | void;
}

export function TaskSidebar({
  tasks,
  onUpsertTask,
  onRemoveTask,
}: Props) {
  const timer = useTimer();

  const [editing, setEditing] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

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
      <aside className="space-y-3 lg:h-[calc(100vh-140px)] lg:overflow-y-auto no-scrollbar pb-6 lg:pb-12">
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-subtle py-4 text-sm font-semibold text-secondary hover:text-primary hover:border-muted transition"
        >
          <Plus size={16} />
          <span>新任务</span>
        </button>

        {tasks.length === 0 && (
          <div className="text-center text-xs font-medium tracking-wide text-faint mt-8 lg:mt-12">
            暂无任务 · 点击上方新建,或直接开始专注会自动创建
          </div>
        )}

        {tasks.map((task) => {
          const accent = taskColor(task.id);
          const isActive = timer.taskId === task.id && timer.running;
          return (
            <div
              key={task.id}
              className={`group relative flex items-center justify-between gap-3 rounded-[1.75rem] bg-card p-4 sm:p-5 transition-all duration-200 hover:scale-[1.01] overflow-hidden ${
                isActive ? "ring-2" : "ring-1 ring-subtle"
              }`}
              style={isActive ? { boxShadow: `inset 0 0 0 2px ${accent}` } : undefined}
            >
              {/* Left accent stripe */}
              <span
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: accent }}
              />

              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pl-1">
                <div
                  className="grid h-12 w-12 sm:h-[52px] sm:w-[52px] place-items-center rounded-2xl text-xl sm:text-[22px] shrink-0"
                  style={{
                    background: `${accent}1F`,
                    boxShadow: `inset 0 0 0 1px ${accent}33`
                  }}
                >
                  {task.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[15px] sm:text-base font-semibold text-primary truncate tracking-tight">
                    {task.title}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[11px] font-medium tracking-normal"
                      style={{
                        background: `${accent}1A`,
                        color: accent
                      }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: accent }}
                      />
                      {task.tag}
                    </span>
                    {task.plannedMinutes ? (
                      <span className="text-[11px] font-medium text-faint tabular-nums">
                        {task.plannedMinutes} 分钟
                      </span>
                    ) : null}
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
                  className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: timer.running ? undefined : accent,
                    color: timer.running ? undefined : "#fff",
                    boxShadow: timer.running ? undefined : `0 4px 12px ${accent}40`
                  }}
                  aria-label="开始"
                >
                  <Play size={16} fill="currentColor" />
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

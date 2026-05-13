import { Play } from "lucide-react";
import { Task } from "../types";

const DEFAULT_TASKS: Task[] = [
  { id: "1", title: "模考复盘", icon: "🧘", description: "--", tag: "学习" },
  { id: "2", title: "模考送小黄上岸", icon: "🎓", description: "--", tag: "考试" },
  { id: "3", title: "申论带来好消息", icon: "💌", description: "--", tag: "写作" },
  { id: "4", title: "数量", icon: "💯", description: "--", tag: "练习" },
  { id: "5", title: "fulltime 认知·思维", icon: "❤️", description: "--", tag: "工作" },
  { id: "6", title: "full time 注册会计", icon: "🍦", description: "--", tag: "专业" },
];

interface Props {
  onTaskStart: (task: Task) => void;
}

export function TaskSidebar({ onTaskStart }: Props) {
  return (
    <aside className="space-y-4 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar pb-12">
      {DEFAULT_TASKS.map((task) => (
        <div
          key={task.id}
          className="group flex items-center justify-between gap-4 rounded-[2rem] bg-[#22222b] p-6 transition-all hover:bg-[#2a2a35] hover:scale-[1.02] shadow-xl"
        >
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#2a2a35] text-3xl shadow-inner group-hover:bg-[#353545] transition">
              {task.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-gray-200">{task.title}</h4>
                <div className="h-4 w-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                   <div className="h-1 w-1 rounded-full bg-gray-500" />
                </div>
              </div>
              <p className="mt-1 text-sm font-black text-gray-600 tracking-widest">{task.description}</p>
            </div>
          </div>

          <button
            onClick={() => onTaskStart(task)}
            className="grid h-12 w-12 place-items-center rounded-full bg-[#2a2a35] text-gray-500 transition-all hover:bg-[#3d3d4d] hover:text-[#8a8aff] active:scale-90"
          >
            <Play size={20} fill="currentColor" />
          </button>
        </div>
      ))}
    </aside>
  );
}

import { FocusSession } from "../types";
import { todaySessions, totalMinutes } from "../lib/stats";
import { Clock } from "lucide-react";

interface Props {
  sessions: FocusSession[];
  summaryOnly?: boolean;
}

export function StatsPanel({ sessions, summaryOnly }: Props) {
  const today = todaySessions(sessions);
  const totalMin = totalMinutes(today);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  if (summaryOnly) {
    return (
      <div className="grid grid-cols-3 gap-6">
        <div className="offscreen-card relative overflow-hidden h-44">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">专注时长</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">{hours > 0 ? `${hours}小时` : ""}{mins}分钟</span>
          </div>
          <p className="mt-1 text-[10px] font-black text-gray-600 uppercase tracking-widest">专注</p>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 opacity-20 text-indigo-400 rotate-12">
             <LotusIcon />
          </div>
        </div>

        <div className="offscreen-card relative overflow-hidden h-44">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">最新动态</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">13分钟</span>
          </div>
          <p className="mt-1 text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1">
            最新动态 <Clock size={10} className="fill-gray-600" />
          </p>
          <div className="absolute -bottom-2 -right-2 h-20 w-20 opacity-30 text-indigo-300">
             <div className="relative h-full w-full">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-400/30" />
                <div className="absolute top-1/2 left-1/2 h-1/2 w-1 bg-indigo-400/50 -translate-x-1/2 -translate-y-full rounded-full origin-bottom rotate-45" />
             </div>
          </div>
        </div>

        <div className="offscreen-card relative overflow-hidden h-44">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">失败次数</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">
              {sessions.filter(s => s.status === 'abandoned').length}次
            </span>
          </div>
          <p className="mt-1 text-[10px] font-black text-gray-600 uppercase tracking-widest">失败次数</p>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 opacity-20 flex items-center justify-center text-6xl grayscale">
             😵
          </div>
        </div>
      </div>
    );
  }

  // Original full stats view omitted for brevity, but could be kept if needed
  return null;
}

function LotusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,21C10.5,18.5 4,16 4,11C4,7.5 7,6 8,6C8.5,6 9,6.5 9.5,7C10.5,8 11.5,10 12,12C12.5,10 13.5,8 14.5,7C15,6.5 15.5,6 16,6C17,6 20,7.5 20,11C20,16 13.5,18.5 12,21Z" />
    </svg>
  );
}

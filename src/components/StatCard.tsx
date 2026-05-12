import { ReactNode } from "react";

interface Props {
  title: string;
  value: string;
  icon?: ReactNode;
  hint?: string;
}

export function StatCard({ title, value, icon, hint }: Props) {
  return (
    <div className="offscreen-card">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{title}</p>
        {icon ? <div className="text-gray-600">{icon}</div> : null}
      </div>
      <div className="text-4xl font-black tracking-tighter text-white">{value}</div>
      {hint ? <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-600">{hint}</p> : null}
    </div>
  );
}

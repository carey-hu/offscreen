import { ReactNode } from "react";

interface Props {
  title: string;
  value: string;
  icon?: ReactNode;
  hint?: string;
}

export function StatCard({ title, value, icon, hint }: Props) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        {icon ? <div className="text-gray-400">{icon}</div> : null}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-gray-900">{value}</div>
      {hint ? <p className="mt-2 text-sm text-gray-500">{hint}</p> : null}
    </div>
  );
}

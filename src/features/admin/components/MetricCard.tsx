import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/90 p-4 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#18352d] text-base text-white">
          {icon}
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-500">{hint}</p>
    </div>
  );
}

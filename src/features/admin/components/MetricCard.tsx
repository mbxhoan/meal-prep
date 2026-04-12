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
    <div className="rounded-[20px] border border-white/60 bg-white/90 p-3.5 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#18352d] text-sm text-white">
          {icon}
        </div>
      </div>
      <p className="text-[13px] leading-5 text-slate-500">{hint}</p>
    </div>
  );
}

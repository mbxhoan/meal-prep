import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-base font-semibold tracking-tight text-slate-900 md:text-[18px]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-500">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

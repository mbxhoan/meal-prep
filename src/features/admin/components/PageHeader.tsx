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
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 px-5 py-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur md:flex-row md:items-end md:justify-between md:px-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#51724f]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 md:text-[20px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

import { FaArrowRight } from "react-icons/fa6";

export function GuidedWorkflowCard({
  eyebrow,
  title,
  description,
  steps,
}: {
  eyebrow: string;
  title: string;
  description: string;
  steps: string[];
}) {
  return (
    <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-1 max-w-3xl text-[13px] leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-[#18352d] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                Bước {index + 1}
              </span>
              <FaArrowRight className="text-xs text-slate-400" />
            </div>
            <p className="mt-2 text-[13px] leading-5 text-slate-700">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

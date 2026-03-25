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
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-[#18352d] px-2.5 py-1 text-xs font-semibold text-white">
                Bước {index + 1}
              </span>
              <FaArrowRight className="text-sm text-slate-400" />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

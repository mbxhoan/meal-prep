import { FaCircleInfo, FaTriangleExclamation } from "react-icons/fa6";

type GuardrailTone = "info" | "warning";

export function GuardrailChecklist({
  title,
  note,
  items,
  tone = "info",
}: {
  title: string;
  note?: string;
  items: string[];
  tone?: GuardrailTone;
}) {
  const isWarning = tone === "warning";
  const Icon = isWarning ? FaTriangleExclamation : FaCircleInfo;

  return (
    <div
      className={`rounded-[18px] border px-3 py-3 ${
        isWarning
          ? "border-amber-200 bg-amber-50"
          : "border-sky-200 bg-sky-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
            isWarning ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
          }`}
        >
          <Icon className="text-xs" />
        </div>
        <div className="min-w-0">
          <p
            className={`text-[13px] font-semibold ${
              isWarning ? "text-amber-900" : "text-sky-900"
            }`}
          >
            {title}
          </p>
          {note ? (
            <p
              className={`mt-1 text-[13px] leading-5 ${
                isWarning ? "text-amber-900/80" : "text-sky-900/80"
              }`}
            >
              {note}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 text-[13px] leading-5 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                isWarning ? "bg-amber-600" : "bg-sky-600"
              }`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

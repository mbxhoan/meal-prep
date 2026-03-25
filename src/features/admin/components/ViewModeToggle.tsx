"use client";

import { FaListUl, FaTableCellsLarge } from "react-icons/fa6";

export type ViewMode = "list" | "grid";

export function ViewModeToggle({
  value,
  onChange,
  listLabel = "Danh sách",
  gridLabel = "Lưới",
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  listLabel?: string;
  gridLabel?: string;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("list")}
        title={listLabel}
        aria-label={listLabel}
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition ${
          value === "list"
            ? "bg-[#18352d] text-white"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <FaListUl className="text-sm" />
        <span className="sr-only">{listLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        title={gridLabel}
        aria-label={gridLabel}
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition ${
          value === "grid"
            ? "bg-[#18352d] text-white"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <FaTableCellsLarge className="text-sm" />
        <span className="sr-only">{gridLabel}</span>
      </button>
    </div>
  );
}

export default ViewModeToggle;

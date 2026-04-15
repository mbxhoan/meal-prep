"use client";

import type { ReactNode } from "react";

type StickyFormFooterProps = {
  note: ReactNode;
  message?: ReactNode;
  messageTone?: "neutral" | "success" | "danger";
  submitLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  className?: string;
  form?: string;
};

const baseFieldClassName =
  "w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition";

export function getTextFieldClassName(dirty = false, className = "") {
  return `${baseFieldClassName} ${
    dirty
      ? "border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-200/60 focus:border-emerald-400 focus:ring-emerald-200"
      : "border-slate-200 bg-slate-50 focus:border-[#51724f]"
  } ${className}`.trim();
}

export function getSelectClassName(dirty = false, className = "") {
  return getTextFieldClassName(dirty, className);
}

export function getTextareaClassName(dirty = false, className = "") {
  return getTextFieldClassName(dirty, className);
}

export function getToggleLabelClassName(dirty = false, className = "") {
  return `inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm text-slate-700 transition ${
    dirty
      ? "border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-200/60"
      : "border-slate-200 bg-slate-50"
  } ${className}`.trim();
}

export function getSectionClassName(dirty = false, className = "") {
  return `rounded-[28px] border p-4 transition ${
    dirty
      ? "border-emerald-200 bg-emerald-50/35 ring-2 ring-emerald-100/80"
      : "border-slate-200 bg-slate-50/70"
  } ${className}`.trim();
}

export function getImageShellClassName(dirty = false, className = "") {
  return `rounded-[28px] border p-4 transition ${
    dirty
      ? "border-emerald-200 bg-emerald-50/35 ring-2 ring-emerald-100/80"
      : "border-slate-200 bg-slate-50/70"
  } ${className}`.trim();
}

function messageClasses(tone: NonNullable<StickyFormFooterProps["messageTone"]>) {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "danger":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export function StickyFormFooter({
  note,
  message,
  messageTone = "neutral",
  submitLabel,
  pendingLabel = "Đang lưu...",
  pending = false,
  disabled = false,
  className = "",
  form,
}: StickyFormFooterProps) {
  const isDisabled = disabled || pending;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:left-[calc(var(--admin-sidebar-width)+1rem)]">
      <div
        className={`mx-auto flex max-w-[1400px] flex-col gap-3 rounded-[26px] border border-slate-300/80 bg-slate-100/96 px-4 py-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)] backdrop-blur-md md:flex-row md:items-center md:justify-between ${className}`.trim()}
      >
        <div className="min-w-0 space-y-1">
          <div className="text-sm leading-6 text-slate-700/90">{note}</div>
          {message ? (
            <div
              className={`inline-flex max-w-full items-start rounded-2xl border px-3 py-2 text-sm shadow-sm ${messageClasses(messageTone)}`}
            >
              {message}
            </div>
          ) : null}
        </div>

        <button
          form={form}
          type="submit"
          disabled={isDisabled}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_30px_-18px_rgba(24,53,45,0.9)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}

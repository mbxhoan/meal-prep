"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaCircleInfo, FaXmark } from "react-icons/fa6";

type AdminGuidePopupProps = {
  storageKey: string;
  title: string;
  summary: string;
  steps: string[];
  actionHref: string;
  actionLabel: string;
};

export function AdminGuidePopup({
  storageKey,
  title,
  summary,
  steps,
  actionHref,
  actionLabel,
}: AdminGuidePopupProps) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setReady(true);

    try {
      setOpen(window.localStorage.getItem(storageKey) !== "1");
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  const closePopup = useCallback(() => {
    setOpen(false);

    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Ignore storage failures.
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      closeButtonRef.current?.focus();
      dialogRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closePopup]);

  if (!ready || !open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-3 py-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePopup();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-guide-title"
        className="mt-3 w-full max-w-md rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_35px_110px_-45px_rgba(15,23,42,0.7)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700">
              <FaCircleInfo className="text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Hướng dẫn nhanh
              </p>
              <h2 id="admin-guide-title" className="mt-1 text-base font-semibold text-slate-900">
                {title}
              </h2>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">{summary}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closePopup}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
            aria-label="Đóng hướng dẫn"
            title="Đóng hướng dẫn"
          >
            <FaXmark className="text-sm" />
          </button>
        </div>

        <ul className="mt-3 space-y-1.5 text-[13px] leading-5 text-slate-600">
          {steps.map((step) => (
            <li key={step} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#51724f]" />
              <span>{step}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={actionHref}
            className="inline-flex items-center rounded-full bg-[#18352d] px-3 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90"
            onClick={closePopup}
          >
            {actionLabel}
          </Link>
          <button
            type="button"
            onClick={closePopup}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

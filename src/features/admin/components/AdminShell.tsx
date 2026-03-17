"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FaArrowUpRightFromSquare,
  FaBars,
  FaBoxArchive,
  FaChartColumn,
  FaChartLine,
  FaClipboardList,
  FaHouse,
  FaUtensils,
  FaXmark,
} from "react-icons/fa6";
import type { AdminContext } from "@/lib/admin/types";
import { LogoutButton } from "@/features/admin/components/LogoutButton";
import { StatusPill } from "@/features/admin/components/StatusPill";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: FaHouse },
  { href: "/admin/menu", label: "Thực đơn", icon: FaUtensils },
  { href: "/admin/inventory", label: "Tồn kho", icon: FaBoxArchive },
  { href: "/admin/orders", label: "Đơn hàng", icon: FaClipboardList },
  { href: "/admin/analytics", label: "Doanh thu", icon: FaChartLine },
];

export function AdminShell({
  children,
  context,
}: {
  children: React.ReactNode;
  context: AdminContext;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(244,114,32,0.12),_transparent_32%),linear-gradient(180deg,_#f6f7f1_0%,_#eef2e7_56%,_#f6f1e7_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-4 py-4 md:gap-5 md:px-5">
        <aside
          className={`fixed inset-y-4 left-4 z-40 w-[280px] overflow-hidden rounded-[32px] border border-white/20 bg-[#13261f]/95 p-5 text-white shadow-[0_25px_90px_-45px_rgba(15,23,42,0.85)] backdrop-blur transition md:static md:block md:w-[290px] ${
            open ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                MealFit Ops
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Inventory Admin</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-sm md:hidden"
            >
              <FaXmark />
            </button>
          </div>

          <div className="mt-8 rounded-[26px] border border-white/10 bg-white/6 p-4">
            <p className="text-sm font-medium text-white/80">
              {context.user?.fullName ?? "MealFit team"}
            </p>
            <p className="mt-1 text-sm text-white/45">
              {context.user?.email ?? "demo@mealfit.vn"}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <StatusPill
                label={context.mode === "live" ? "Live mode" : "Demo mode"}
                tone={context.mode === "live" ? "success" : "warning"}
              />
              <StatusPill label={context.user?.role ?? "admin"} tone="muted" />
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-white text-[#13261f]"
                      : "text-white/70 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon className="text-base" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-8">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/8 hover:text-white"
            >
              <FaArrowUpRightFromSquare />
              <span>Về storefront</span>
            </Link>
          </div>
        </aside>

        {open ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-slate-950/30 md:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="sticky top-4 z-20 rounded-[30px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 md:hidden"
                >
                  <FaBars />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Operations
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <FaChartColumn className="text-[#51724f]" />
                    Theo dõi tồn kho, cost, doanh thu và gross profit theo từng đơn
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
                  {context.mode === "live"
                    ? "Đang kết nối Supabase"
                    : "Demo fallback đang bật"}
                </div>
                <LogoutButton disabled={context.mode === "demo"} />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaAnglesLeft,
  FaAnglesRight,
  FaArrowRight,
  FaArrowUpRightFromSquare,
  FaBars,
  FaBolt,
  FaBoxArchive,
  FaChartColumn,
  FaChartLine,
  FaBookOpen,
  FaClipboardList,
  FaHouse,
  FaUtensils,
  FaXmark,
} from "react-icons/fa6";
import type { AdminContext } from "@/lib/admin/types";
import {
  MASTER_DATA_ENTITY_CONFIGS,
  isMasterDataEntityKey,
} from "@/lib/master-data/config";
import { PROFILE_ROLE_LABELS, type PermissionCode } from "@/lib/rbac/constants";
import { getAdminGuideConfig } from "@/features/admin/config";
import { AdminGuidePopup } from "@/features/admin/components/AdminGuidePopup";
import { LogoutButton } from "@/features/admin/components/LogoutButton";
import { StatusPill } from "@/features/admin/components/StatusPill";

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  permission?: PermissionCode;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Trang chính", icon: FaHouse },
  {
    href: "/admin/menu",
    label: "Món hàng",
    icon: FaUtensils,
    permission: "master.menu.read",
  },
  {
    href: "/admin/master-data",
    label: "Danh mục",
    icon: FaBoxArchive,
  },
  {
    href: "/admin/orders",
    label: "Đơn hàng",
    icon: FaClipboardList,
    permission: "sales.order.read",
  },
  {
    href: "/admin/analytics",
    label: "Doanh thu",
    icon: FaChartLine,
    permission: "report.sales.read",
  },
  {
    href: "/admin/help",
    label: "Hướng dẫn",
    icon: FaBookOpen,
  },
];

type HeaderConfig = {
  eyebrow: string;
  title?: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
};

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function formatRoleLabel(role: string | null | undefined) {
  if (!role) {
    return PROFILE_ROLE_LABELS.viewer;
  }

  return (
    PROFILE_ROLE_LABELS[role as keyof typeof PROFILE_ROLE_LABELS] ?? role
  );
}

function getHeaderConfig(pathname: string): HeaderConfig {
  if (pathname === "/admin") {
    return {
      eyebrow: "Trang chính",
      title: "Bắt đầu",
      description: "Xem việc cần làm ngay.",
      action: {
        href: "/admin/orders/new",
        label: "Tạo đơn",
      },
    };
  }

  if (pathname.startsWith("/admin/menu/")) {
    return {
      eyebrow: "Món hàng",
      title: "Sửa món",
      description: "Tên món, giá và ảnh.",
    };
  }

  if (pathname === "/admin/menu") {
    return {
      eyebrow: "Món hàng",
      title: "Danh sách món",
      description: "Thêm món và sửa giá.",
    };
  }

  if (pathname === "/admin/inventory") {
    return {
      eyebrow: "Tạm ẩn",
      title: "Mục này đang ẩn",
      description: "Chỉ dùng Món hàng, Đơn hàng và Doanh thu.",
    };
  }

  if (pathname === "/admin/orders/new") {
    return {
      eyebrow: "Đơn hàng",
      title: "Tạo đơn nhanh",
      description: "Khách, món, giảm giá và ship.",
    };
  }

  if (pathname.startsWith("/admin/orders/")) {
    return {
      eyebrow: "Đơn hàng",
      title: "Hóa đơn",
      description: "Giữ giá và ghi tiền.",
      action: {
        href: "/admin/orders",
        label: "Danh sách",
      },
    };
  }

  if (pathname === "/admin/orders") {
    return {
      eyebrow: "Đơn hàng",
      title: "Danh sách đơn",
      description: "Xem đơn và đổi trạng thái.",
      action: {
        href: "/admin/orders/new",
        label: "Tạo đơn",
      },
    };
  }

  if (pathname === "/admin/analytics") {
    return {
      eyebrow: "Doanh thu",
      title: "Doanh thu",
      description: "Xem số tiền theo ngày.",
    };
  }

  if (pathname === "/admin/master-data") {
    return {
      eyebrow: "Master data",
      title: "Nguồn dữ liệu chung",
      description: "Khách, nhân viên và danh mục dùng chung cho bán hàng.",
    };
  }

  if (pathname.startsWith("/admin/master-data/")) {
    const entity = pathname.split("/")[3];

    if (entity && isMasterDataEntityKey(entity)) {
      const config = MASTER_DATA_ENTITY_CONFIGS[entity];

      return {
        eyebrow: "Master data",
        title: config.title,
        description: config.description,
      };
    }

    return {
      eyebrow: "Master data",
      title: "Nguồn dữ liệu chung",
      description: "Khách, nhân viên và danh mục dùng chung cho bán hàng.",
    };
  }

  if (pathname === "/admin/settings/roles") {
    return {
      eyebrow: "Tạm ẩn",
      title: "Mục này đang ẩn",
      description: "Chỉ dùng Món hàng, Đơn hàng và Doanh thu.",
    };
  }

  if (pathname === "/admin/help") {
    return {
      eyebrow: "Hướng dẫn",
      title: "Hướng dẫn nhanh",
      description: "Cách làm ngắn gọn, dễ xem.",
    };
  }

  return {
    eyebrow: "Bán hàng",
    description: "Món hàng, đơn hàng, doanh thu.",
  };
}

export function AdminShell({
  children,
  context,
}: {
  children: React.ReactNode;
  context: AdminContext;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const header = getHeaderConfig(pathname);
  const guideConfig = getAdminGuideConfig(pathname);
  const visibleNavItems = navItems.filter((item) =>
    item.permission ? context.permissions.includes(item.permission) : true,
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(244,114,32,0.12),_transparent_32%),linear-gradient(180deg,_#f6f7f1_0%,_#eef2e7_56%,_#f6f1e7_100%)] text-slate-900">
      <div className="flex min-h-screen w-full gap-3 px-3 py-3 md:gap-4 md:px-4">
        <aside
          className={`fixed inset-y-3 left-3 z-40 overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/20 bg-[#13261f]/95 p-3.5 text-white shadow-[0_25px_90px_-45px_rgba(15,23,42,0.85)] backdrop-blur transition md:!relative md:!inset-auto md:!block md:!translate-x-0 md:h-[calc(100vh-1.5rem)] ${
            collapsed ? "md:w-[88px]" : "w-[280px] md:w-[290px]"
          } ${
            open ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between">
            {collapsed ? (
              <div className="mx-auto text-lg">
                <FaBoxArchive />
              </div>
            ) : (
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">
                  MealFit
                </p>
                <h2 className="mt-1 text-base font-semibold">Bán hàng</h2>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-sm md:grid"
                title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              >
                {collapsed ? <FaAnglesRight /> : <FaAnglesLeft />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-sm md:hidden"
              >
                <FaXmark />
              </button>
            </div>
          </div>

          <div className={`mt-6 rounded-[22px] border border-white/10 bg-white/6 p-3.5 ${collapsed ? "hidden" : ""}`}>
            <p className="text-[13px] font-medium text-white/80">
              {context.user?.fullName ?? "MealFit team"}
            </p>
            <p className="mt-1 text-[13px] text-white/45">
              {context.user?.email ?? "demo@mealfit.vn"}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill
                label={context.mode === "live" ? "Thật" : "Demo"}
                tone={context.mode === "live" ? "success" : "warning"}
              />
              <StatusPill
                label={formatRoleLabel(context.user?.role)}
                tone="muted"
              />
            </div>
            <p className="mt-4 truncate text-[11px] text-white/60">
              {context.shop?.name ?? "Chưa chọn shop"}
            </p>
            {context.shops.length > 1 ? (
              <p className="mt-2 text-[11px] text-white/45">
                {context.shops.length} shop đang khả dụng cho tài khoản này.
              </p>
            ) : null}
          </div>

          <nav className="mt-6 space-y-1.5">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => setOpen(false)}
                  title={item.label}
                  className={`flex items-center rounded-2xl px-3 py-2.5 text-[13px] font-medium transition ${
                    collapsed ? "justify-center" : "gap-3"
                  } ${
                    active
                      ? "bg-white text-[#13261f]"
                      : "text-white/70 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon className="text-sm" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <Link
              href="/"
              prefetch
              className={`flex items-center rounded-2xl border border-white/10 px-3 py-2.5 text-[13px] font-medium text-white/75 transition hover:bg-white/8 hover:text-white ${
                collapsed ? "justify-center" : "gap-3"
              }`}
              title="Về trang bán hàng"
            >
              <FaArrowUpRightFromSquare />
              {!collapsed ? <span>Về trang bán hàng</span> : null}
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
          <header className="sticky top-3 z-20 rounded-[20px] border border-white/70 bg-white/82 px-3.5 py-2 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur md:px-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 md:hidden"
                >
                  <FaBars />
                </button>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">
                    {header.eyebrow}
                  </p>
                  {header.title ? (
                    <h1 className="mt-0.5 truncate text-[13px] font-semibold tracking-tight text-slate-900 md:text-sm">
                      {header.title}
                    </h1>
                  ) : null}
                  <p className="mt-0.5 flex max-w-3xl items-center gap-2 text-[11px] leading-4 text-slate-600">
                    <FaChartColumn className="shrink-0 text-[#51724f]" />
                    <span className="truncate">{header.description}</span>
                  </p>
                  {context.shop ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusPill
                        label={context.shop.name}
                        tone="info"
                      />
                      {context.shops.length > 1 ? (
                        <StatusPill
                          label={`${context.shops.length} shop`}
                          tone="muted"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {header.action ? (
                  <Link
                    href={header.action.href}
                    prefetch
                    title={header.action.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#18352d] text-white transition hover:opacity-90"
                  >
                    <FaArrowRight className="text-xs" />
                  </Link>
                ) : null}
                <div
                  title={
                    context.mode === "live"
                      ? "Đang kết nối Supabase"
                      : "Demo fallback đang bật"
                  }
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${
                    context.mode === "live"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <FaBolt />
                </div>
                <LogoutButton compact disabled={context.mode === "demo"} />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      {guideConfig ? (
        <AdminGuidePopup
          storageKey={guideConfig.storageKey}
          title={guideConfig.title}
          summary={guideConfig.summary}
          steps={guideConfig.steps}
          actionHref={guideConfig.actionHref}
          actionLabel={guideConfig.actionLabel}
        />
      ) : null}
    </div>
  );
}

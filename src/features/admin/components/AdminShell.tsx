"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowRight,
  FaArrowUpRightFromSquare,
  FaBars,
  FaBoxArchive,
  FaChartColumn,
  FaChartLine,
  FaClipboardList,
  FaHouse,
  FaListUl,
  FaStore,
  FaUserShield,
  FaUtensils,
  FaXmark,
} from "react-icons/fa6";
import type { AdminContext } from "@/lib/admin/types";
import {
  MASTER_DATA_ENTITY_CONFIGS,
  isMasterDataEntityKey,
} from "@/lib/master-data/config";
import { PROFILE_ROLE_LABELS, type PermissionCode } from "@/lib/rbac/constants";
import { LogoutButton } from "@/features/admin/components/LogoutButton";
import { StatusPill } from "@/features/admin/components/StatusPill";

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  permission?: PermissionCode;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: FaHouse },
  {
    href: "/admin/master-data",
    label: "Danh mục",
    icon: FaListUl,
    permission: "master.lookup.read",
  },
  {
    href: "/admin/menu",
    label: "Thực đơn",
    icon: FaUtensils,
    permission: "master.menu.read",
  },
  {
    href: "/admin/inventory",
    label: "Tồn kho",
    icon: FaBoxArchive,
    permission: "inventory.stock.read",
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
    href: "/admin/settings/roles",
    label: "Phân quyền",
    icon: FaUserShield,
    permission: "system.user.assign_role",
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
      eyebrow: "Dashboard",
      title: "Tồn kho, doanh thu và lợi nhuận",
      description:
        "Revenue, gross profit, menu đang bán và low stock trong cùng một nơi.",
      action: {
        href: "/admin/orders/new",
        label: "Tạo đơn mới",
      },
    };
  }

  if (pathname.startsWith("/admin/menu/")) {
    return {
      eyebrow: "Menu editor",
      title: "Chỉnh món và BOM nguyên liệu",
      description:
        "Cập nhật ảnh đại diện, thông tin hiển thị, giá bán từng variant và cost profile.",
    };
  }

  if (pathname === "/admin/menu") {
    return {
      eyebrow: "Menu",
      title: "Ảnh đại diện, giá bán và cost profile",
      description:
        "Chỉnh thực đơn, variant và margin từng món từ cùng một màn hình.",
    };
  }

  if (pathname === "/admin/inventory") {
    return {
      eyebrow: "Inventory",
      title: "Tồn kho, AVG cost và biến động nguyên liệu",
      description:
        "Theo dõi tồn kho và cập nhật cost dùng ngay cho BOM và các đơn mới.",
    };
  }

  if (pathname === "/admin/orders/new") {
    return {
      eyebrow: "New order",
      title: "Tạo đơn và cho hệ thống tự tính",
      description:
        "Preview revenue, COGS và gross profit trước khi lưu vào Supabase.",
    };
  }

  if (pathname === "/admin/orders") {
    return {
      eyebrow: "Orders",
      title: "Đơn hàng và lời lãi theo từng đơn",
      description:
        "Theo dõi revenue, COGS và gross profit theo trạng thái của từng đơn.",
      action: {
        href: "/admin/orders/new",
        label: "Tạo đơn",
      },
    };
  }

  if (pathname === "/admin/analytics") {
    return {
      eyebrow: "Analytics",
      title: "Doanh thu và lợi nhuận theo ngày",
      description:
        "Xem margin thay đổi theo ngày và theo từng kênh bán.",
    };
  }

  if (pathname === "/admin/master-data") {
    return {
      eyebrow: "Master data",
      title: "Danh mục nền tảng Phase 1",
      description:
        "Quản lý customer, supplier, warehouse, item, menu và price book.",
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
  }

  if (pathname === "/admin/settings/roles") {
    return {
      eyebrow: "Access control",
      title: "Phân quyền user theo shop",
      description:
        "Gán role, shop và employee profile trong một màn hình duy nhất.",
    };
  }

  return {
    eyebrow: "Operations",
    description:
      "Theo dõi tồn kho, cost, doanh thu và gross profit theo từng đơn.",
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
  const header = getHeaderConfig(pathname);
  const visibleNavItems = navItems.filter((item) =>
    item.permission ? context.permissions.includes(item.permission) : true,
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(244,114,32,0.12),_transparent_32%),linear-gradient(180deg,_#f6f7f1_0%,_#eef2e7_56%,_#f6f1e7_100%)] text-slate-900">
      <div className="flex min-h-screen w-full gap-4 px-4 py-4 md:gap-5 md:px-5">
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
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill
                label={context.mode === "live" ? "Live mode" : "Demo mode"}
                tone={context.mode === "live" ? "success" : "warning"}
              />
              <StatusPill
                label={formatRoleLabel(context.user?.role)}
                tone="muted"
              />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
              <FaStore className="shrink-0" />
              <span className="truncate">
                {context.shop?.name ?? "Chưa chọn shop"}
              </span>
            </div>
            {context.shops.length > 1 ? (
              <p className="mt-2 text-xs text-white/45">
                {context.shops.length} shop đang khả dụng cho tài khoản này.
              </p>
            ) : null}
          </div>

          <nav className="mt-8 space-y-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

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
          <header className="sticky top-4 z-20 rounded-[30px] border border-white/70 bg-white/82 px-4 py-3 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur md:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 md:hidden"
                >
                  <FaBars />
                </button>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">
                    {header.eyebrow}
                  </p>
                  {header.title ? (
                    <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                      {header.title}
                    </h1>
                  ) : null}
                  <p className="mt-1 flex max-w-4xl items-start gap-2 text-xs leading-6 text-slate-600 md:text-sm">
                    <FaChartColumn className="mt-1 shrink-0 text-[#51724f]" />
                    <span>{header.description}</span>
                  </p>
                  {context.shop ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
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

              <div className="flex flex-wrap items-center gap-3">
                {header.action ? (
                  <Link
                    href={header.action.href}
                    className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {header.action.label}
                    <FaArrowRight className="text-xs" />
                  </Link>
                ) : null}
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 md:text-sm">
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

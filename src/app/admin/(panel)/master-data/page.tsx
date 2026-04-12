import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MASTER_DATA_ENTITY_LIST,
  getMasterDataLandingConfig,
} from "@/lib/master-data";
import { StatusPill } from "@/features/admin/components/StatusPill";

export default async function MasterDataLandingPage() {
  const { context, entities } = await getMasterDataLandingConfig();

  if (context.configured && !context.user) {
    redirect("/admin/login");
  }

  if (context.configured && !context.canAccessPanel) {
    redirect("/admin/login?reason=permission");
  }

  const masterPermissionCount = context.permissions.filter((permission) =>
    permission.startsWith("master."),
  ).length;

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Master data
            </p>
            <h1 className="mt-1 text-base font-semibold text-slate-900">
              Nguồn dữ liệu chung
            </h1>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">
              Nơi quản lý khách hàng, nhân viên và các danh mục dùng chung cho toàn hệ thống.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={context.shop?.name ?? "Chưa chọn shop"} tone="info" />
            <StatusPill
              label={`${entities.length}/${MASTER_DATA_ENTITY_LIST.length} mục`}
              tone="success"
            />
            <StatusPill
              label={`${masterPermissionCount} quyền danh mục`}
              tone="muted"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              Mục khả dụng
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {entities.length}
            </p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              Tổng mục
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {MASTER_DATA_ENTITY_LIST.length}
            </p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              Quyền danh mục
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {masterPermissionCount}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {entities.map((entity) => (
          <Link
            key={entity.key}
            href={`/admin/master-data/${entity.key}`}
            className="rounded-[22px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-[#d6decf]"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">
                {entity.title}
              </h3>
              <StatusPill label={`${entity.recordCount} dòng`} tone="muted" />
            </div>
            <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
              {entity.description}
            </p>
            <div className="mt-4 text-[13px] font-medium text-[#18352d]">
              Mở quản lý
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

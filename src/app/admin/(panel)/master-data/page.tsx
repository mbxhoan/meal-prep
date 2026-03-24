import Link from "next/link";
import { redirect } from "next/navigation";
import { getMasterDataLandingConfig } from "@/lib/master-data";
import { StatusPill } from "@/features/admin/components/StatusPill";

export default async function MasterDataLandingPage() {
  const { context, entities } = await getMasterDataLandingConfig();

  if (context.configured && !context.user) {
    redirect("/admin/login");
  }

  if (context.configured && !context.canAccessPanel) {
    redirect("/admin/login?reason=permission");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Master data
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Danh mục nền tảng Phase 1
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Các bảng bên dưới là nguồn sự thật cho customer, supplier, warehouse,
          item, menu và price book. CRUD tối thiểu chạy theo shop hiện tại.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill
            label={context.shop?.name ?? "Chưa chọn shop"}
            tone="info"
          />
          <StatusPill
            label={`${entities.length} module khả dụng`}
            tone="success"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entities.map((entity) => (
          <Link
            key={entity.key}
            href={`/admin/master-data/${entity.key}`}
            className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-[#d6decf]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              {entity.key.replace(/_/g, " ")}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {entity.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              {entity.description}
            </p>
            <div className="mt-4 text-sm font-medium text-[#18352d]">
              Mở CRUD
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

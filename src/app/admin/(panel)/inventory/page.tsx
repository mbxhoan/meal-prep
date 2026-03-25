import { InventoryCorePanel } from "@/features/inventory/components";
import { getInventoryCorePageData } from "@/lib/inventory/service";

export default async function AdminInventoryPage() {
  const data = await getInventoryCorePageData();

  if (!data) {
    return (
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Tồn kho
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          Không có quyền truy cập tồn kho
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Cần permission `inventory.stock.read` hoặc quyền liên quan để mở màn
          này.
        </p>
      </section>
    );
  }

  return <InventoryCorePanel data={data} />;
}

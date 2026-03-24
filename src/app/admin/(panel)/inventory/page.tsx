import { InventoryCorePanel } from "@/features/inventory/components";
import { getInventoryCorePageData } from "@/lib/inventory/service";

export default async function AdminInventoryPage() {
  const data = await getInventoryCorePageData();

  if (!data) {
    return (
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Inventory
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Không có quyền truy cập tồn kho
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          Cần permission `inventory.stock.read` hoặc quyền liên quan để mở màn
          này.
        </p>
      </section>
    );
  }

  return <InventoryCorePanel data={data} />;
}

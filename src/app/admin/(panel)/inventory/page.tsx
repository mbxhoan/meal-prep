import { InventoryCorePanel } from "@/features/inventory/components";
import { getInventoryCorePageData } from "@/lib/inventory/service";
import { ADMIN_SIMPLE_MODE } from "@/features/admin/config";

export default async function AdminInventoryPage() {
  const data = await getInventoryCorePageData();

  if (ADMIN_SIMPLE_MODE) {
    return (
      <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Tạm ẩn
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-900">
          Phần kho đang tạm ẩn
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-500">
          Hiện chỉ dùng Món hàng, Đơn hàng và Doanh thu.
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Tồn kho
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-900">
          Không có quyền truy cập tồn kho
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-500">
          Cần permission `inventory.stock.read` hoặc quyền liên quan.
        </p>
      </section>
    );
  }

  return <InventoryCorePanel data={data} />;
}

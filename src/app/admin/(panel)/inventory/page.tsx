import { PageHeader, InventoryAdjustmentForm, StatusPill } from "@/features/admin/components";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/admin/format";
import { getInventoryItems } from "@/lib/admin/service";

export default async function AdminInventoryPage() {
  const items = await getInventoryItems();
  const stockValue = items.reduce(
    (sum, item) => sum + item.onHand * item.averageUnitCost,
    0,
  );
  const lowStockItems = items.filter((item) => item.isLowStock);

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Inventory"
        title="Tồn kho, AVG cost và biến động nguyên liệu"
        description="Nhập kho hay điều chỉnh ở đây để cập nhật cost bình quân. Cost hiện tại sẽ được dùng ngay cho recipe BOM và các đơn mới."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Stock value
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {formatCurrency(stockValue)}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Tính theo on-hand x average unit cost của từng inventory item.
          </p>
        </div>
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Low stock
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {lowStockItems.length} items
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Các item dưới reorder point cần ưu tiên nhập hàng.
          </p>
        </div>
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Last updated
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {items[0] ? formatDate(items[0].updatedAt) : "N/A"}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Thời điểm update gần nhất của kho.
          </p>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Inventory items
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Danh sách nguyên liệu và ngưỡng cảnh báo
            </h2>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nguyên liệu</th>
                <th className="px-4 py-3 font-medium">On hand</th>
                <th className="px-4 py-3 font-medium">Reorder point</th>
                <th className="px-4 py-3 font-medium">AVG cost</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="mt-1 text-slate-500">{item.sku}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {formatQuantity(item.onHand, item.unit)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {formatQuantity(item.reorderPoint, item.unit)}
                  </td>
                  <td className="px-4 py-4 align-top font-medium text-slate-900">
                    {formatCurrency(item.averageUnitCost)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {item.supplierName}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill
                      label={item.isLowStock ? "Low stock" : "Healthy"}
                      tone={item.isLowStock ? "warning" : "success"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Quick adjustments
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Nhập kho và điều chỉnh nhanh
          </h2>
        </div>
        {items.map((item) => (
          <InventoryAdjustmentForm key={item.id} item={item} />
        ))}
      </section>
    </div>
  );
}

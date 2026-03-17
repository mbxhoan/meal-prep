import Link from "next/link";
import {
  FaArrowRight,
  FaBoxArchive,
  FaClipboardList,
  FaMoneyBillTrendUp,
  FaUtensils,
} from "react-icons/fa6";
import {
  MetricCard,
  PageHeader,
  StatusPill,
  statusTone,
} from "@/features/admin/components";
import { formatCurrency, formatDate, formatPercent, formatQuantity } from "@/lib/admin/format";
import { getDashboardSnapshot } from "@/lib/admin/service";

export default async function AdminDashboardPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Tồn kho, doanh thu và lợi nhuận"
        description="Dashboard này gom các chỉ số quan trọng cho vận hành MealFit: tiền vào trong 30 ngày, gross profit, số món đang bán và các nguyên liệu sắp chạm mức reorder."
        action={
          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Tạo đơn mới
            <FaArrowRight className="text-xs" />
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue 30d"
          value={formatCurrency(snapshot.revenue30d)}
          hint="Đã loại trừ order draft và cancelled."
          icon={<FaMoneyBillTrendUp />}
        />
        <MetricCard
          label="Gross Profit 30d"
          value={formatCurrency(snapshot.profit30d)}
          hint={`Gross margin hiện tại ${formatPercent(snapshot.grossMargin30d)} trên revenue đã chốt.`}
          icon={<FaClipboardList />}
        />
        <MetricCard
          label="Active Menu"
          value={`${snapshot.menuCount} món`}
          hint="Menu count lấy từ catalog đang bán trong admin."
          icon={<FaUtensils />}
        />
        <MetricCard
          label="Low Stock"
          value={`${snapshot.lowStockCount} nguyên liệu`}
          hint={`${snapshot.openOrders} đơn đang mở cần theo dõi tồn kho trước khi xác nhận.`}
          icon={<FaBoxArchive />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Recent orders
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Đơn gần nhất và lợi nhuận theo đơn
              </h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Đơn</th>
                  <th className="px-4 py-3 font-medium">Khách</th>
                  <th className="px-4 py-3 font-medium">Kênh</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Profit</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {snapshot.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium text-slate-900">{order.orderNumber}</p>
                      <p className="mt-1 text-slate-500">{formatDate(order.orderedAt)}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-4 align-top text-slate-500">
                      {order.salesChannel}
                    </td>
                    <td className="px-4 py-4 align-top font-medium text-slate-900">
                      {formatCurrency(order.totalRevenue)}
                    </td>
                    <td className="px-4 py-4 align-top font-medium text-emerald-700">
                      {formatCurrency(order.grossProfit)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusPill
                        label={order.status}
                        tone={statusTone(order.status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                  Low stock
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Ưu tiên nhập thêm
                </h2>
              </div>
              <Link
                href="/admin/inventory"
                className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                Mở kho
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {snapshot.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.supplierName}
                      </p>
                    </div>
                    <StatusPill label="Low stock" tone="warning" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                    <span>On hand</span>
                    <span>{formatQuantity(item.onHand, item.unit)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Reorder point</span>
                    <span>{formatQuantity(item.reorderPoint, item.unit)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[#18352d]/10 bg-[#18352d] p-6 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.9)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Best sellers
            </p>
            <h2 className="mt-2 text-2xl font-semibold">SKU mang nhiều tiền nhất</h2>
            <div className="mt-5 space-y-4">
              {snapshot.bestSellers.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.productName}</p>
                    <span className="text-sm text-white/65">{item.quantity} suất</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-white/65">
                    <span>Revenue</span>
                    <span>{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-emerald-300">
                    <span>Profit</span>
                    <span>{formatCurrency(item.profit)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import {
  FaBoxArchive,
  FaClipboardList,
  FaMoneyBillTrendUp,
  FaUtensils,
} from "react-icons/fa6";
import {
  ExportExcelButton,
  MetricCard,
  StatusPill,
  formatOrderStatusLabel,
  statusTone,
} from "@/features/admin/components";
import { formatCurrency, formatDate, formatPercent, formatQuantity } from "@/lib/admin/format";
import { getDashboardSnapshot } from "@/lib/admin/service";

function formatSalesChannelLabel(channel: string) {
  switch (channel) {
    case "website":
      return "Trang web";
    case "facebook":
      return "Facebook";
    case "zalo":
      return "Zalo";
    case "store":
      return "Cửa hàng";
    case "grab":
      return "Grab / ứng dụng";
    case "manual":
      return "Thủ công";
    default:
      return channel;
  }
}

export default async function AdminDashboardPage() {
  const snapshot = await getDashboardSnapshot();
  const recentOrderExportRows = snapshot.recentOrders.map((order) => ({
    đơn_hàng: order.orderNumber,
    khách_hàng: order.customerName,
    kênh_bán: formatSalesChannelLabel(order.salesChannel),
    doanh_thu: formatCurrency(order.totalRevenue),
    lợi_nhuận: formatCurrency(order.grossProfit),
    trạng_thái: formatOrderStatusLabel(order.status),
  }));

  return (
    <div className="space-y-4 pb-8">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Doanh thu 30 ngày"
          value={formatCurrency(snapshot.revenue30d)}
          hint="Chỉ đơn đã chốt."
          icon={<FaMoneyBillTrendUp />}
        />
        <MetricCard
          label="Lợi nhuận gộp 30 ngày"
          value={formatCurrency(snapshot.profit30d)}
          hint={`Biên ${formatPercent(snapshot.grossMargin30d)}.`}
          icon={<FaClipboardList />}
        />
        <MetricCard
          label="Món đang bán"
          value={`${snapshot.menuCount} món`}
          hint="Món đang mở bán."
          icon={<FaUtensils />}
        />
        <MetricCard
          label="Tồn thấp"
          value={`${snapshot.lowStockCount} nguyên liệu`}
          hint={`${snapshot.openOrders} đơn chờ xử lý.`}
          icon={<FaBoxArchive />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Đơn gần nhất
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Đơn gần nhất</h2>
            </div>
            <div className="flex items-center gap-2">
              <ExportExcelButton
                filename={`don-gan-nhat-${new Date().toISOString().slice(0, 10)}`}
                sheetName="Đơn gần nhất"
                title="Xuất Excel đơn gần nhất"
                columns={[
                  { key: "đơn_hàng", label: "Đơn hàng" },
                  { key: "khách_hàng", label: "Khách hàng" },
                  { key: "kênh_bán", label: "Kênh bán" },
                  { key: "doanh_thu", label: "Doanh thu" },
                  { key: "lợi_nhuận", label: "Lợi nhuận" },
                  { key: "trạng_thái", label: "Trạng thái" },
                ]}
                rows={recentOrderExportRows}
              />
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                Xem đơn
              </Link>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Đơn hàng</th>
                  <th className="px-4 py-3 font-medium">Khách hàng</th>
                  <th className="px-4 py-3 font-medium">Kênh</th>
                  <th className="px-4 py-3 font-medium">Doanh thu</th>
                  <th className="px-4 py-3 font-medium">Lợi nhuận</th>
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
                      {formatSalesChannelLabel(order.salesChannel)}
                    </td>
                    <td className="px-4 py-4 align-top font-medium text-slate-900">
                      {formatCurrency(order.totalRevenue)}
                    </td>
                    <td className="px-4 py-4 align-top font-medium text-emerald-700">
                      {formatCurrency(order.grossProfit)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusPill
                        label={formatOrderStatusLabel(order.status)}
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
          <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                  Tồn thấp
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Cần nhập</h2>
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
                    <StatusPill label="Tồn thấp" tone="warning" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                    <span>Tồn hiện tại</span>
                    <span>{formatQuantity(item.onHand, item.unit)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Mức đặt hàng</span>
                    <span>{formatQuantity(item.reorderPoint, item.unit)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#18352d]/10 bg-[#18352d] p-5 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.9)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Bán chạy
            </p>
            <h2 className="mt-1 text-lg font-semibold">Mặt hàng bán tốt</h2>
            <div className="mt-5 space-y-4">
              {snapshot.bestSellers.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.productName}</p>
                    <span className="text-sm text-white/65">{item.quantity} suất</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-white/65">
                    <span>Doanh thu</span>
                    <span>{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-emerald-300">
                    <span>Lợi nhuận</span>
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

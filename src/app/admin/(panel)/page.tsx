import Link from "next/link";
import {
  FaArrowRight,
  FaClipboardList,
  FaMoneyBillTrendUp,
  FaUtensils,
} from "react-icons/fa6";
import {
  ExportExcelButton,
  GuidedWorkflowCard,
  MetricCard,
  PageHeader,
  StatusPill,
  formatOrderStatusLabel,
  statusTone,
} from "@/features/admin/components";
import { formatCurrency, formatDate, formatPercent } from "@/lib/admin/format";
import { getDashboardSnapshot } from "@/lib/admin/service";

export default async function AdminDashboardPage() {
  const snapshot = await getDashboardSnapshot();
  const maxTrendRevenue = Math.max(
    ...snapshot.salesTrend.map((point) => point.revenue),
    1,
  );

  const recentOrderExportRows = snapshot.recentOrders.map((order) => ({
    đơn_hàng: order.orderNumber,
    khách_hàng: order.customerName,
    doanh_thu: formatCurrency(order.totalRevenue),
    trạng_thái: formatOrderStatusLabel(order.status),
  }));

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        eyebrow="Bán hàng"
        title="Bắt đầu"
        description="Chỉ cần 3 chỗ: Món hàng, Đơn hàng và Doanh thu."
        action={
          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-3 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90"
          >
            <FaArrowRight className="text-xs" />
            <span>Tạo đơn</span>
          </Link>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <GuidedWorkflowCard
            eyebrow="Hôm nay"
            title="Làm 3 việc"
            description="Giữ màn hình ngắn để dễ thao tác."
            steps={[
              "Mở Món hàng nếu có món mới hoặc cần sửa giá.",
              "Mở Đơn hàng để tạo bill và chốt trạng thái.",
              "Mở Doanh thu để xem tiền trong ngày.",
            ]}
          />

          <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Lối tắt
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Link
                href="/admin/menu"
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <span>Món hàng</span>
                <FaArrowRight className="text-xs" />
              </Link>
              <Link
                href="/admin/orders"
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <span>Đơn hàng</span>
                <FaArrowRight className="text-xs" />
              </Link>
              <Link
                href="/admin/analytics"
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <span>Doanh thu</span>
                <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
          <MetricCard
            label="Doanh thu 30 ngày"
            value={formatCurrency(snapshot.revenue30d)}
            hint="Chỉ đơn đã chốt."
            icon={<FaMoneyBillTrendUp />}
          />
          <MetricCard
            label="Doanh thu hôm nay"
            value={formatCurrency(snapshot.todayRevenue)}
            hint={`${snapshot.todayOrders} đơn trong ngày`}
            icon={<FaClipboardList />}
          />
          <MetricCard
            label="Đơn 30 ngày"
            value={`${snapshot.orderCount30d} đơn`}
            hint="Đơn hợp lệ trong 30 ngày."
            icon={<FaClipboardList />}
          />
          <MetricCard
            label="Đơn chờ"
            value={`${snapshot.openOrders} đơn`}
            hint="Cần xem tiếp."
            icon={<FaClipboardList />}
          />
          <MetricCard
            label="Bill trung bình"
            value={formatCurrency(snapshot.avgOrderValue)}
            hint="Giá trị đơn trung bình."
            icon={<FaMoneyBillTrendUp />}
          />
          <MetricCard
            label="Tỷ lệ lãi"
            value={formatPercent(snapshot.grossMargin30d)}
            hint={`Lãi ${formatCurrency(snapshot.profit30d)}`}
            icon={<FaUtensils />}
          />
          <MetricCard
            label="Món đang bán"
            value={`${snapshot.menuCount} món`}
            hint="Đang hiển thị bán."
            icon={<FaUtensils />}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Biểu đồ
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Doanh thu 7 ngày
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">
              Chỉ lấy đơn hợp lệ để tránh số bị lệch.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={`${snapshot.salesTrend.length} ngày`} tone="muted" />
            <StatusPill label={`${snapshot.menuCount} món`} tone="success" />
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
          {snapshot.salesTrend.map((point) => {
            const height = Math.max(point.revenue / maxTrendRevenue, 0.08);
            const dayLabel = new Intl.DateTimeFormat("vi-VN", {
              day: "2-digit",
              month: "2-digit",
            }).format(new Date(point.date));

            return (
              <div key={point.date} className="flex flex-col gap-2">
                <div className="flex h-48 items-end rounded-[20px] border border-slate-200 bg-slate-50 p-2">
                  <div
                    className="w-full rounded-[14px] bg-gradient-to-t from-[#18352d] via-[#2f5747] to-[#7aa18d]"
                    style={{ height: `${height * 100}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-medium text-slate-600">{dayLabel}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatCurrency(point.revenue)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Đơn gần nhất
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Đơn gần nhất
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">
              Nhìn nhanh đơn nào vừa vào để xử lý tiếp.
            </p>
          </div>
          <ExportExcelButton
            filename={`don-gan-nhat-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Đơn gần nhất"
            title="Xuất Excel đơn gần nhất"
            columns={[
              { key: "đơn_hàng", label: "Đơn hàng" },
              { key: "khách_hàng", label: "Khách hàng" },
              { key: "doanh_thu", label: "Doanh thu" },
              { key: "trạng_thái", label: "Trạng thái" },
            ]}
            rows={recentOrderExportRows}
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Đơn hàng</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Doanh thu</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Mở</th>
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
                  <td className="px-4 py-4 align-top font-medium text-slate-900">
                    {formatCurrency(order.totalRevenue)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill
                      label={formatOrderStatusLabel(order.status)}
                      tone={statusTone(order.status)}
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      title="Mở đơn"
                      aria-label="Mở đơn"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white"
                    >
                      <FaArrowRight className="text-xs" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

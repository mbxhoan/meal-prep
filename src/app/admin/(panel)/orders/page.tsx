import Link from "next/link";
import { FaArrowRight, FaCircleInfo } from "react-icons/fa6";
import {
  ExportExcelButton,
  StatusPill,
  formatOrderStatusLabel,
  formatPaymentStatusLabel,
  paymentStatusTone,
  statusTone,
} from "@/features/admin/components";
import { formatCurrency, formatDate, formatPercent } from "@/lib/admin/format";
import { getOrders } from "@/lib/admin/service";

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

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  const exportRows = orders.map((order) => ({
    đơn_hàng: order.orderNumber,
    khách_hàng: order.customerName,
    kênh_bán: formatSalesChannelLabel(order.salesChannel),
    số_dòng: order.items.length,
    doanh_thu: formatCurrency(order.totalRevenue),
    thanh_toán: formatPaymentStatusLabel(order.paymentStatus ?? "unpaid"),
    giá_vốn: formatCurrency(order.totalCogs),
    lợi_nhuận: formatCurrency(order.grossProfit),
    biên_lợi_nhuận: formatPercent(order.grossMargin),
    trạng_thái: formatOrderStatusLabel(order.status),
  }));

  if (orders.length === 0) {
    return (
      <div className="space-y-4 pb-8">
        <section className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Đơn hàng
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Chưa có đơn</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Tạo đơn mới để bắt đầu.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/admin/orders/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <FaArrowRight className="text-xs" />
              <span>Tạo đơn</span>
            </Link>
            <Link
              href="/admin/help#bat-dau-nhanh"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              <FaCircleInfo className="text-xs" />
              <span>Xem hướng dẫn</span>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Đơn hàng
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Danh sách đơn</h2>
            <div className="mt-3 rounded-[20px] border border-sky-200 bg-sky-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700">
                  <FaCircleInfo className="text-sm" />
                </div>
                <p className="text-sm leading-6 text-sky-900/85">
                  Đơn chốt dùng snapshot giá. Muốn sửa thì đi flow override.
                </p>
              </div>
            </div>
          </div>
          <ExportExcelButton
            filename={`don-hang-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Đơn hàng"
            title="Xuất Excel đơn hàng"
            columns={[
              { key: "đơn_hàng", label: "Đơn hàng" },
              { key: "khách_hàng", label: "Khách hàng" },
              { key: "kênh_bán", label: "Kênh bán" },
              { key: "số_dòng", label: "Số dòng" },
              { key: "doanh_thu", label: "Doanh thu" },
              { key: "thanh_toán", label: "Thanh toán" },
              { key: "giá_vốn", label: "Giá vốn" },
              { key: "lợi_nhuận", label: "Lợi nhuận" },
              { key: "biên_lợi_nhuận", label: "Biên lợi nhuận" },
              { key: "trạng_thái", label: "Trạng thái" },
            ]}
            rows={exportRows}
          />
        </div>
      </section>

      <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="overflow-hidden rounded-[24px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Đơn hàng</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Số dòng</th>
                <th className="px-4 py-3 font-medium">Doanh thu</th>
                <th className="px-4 py-3 font-medium">Thanh toán</th>
                <th className="px-4 py-3 font-medium">Giá vốn</th>
                <th className="px-4 py-3 font-medium">Lợi nhuận</th>
                <th className="px-4 py-3 font-medium">Biên LN</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Hóa đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-4 align-top">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-slate-900 transition hover:text-[#18352d]"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="mt-1 text-slate-500">{formatDate(order.orderedAt)}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-800">{order.customerName}</p>
                    <p className="mt-1 text-slate-500">
                      {formatSalesChannelLabel(order.salesChannel)}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {order.items.length} dòng
                  </td>
                  <td className="px-4 py-4 align-top font-medium text-slate-900">
                    {formatCurrency(order.totalRevenue)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill
                      label={formatPaymentStatusLabel(order.paymentStatus ?? "unpaid")}
                      tone={paymentStatusTone(order.paymentStatus ?? "unpaid")}
                    />
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {formatCurrency(order.totalCogs)}
                  </td>
                  <td className="px-4 py-4 align-top font-medium text-emerald-700">
                    {formatCurrency(order.grossProfit)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {formatPercent(order.grossMargin)}
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
                      title="Mở hóa đơn"
                      aria-label="Mở hóa đơn"
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
      </div>
    </div>
  );
}

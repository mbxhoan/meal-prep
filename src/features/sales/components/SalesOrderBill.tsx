import Link from "next/link";
import {
  StatusPill,
  formatOrderStatusLabel,
  formatPaymentStatusLabel,
  paymentStatusTone,
  statusTone,
} from "@/features/admin/components";
import { formatCurrency, formatDate, formatPercent } from "@/lib/admin/format";
import type { OrderStatus } from "@/lib/admin/types";
import type { SalesOrderDetailRecord } from "@/lib/sales/types";
import { SalesOrderBillActions } from "@/features/sales/components/SalesOrderBillActions";

function sumPayments(order: SalesOrderDetailRecord) {
  return order.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

function formatDocumentStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Bản nháp";
    case "posted":
      return "Đã ghi sổ";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

export function SalesOrderBill({
  order,
  canRefreshPrice,
  canUpdateStatus,
  canRecordPayment,
}: {
  order: SalesOrderDetailRecord;
  canRefreshPrice: boolean;
  canUpdateStatus: boolean;
  canRecordPayment: boolean;
}) {
  const paidTotal = sumPayments(order);
  const balanceDue = Math.max(order.totalAmount - paidTotal, 0);

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Hóa đơn
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                {order.orderNo}
              </h1>
              <StatusPill
                label={formatOrderStatusLabel(order.status)}
                tone={statusTone(order.status as OrderStatus)}
              />
              <StatusPill
                label={formatPaymentStatusLabel(order.paymentStatus ?? "unpaid")}
                tone={paymentStatusTone(order.paymentStatus ?? "unpaid")}
              />
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Hóa đơn chỉ đọc từ bản chụp trong đơn. Không nối lại bảng giá hiện
              hành để tránh lịch sử tự đổi theo danh mục nền tảng.
            </p>
            <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Khách hàng
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {order.customerNameSnapshot}
                </p>
                <p className="mt-1 text-slate-500">
                  {order.customerPhoneSnapshot ?? "Chưa có số"}
                </p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Địa chỉ
                </p>
                <p className="mt-1 text-slate-700">
                  {order.customerAddressSnapshot ?? "Chưa có địa chỉ"}
                </p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Bảng giá chụp
                </p>
                <p className="mt-1 text-slate-700">
                  {order.priceBookIdSnapshot
                    ? "Đã chụp từ bảng giá"
                    : "Bản cũ / chưa chụp"}
                </p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Thời gian
                </p>
                <p className="mt-1 text-slate-700">{formatDate(order.orderedAt)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:w-[340px]">
            <Link
              href="/admin/orders"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              Quay lại danh sách
            </Link>
            <div className="rounded-[22px] border border-[#18352d]/10 bg-[#18352d] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Tổng hợp
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Tạm tính</span>
                  <span>{formatCurrency(order.subtotalBeforeDiscount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Giảm giá</span>
                  <span>-{formatCurrency(order.orderDiscountAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Phí giao hàng</span>
                  <span>{formatCurrency(order.shippingFee)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Phí khác</span>
                  <span>{formatCurrency(order.otherFee)}</span>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] border border-white/10 bg-white/6 px-4 py-3">
                <div className="flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Tổng tiền</span>
                  <span className="font-medium text-white">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Đã thanh toán</span>
                  <span>{formatCurrency(paidTotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Còn phải thu</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Lợi nhuận gộp</span>
                  <span className="font-medium text-emerald-300">
                    {formatCurrency(order.grossProfit)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Biên LN</span>
                  <span>{formatPercent(order.grossMargin)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {order.fulfillmentIssue ? (
        <section className="rounded-[24px] border border-emerald-200/80 bg-emerald-50/90 px-5 py-4 text-sm text-slate-800 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Xuất kho từ đơn
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/inventory"
              className="font-medium text-emerald-900 underline decoration-emerald-600/50 underline-offset-4 hover:decoration-emerald-800"
            >
              {order.fulfillmentIssue.issueNo}
            </Link>
            <StatusPill
              label={formatDocumentStatusLabel(order.fulfillmentIssue.status)}
              tone={
                order.fulfillmentIssue.status === "posted"
                  ? "success"
                  : order.fulfillmentIssue.status === "draft"
                    ? "warning"
                    : "muted"
              }
            />
            {order.fulfillmentIssue.postedAt ? (
              <span className="text-slate-600">
                Ghi sổ {formatDate(order.fulfillmentIssue.postedAt)}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Phiếu nháp sinh khi xác nhận; chỉnh lô nếu ghi đè FEFO và ghi lý do trước khi ghi sổ
            (cần quyền inventory.fefo.override).
          </p>
        </section>
      ) : null}

      <SalesOrderBillActions
        order={order}
        canRefreshPrice={canRefreshPrice}
        canUpdateStatus={canUpdateStatus}
        canRecordPayment={canRecordPayment}
      />

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Dòng đơn hàng
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Dòng chụp
            </h2>
          </div>
          <StatusPill label={`${order.items.length} dòng`} tone="muted" />
        </div>

        <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Món</th>
                <th className="px-4 py-3 font-medium">Số lượng</th>
                <th className="px-4 py-3 font-medium">Giá bán</th>
                <th className="px-4 py-3 font-medium">Giảm giá</th>
                <th className="px-4 py-3 font-medium">Doanh thu</th>
                <th className="px-4 py-3 font-medium">Giá vốn</th>
                <th className="px-4 py-3 font-medium">Lợi nhuận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{item.itemNameSnapshot}</p>
                    <p className="mt-1 text-slate-500">
                      {item.variantLabelSnapshot ?? "Biến thể"} ·{" "}
                      {item.weightGramsSnapshot == null
                        ? "Không có"
                        : `${item.weightGramsSnapshot} g`}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {formatCurrency(item.unitPriceSnapshot)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {item.lineDiscountAmount > 0
                      ? `-${formatCurrency(item.lineDiscountAmount)}`
                      : "0 ₫"}
                  </td>
                  <td className="px-4 py-4 align-top font-medium text-slate-900">
                    {formatCurrency(item.lineTotalAfterDiscount)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">
                    {formatCurrency(item.lineCostTotal)}
                  </td>
                  <td className="px-4 py-4 align-top font-medium text-emerald-700">
                    {formatCurrency(item.lineProfitTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Nhật ký trạng thái
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          Lịch sử chốt đơn
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Dòng thời gian này đọc từ <code>sales_order_status_logs</code> và giữ nguyên dấu vết thay đổi.
        </p>
        <div className="mt-5 space-y-3">
          {order.statusLogs.length > 0 ? (
            order.statusLogs.map((log, index) => (
              <div key={log.id} className="flex gap-3">
                <div className="mt-2 flex flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#51724f]" />
                  {index !== order.statusLogs.length - 1 ? (
                    <span className="min-h-16 w-px flex-1 bg-slate-200" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{log.action}</p>
                    <StatusPill
                      label={formatOrderStatusLabel(log.toStatus as OrderStatus)}
                      tone={statusTone(log.toStatus as OrderStatus)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {log.fromStatus ?? "không có"} → {log.toStatus}
                  </p>
                  {log.note ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {log.note}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                    {formatDate(log.createdAt)}
                    {log.changedBy ? ` · ${log.changedBy}` : ""}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Chưa có nhật ký trạng thái cho đơn này.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

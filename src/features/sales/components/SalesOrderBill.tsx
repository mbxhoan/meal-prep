import Link from "next/link";
import {
  StatusPill,
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

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
    <div className="space-y-5 pb-8">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Bill snapshot
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                {order.orderNo}
              </h1>
              <StatusPill
                label={formatLabel(order.status)}
                tone={statusTone(order.status as OrderStatus)}
              />
              <StatusPill
                label={formatLabel(order.paymentStatus)}
                tone={paymentStatusTone(order.paymentStatus)}
              />
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
              Bill chỉ đọc snapshot trong order. Không join lại bảng giá hiện hành
              để tránh bill lịch sử tự đổi theo master data.
            </p>
            <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Địa chỉ
                </p>
                <p className="mt-1 text-slate-700">
                  {order.customerAddressSnapshot ?? "Chưa có địa chỉ"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Snapshot price book
                </p>
                <p className="mt-1 text-slate-700">
                  {order.priceBookIdSnapshot
                    ? "Đã snapshot từ price book"
                    : "Legacy / no snapshot"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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
            <div className="rounded-[24px] border border-[#18352d]/10 bg-[#18352d] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Total
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Subtotal</span>
                  <span>{formatCurrency(order.subtotalBeforeDiscount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Discount</span>
                  <span>-{formatCurrency(order.orderDiscountAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Shipping</span>
                  <span>{formatCurrency(order.shippingFee)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Other fee</span>
                  <span>{formatCurrency(order.otherFee)}</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                <div className="flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Total amount</span>
                  <span className="font-medium text-white">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Paid</span>
                  <span>{formatCurrency(paidTotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Balance due</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Gross profit</span>
                  <span className="font-medium text-emerald-300">
                    {formatCurrency(order.grossProfit)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Margin</span>
                  <span>{formatPercent(order.grossMargin)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SalesOrderBillActions
        order={order}
        canRefreshPrice={canRefreshPrice}
        canUpdateStatus={canUpdateStatus}
        canRecordPayment={canRecordPayment}
      />

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Order items
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Snapshot line items
            </h2>
          </div>
          <StatusPill label={`${order.items.length} lines`} tone="muted" />
        </div>

        <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Món</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Unit price</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">COGS</th>
                <th className="px-4 py-3 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{item.itemNameSnapshot}</p>
                    <p className="mt-1 text-slate-500">
                      {item.variantLabelSnapshot ?? "Variant"} ·{" "}
                      {item.weightGramsSnapshot == null
                        ? "N/A"
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

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Status log
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Lịch sử chốt đơn
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {order.statusLogs.length > 0 ? (
            order.statusLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{log.action}</p>
                  <StatusPill
                    label={formatLabel(log.toStatus)}
                    tone={statusTone(log.toStatus as OrderStatus)}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {log.fromStatus ?? "none"} → {log.toStatus}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {formatDate(log.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Chưa có status log cho đơn này.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

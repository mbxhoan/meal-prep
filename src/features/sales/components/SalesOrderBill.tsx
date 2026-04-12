import Link from "next/link";
import {
  StatusPill,
  deliveryStatusTone,
  formatDeliveryStatusLabel,
  formatOrderTypeLabel,
  formatPaymentStatusLabel,
  orderTypeTone,
  paymentStatusTone,
} from "@/features/admin/components";
import { formatCurrency, formatDate, roundCurrency } from "@/lib/admin/format";
import type { SalesOrderDetailRecord } from "@/lib/sales/types";
import { SalesOrderBillActions } from "@/features/sales/components/SalesOrderBillActions";

function sumPayments(order: SalesOrderDetailRecord) {
  return order.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

function allocateDiscountAcrossLines(
  order: SalesOrderDetailRecord,
  totalDiscount: number,
) {
  const bases = order.items.map((item) =>
    Math.max(
      item.lineTotalBeforeDiscount ||
        item.lineTotalAfterDiscount ||
        item.quantity * item.unitPriceSnapshot,
      0,
    ),
  );
  const subtotal = bases.reduce((sum, value) => sum + value, 0);

  if (subtotal <= 0 || totalDiscount <= 0) {
    return bases.map(() => 0);
  }

  let remaining = roundCurrency(totalDiscount);

  return bases.map((base, index) => {
    if (index === bases.length - 1) {
      const lastValue = Math.max(Math.min(remaining, base), 0);
      remaining = roundCurrency(remaining - lastValue);
      return lastValue;
    }

    const proportion = base / subtotal;
    const value = Math.max(
      Math.min(roundCurrency(totalDiscount * proportion), base, remaining),
      0,
    );
    remaining = roundCurrency(remaining - value);
    return value;
  });
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
  const shippingAndSubtotal = roundCurrency(order.subtotalBeforeDiscount + order.shippingFee);
  const discountAllocations = allocateDiscountAcrossLines(order, order.orderDiscountAmount);

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Hóa đơn
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-base font-semibold tracking-tight text-slate-900">
                {order.orderNo}
              </h1>
              <StatusPill
                label={formatOrderTypeLabel(order.orderType ?? "order")}
                tone={orderTypeTone(order.orderType ?? "order")}
              />
              <StatusPill
                label={formatDeliveryStatusLabel(order.deliveryStatus ?? "pending")}
                tone={deliveryStatusTone(order.deliveryStatus ?? "pending")}
              />
              <StatusPill
                label={formatPaymentStatusLabel(order.paymentStatus ?? "unpaid")}
                tone={paymentStatusTone(order.paymentStatus ?? "unpaid")}
              />
            </div>
            <p className="mt-2 max-w-3xl text-[13px] leading-5 text-slate-500">
              Giá của đơn đã được giữ lại theo lúc lưu.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Khách hàng
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {order.customerNameSnapshot}
                </p>
                <p className="mt-1 text-slate-500">
                  {order.customerPhoneSnapshot ?? "Chưa có số"}
                </p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Nhân viên
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {order.employeeNameSnapshot ?? order.employeeId ?? "Chưa gắn"}
                </p>
                <p className="mt-1 text-slate-500">
                  {formatDate(order.orderedAt)}
                </p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Shipper
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {order.shipperName ?? "Chưa có"}
                </p>
                <p className="mt-1 text-slate-500">
                  {order.customerAddressSnapshot ?? "Chưa có địa chỉ"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:w-[360px]">
            <Link
              href="/admin/orders"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              Quay lại
            </Link>
            <div className="rounded-[20px] border border-[#18352d]/10 bg-[#18352d] p-4 text-white">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                Tổng hợp
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Tổng CHƯA SHIP</span>
                  <span>{formatCurrency(order.subtotalBeforeDiscount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Giảm giá</span>
                  <span>-{formatCurrency(order.orderDiscountAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Tổng CÓ SHIP</span>
                  <span>{formatCurrency(shippingAndSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/65">Sau giảm</span>
                  <span>{formatCurrency(Math.max(order.subtotalBeforeDiscount - order.orderDiscountAmount, 0))}</span>
                </div>
              </div>
              <div className="mt-3 rounded-[18px] border border-white/10 bg-white/6 px-3 py-2.5">
                <div className="flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>TỔNG THANH TOÁN</span>
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
                  <span>Phí ship</span>
                  <span>{formatCurrency(order.shippingFee)}</span>
                </div>
              </div>
              {!canRefreshPrice ? null : (
                <p className="mt-3 text-[12px] leading-5 text-white/55">
                  Giá bill đang khóa theo lúc lưu.
                </p>
              )}
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

      <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Dòng
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Chi tiết dòng
            </h2>
          </div>
          <StatusPill label={`${order.items.length} dòng`} tone="muted" />
        </div>

        <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Món</th>
                <th className="px-3 py-3 font-medium">Khối lượng</th>
                <th className="px-3 py-3 font-medium">SL</th>
                <th className="px-3 py-3 font-medium">Tổng trọng lượng</th>
                <th className="px-3 py-3 font-medium">Giá bán/gói</th>
                <th className="px-3 py-3 font-medium">Thành tiền</th>
                <th className="px-3 py-3 font-medium">Giá vốn/gói</th>
                <th className="px-3 py-3 font-medium">Tổng vốn</th>
                <th className="px-3 py-3 font-medium">Lãi/gói</th>
                <th className="px-3 py-3 font-medium">Giảm giá</th>
                <th className="px-3 py-3 font-medium">Lãi sau giảm</th>
                <th className="px-3 py-3 font-medium">Loại dòng</th>
                <th className="px-3 py-3 font-medium">Chi tiết combo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {order.items.map((item, index) => {
                const lineSubtotal =
                  item.lineTotalBeforeDiscount ||
                  item.lineTotalAfterDiscount ||
                  roundCurrency(item.quantity * item.unitPriceSnapshot);
                const lineCost = item.lineCostTotal || roundCurrency(item.quantity * item.standardCostSnapshot);
                const lineDiscount = discountAllocations[index] ?? 0;
                const lineAfterDiscount = Math.max(lineSubtotal - lineDiscount, 0);
                const lineProfitAfterDiscount = roundCurrency(lineAfterDiscount - lineCost);
                const weightTotal =
                  item.weightGramsSnapshot == null
                    ? null
                    : roundCurrency(item.weightGramsSnapshot * item.quantity);

                return (
                  <tr key={item.id} className="align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">
                        {item.itemNameSnapshot}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {item.variantLabelSnapshot ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {weightTotal == null ? "—" : `${weightTotal}g`}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{item.quantity}</td>
                    <td className="px-3 py-3 text-slate-700">
                      {weightTotal == null ? "—" : `${weightTotal}g`}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {formatCurrency(item.unitPriceSnapshot)}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {formatCurrency(lineSubtotal)}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {formatCurrency(item.standardCostSnapshot)}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {formatCurrency(lineCost)}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {formatCurrency(item.unitPriceSnapshot - item.standardCostSnapshot)}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {formatCurrency(lineDiscount)}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {formatCurrency(lineProfitAfterDiscount)}
                    </td>
                    <td className="px-3 py-3 text-slate-700">Món lẻ</td>
                    <td className="px-3 py-3 text-slate-500">—</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

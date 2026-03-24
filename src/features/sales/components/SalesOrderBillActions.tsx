"use client";

import { useActionState, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/admin/format";
import type { ActionState, OrderStatus } from "@/lib/admin/types";
import {
  recordSalesPaymentAction,
  refreshSalesOrderPriceAction,
  updateSalesOrderStatusAction,
} from "@/lib/sales/actions";
import type { SalesOrderDetailRecord } from "@/lib/sales/types";

const initialState: ActionState = {
  status: "idle",
  message: "",
  mode: "live",
};

const orderStatuses: OrderStatus[] = [
  "draft",
  "sent",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "completed",
  "cancelled",
];

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function SalesOrderBillActions({
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
  const paidTotal = useMemo(
    () => order.payments.reduce((sum, payment) => sum + payment.amount, 0),
    [order.payments],
  );
  const balanceDue = Math.max(order.totalAmount - paidTotal, 0);
  const [refreshState, refreshAction, refreshPending] = useActionState(
    refreshSalesOrderPriceAction,
    initialState,
  );
  const [statusState, statusAction, statusPending] = useActionState(
    updateSalesOrderStatusAction,
    initialState,
  );
  const [paymentState, paymentAction, paymentPending] = useActionState(
    recordSalesPaymentAction,
    initialState,
  );
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [paymentAmount, setPaymentAmount] = useState(String(balanceDue));
  const [paymentNote, setPaymentNote] = useState("");

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.3)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Snapshot refresh
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">
          Refresh giá cho draft
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          Chỉ áp dụng cho đơn draft. Sau sent/confirmed, giá snapshot không tự
          đổi nữa.
        </p>
        <form action={refreshAction} className="mt-4 space-y-3">
          <input
            type="hidden"
            name="payload"
            value={JSON.stringify({ orderId: order.id })}
          />
          <button
            type="submit"
            disabled={refreshPending || !canRefreshPrice || order.status !== "draft"}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshPending ? "Đang refresh..." : "Refresh giá từ price book"}
          </button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">
          {canRefreshPrice
            ? order.status === "draft"
              ? "Dữ liệu line item sẽ được snapshot lại từ price book hiện hành."
              : "Đơn không còn draft nên không thể refresh giá."
            : "Bạn chưa có quyền refresh giá."}
        </p>
        {refreshState.status !== "idle" ? (
          <p
            className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
              refreshState.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {refreshState.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.3)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Status update
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">
          Đổi trạng thái đơn
        </h3>
        <form action={statusAction} className="mt-4 space-y-3">
          <input
            type="hidden"
            name="payload"
            value={JSON.stringify({ orderId: order.id, status: selectedStatus })}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Trạng thái
            </span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)}
              disabled={!canUpdateStatus}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={statusPending || !canUpdateStatus}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {statusPending ? "Đang cập nhật..." : "Lưu trạng thái"}
          </button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">
          Trạng thái sent/confirmed sẽ khóa refresh giá tự động.
        </p>
        {statusState.status !== "idle" ? (
          <p
            className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
              statusState.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {statusState.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.3)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Payment
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">
          Ghi nhận thanh toán
        </h3>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <span>Paid</span>
            <span>{formatCurrency(paidTotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Balance due</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </div>
        <form action={paymentAction} className="mt-4 space-y-3">
          <input
            type="hidden"
            name="payload"
            value={JSON.stringify({
              orderId: order.id,
              amount: Number(paymentAmount || 0),
              paymentMethodId: null,
              note: paymentNote || null,
            })}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Số tiền
            </span>
            <input
              type="number"
              min="0"
              step="1000"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              disabled={!canRecordPayment}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Ghi chú
            </span>
            <input
              type="text"
              value={paymentNote}
              onChange={(event) => setPaymentNote(event.target.value)}
              disabled={!canRecordPayment}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Tiền mặt, chuyển khoản..."
            />
          </label>
          <button
            type="submit"
            disabled={paymentPending || !canRecordPayment}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paymentPending ? "Đang lưu..." : "Ghi nhận thanh toán"}
          </button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">
          Bill chỉ cập nhật payment_status từ snapshot thanh toán trong order.
        </p>
        {paymentState.status !== "idle" ? (
          <p
            className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
              paymentState.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {paymentState.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}

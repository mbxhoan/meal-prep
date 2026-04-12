"use client";

import { useActionState, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/admin/format";
import type { ActionState, DeliveryStatus } from "@/lib/admin/types";
import {
  GuardrailChecklist,
  StatusPill,
  deliveryStatusTone,
  formatDeliveryStatusLabel,
  formatPaymentStatusLabel,
  paymentStatusTone,
} from "@/features/admin/components";
import {
  recordSalesPaymentAction,
  updateSalesOrderDeliveryStatusAction,
} from "@/lib/sales/actions";
import type { SalesOrderDetailRecord } from "@/lib/sales/types";

const initialState: ActionState = {
  status: "idle",
  message: "",
  mode: "live",
};

export function SalesOrderBillActions({
  order,
  canUpdateStatus: canUpdateDeliveryStatus,
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
  const [deliveryState, deliveryAction, deliveryPending] = useActionState(
    updateSalesOrderDeliveryStatusAction,
    initialState,
  );
  const [paymentState, paymentAction, paymentPending] = useActionState(
    recordSalesPaymentAction,
    initialState,
  );
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState<DeliveryStatus>(
    order.deliveryStatus ?? "pending",
  );
  const [paymentAmount, setPaymentAmount] = useState(String(balanceDue));
  const [paymentNote, setPaymentNote] = useState("");

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.3)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Giao hàng
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              Trạng thái giao hàng
            </h3>
          </div>
          <StatusPill
            label={formatDeliveryStatusLabel(order.deliveryStatus ?? "pending")}
            tone={deliveryStatusTone(order.deliveryStatus ?? "pending")}
          />
        </div>

        <p className="mt-2 text-[13px] leading-5 text-slate-500">
          Chỉ đổi tình trạng giao hàng, không đụng giá của đơn.
        </p>

        <form
          action={deliveryAction}
          className="mt-4 space-y-3"
        >
          <input
            type="hidden"
            name="payload"
            value={JSON.stringify({
              orderId: order.id,
              deliveryStatus: selectedDeliveryStatus,
            })}
          />
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-slate-700">
              Trạng thái
            </span>
            <select
              value={selectedDeliveryStatus}
              onChange={(event) =>
                setSelectedDeliveryStatus(event.target.value as DeliveryStatus)
              }
              disabled={!canUpdateDeliveryStatus}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="pending">Chưa giao hàng</option>
              <option value="delivered">Đã giao hàng</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={deliveryPending || !canUpdateDeliveryStatus}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deliveryPending ? "Đang lưu..." : "Lưu giao hàng"}
          </button>
        </form>

        <p className="mt-3 text-[12px] leading-5 text-slate-500">
          {canUpdateDeliveryStatus
            ? "Đổi xong là trạng thái hiển thị ngay trong bảng đơn."
            : "Bạn chưa có quyền đổi trạng thái giao hàng."}
        </p>

        {deliveryState.status !== "idle" ? (
          <p
            className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
              deliveryState.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {deliveryState.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.3)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Tiền thu
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              Ghi tiền đã thu
            </h3>
          </div>
          <StatusPill
            label={formatPaymentStatusLabel(order.paymentStatus ?? "unpaid")}
            tone={paymentStatusTone(order.paymentStatus ?? "unpaid")}
          />
        </div>

        <GuardrailChecklist
          title="Trước khi ghi tiền"
          note="Tiền thu chỉ cộng thêm, không sửa lịch sử cũ."
          items={[
            "Đã kiểm tra số tiền.",
            "Đã chọn đúng đơn.",
            "Chỉ nhập phần vừa thu thêm.",
          ]}
        />

        <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <span>Đã thu</span>
            <span>{formatCurrency(paidTotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Còn phải thu</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </div>

        <form
          action={paymentAction}
          className="mt-4 space-y-3"
        >
          <input
            type="hidden"
            name="payload"
            value={JSON.stringify({
              orderId: order.id,
              amount: Number(paymentAmount || 0),
              paymentMethodId: null,
              note: paymentNote,
            })}
          />
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-slate-700">
              Số tiền đã thu
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
            <span className="mb-2 block text-[13px] font-medium text-slate-700">
              Ghi chú tiền thu
            </span>
            <input
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
            {paymentPending ? "Đang lưu..." : "Lưu tiền thu"}
          </button>
        </form>

        <p className="mt-3 text-[12px] leading-5 text-slate-500">
          {canRecordPayment
            ? "Có thể ghi nhiều lần nếu khách trả dần."
            : "Bạn chưa có quyền ghi nhận thanh toán."}
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

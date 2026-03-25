"use client";

import { useActionState, useMemo, useState } from "react";
import { recordInventoryMovementAction } from "@/lib/admin/actions";
import { formatCurrency } from "@/lib/admin/format";
import type { InventoryItem, InventoryMovementType } from "@/lib/admin/types";

const initialState = {
  status: "idle",
  message: "",
  mode: "demo",
} as const;

export function InventoryAdjustmentForm({ item }: { item: InventoryItem }) {
  const [movementType, setMovementType] = useState<InventoryMovementType>("purchase");
  const [quantity, setQuantity] = useState("0");
  const [unitCost, setUnitCost] = useState(String(item.lastPurchaseCost));
  const [notes, setNotes] = useState("");
  const [state, action, pending] = useActionState(
    recordInventoryMovementAction,
    initialState,
  );

  const signedQuantity = useMemo(() => {
    const parsed = Number(quantity || 0);

    if (movementType === "waste") {
      return -Math.abs(parsed);
    }

    return parsed;
  }, [movementType, quantity]);

  return (
    <form action={action} className="rounded-[28px] border border-slate-200 bg-white p-4">
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          inventoryItemId: item.id,
          movementType,
          quantityDelta: signedQuantity,
          unitCost: movementType === "purchase" ? Number(unitCost || 0) : null,
          notes,
        })}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            Tồn hiện tại {item.onHand} {item.unit} · Giá vốn TB{" "}
            {formatCurrency(item.averageUnitCost)}
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-500">
          Mã hàng {item.sku}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Loại
          </span>
          <select
            value={movementType}
            onChange={(event) => setMovementType(event.target.value as InventoryMovementType)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
          >
            <option value="purchase">Nhập kho</option>
            <option value="adjustment">Điều chỉnh</option>
            <option value="waste">Hao hụt</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Số lượng
          </span>
          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Giá nhập / đơn vị
          </span>
          <input
            type="number"
            step="0.01"
            value={unitCost}
            onChange={(event) => setUnitCost(event.target.value)}
            disabled={movementType !== "purchase"}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Ghi chú
          </span>
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            placeholder="Phiếu nhập, kiểm kê..."
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Biến động sẽ ghi vào <code>inventory_movements</code>. Trigger DB sẽ tự
          cập nhật tồn kho và cost bình quân.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : "Ghi nhận"}
        </button>
      </div>

      {state.status !== "idle" ? (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            state.status === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

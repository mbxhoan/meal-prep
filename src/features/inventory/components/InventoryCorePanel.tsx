"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/features/admin/components";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/admin/format";
import {
  postInventoryIssueAction,
  postInventoryReceiptAction,
  saveInventoryIssueAction,
  saveInventoryReceiptAction,
} from "@/lib/inventory/actions";
import type {
  InventoryCorePageData,
  InventoryIssueRecord,
  InventoryMovementRecord,
  InventoryReceiptRecord,
  InventoryStockByItemRecord,
  InventoryStockByLotRecord,
} from "@/lib/inventory/types";
import type { ActionState } from "@/lib/admin/types";

const initialActionState: ActionState = {
  status: "idle",
  message: "",
  mode: "live",
};

type PillTone = "success" | "warning" | "danger" | "muted" | "info" | "accent";

function toLocalDateTimeValue(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoFromLocalValue(value: string) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function makeDocumentNo(prefix: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto
    .randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

function formatStatusTone(status: string): PillTone {
  switch (status) {
    case "posted":
      return "success";
    case "cancelled":
    case "void":
      return "muted";
    default:
      return "warning";
  }
}

function formatStatusLabel(status: string) {
  switch (status) {
    case "posted":
      return "Posted";
    case "cancelled":
      return "Cancelled";
    default:
      return "Draft";
  }
}

function totalLineValue<T extends { qtyReceived?: number; qtyIssued?: number; unitCost?: number }>(
  items: T[],
) {
  return items.reduce((sum, item) => {
    const qty = item.qtyReceived ?? item.qtyIssued ?? 0;
    return sum + qty * (item.unitCost ?? 0);
  }, 0);
}

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

function stockItemMatches(item: InventoryStockByItemRecord, query: string) {
  return [
    item.itemName,
    item.sku,
    item.unit,
    item.supplierName ?? "",
    item.notes ?? "",
    item.trackingMode,
  ].some((value) => matchesQuery(value, query));
}

function lotMatches(item: InventoryStockByLotRecord, query: string) {
  return [
    item.itemName,
    item.sku,
    item.lotNo,
    item.lotBarcode ?? "",
    item.warehouseName ?? "",
    item.supplierName ?? "",
    item.notes ?? "",
  ].some((value) => matchesQuery(value, query));
}

function receiptMatches(item: InventoryReceiptRecord, query: string, itemLookup: Map<string, InventoryStockByItemRecord>) {
  return [
    item.receiptNo,
    item.warehouseName ?? "",
    item.supplierName ?? "",
    item.note ?? "",
    ...item.items.map((line) => itemLookup.get(line.itemId)?.itemName ?? ""),
  ].some((value) => matchesQuery(value, query));
}

function issueMatches(item: InventoryIssueRecord, query: string, itemLookup: Map<string, InventoryStockByItemRecord>) {
  return [
    item.issueNo,
    item.warehouseName ?? "",
    item.reasonCode ?? "",
    item.note ?? "",
    ...item.items.map((line) => itemLookup.get(line.itemId)?.itemName ?? ""),
  ].some((value) => matchesQuery(value, query));
}

function movementMatches(item: InventoryMovementRecord, query: string, itemLookup: Map<string, InventoryStockByItemRecord>) {
  return [
    item.movementType,
    item.referenceType ?? "",
    item.notes ?? "",
    itemLookup.get(item.itemId)?.itemName ?? "",
  ].some((value) => matchesQuery(value, query));
}

export function InventoryCorePanel({ data }: { data: InventoryCorePageData }) {
  const [query, setQuery] = useState("");
  const [receiptNo, setReceiptNo] = useState(() => makeDocumentNo("RCPT"));
  const [receiptReceivedAt, setReceiptReceivedAt] = useState(() =>
    toLocalDateTimeValue(),
  );
  const [receiptWarehouseId, setReceiptWarehouseId] = useState(
    data.warehouses[0]?.id ?? "",
  );
  const [receiptSupplierId, setReceiptSupplierId] = useState(
    data.suppliers[0]?.id ?? "",
  );
  const [receiptItemId, setReceiptItemId] = useState(
    data.stockByItem[0]?.itemId ?? "",
  );
  const [receiptQty, setReceiptQty] = useState("1");
  const [receiptUnitCost, setReceiptUnitCost] = useState(
    String(data.stockByItem[0]?.lastPurchaseCost ?? data.stockByItem[0]?.averageUnitCost ?? 0),
  );
  const [receiptLotNo, setReceiptLotNo] = useState("");
  const [receiptLotBarcode, setReceiptLotBarcode] = useState("");
  const [receiptManufacturedAt, setReceiptManufacturedAt] = useState("");
  const [receiptExpiredAt, setReceiptExpiredAt] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [receiptPostImmediately, setReceiptPostImmediately] = useState(false);

  const [issueNo, setIssueNo] = useState(() => makeDocumentNo("ISS"));
  const [issueIssuedAt, setIssueIssuedAt] = useState(() =>
    toLocalDateTimeValue(),
  );
  const [issueWarehouseId, setIssueWarehouseId] = useState(
    data.warehouses[0]?.id ?? "",
  );
  const [issueItemId, setIssueItemId] = useState(
    data.stockByItem[0]?.itemId ?? "",
  );
  const [issueQty, setIssueQty] = useState("1");
  const [issueLotId, setIssueLotId] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [issuePostImmediately, setIssuePostImmediately] = useState(false);

  const [receiptState, saveReceiptAction, savingReceipt] = useActionState(
    saveInventoryReceiptAction,
    initialActionState,
  );
  const [issueState, saveIssueAction, savingIssue] = useActionState(
    saveInventoryIssueAction,
    initialActionState,
  );
  const [postReceiptState, postReceiptAction, postingReceipt] = useActionState(
    postInventoryReceiptAction,
    initialActionState,
  );
  const [postIssueState, postIssueAction, postingIssue] = useActionState(
    postInventoryIssueAction,
    initialActionState,
  );

  const itemLookup = useMemo(
    () => new Map(data.stockByItem.map((item) => [item.itemId, item])),
    [data.stockByItem],
  );

  const queryTerm = query.trim().toLowerCase();

  const filteredStockByItem = data.stockByItem.filter((item) =>
    queryTerm.length === 0 ? true : stockItemMatches(item, queryTerm),
  );
  const filteredStockByLot = data.stockByLot.filter((item) =>
    queryTerm.length === 0 ? true : lotMatches(item, queryTerm),
  );
  const filteredReceipts = data.receipts.filter((item) =>
    queryTerm.length === 0 ? true : receiptMatches(item, queryTerm, itemLookup),
  );
  const filteredIssues = data.issues.filter((item) =>
    queryTerm.length === 0 ? true : issueMatches(item, queryTerm, itemLookup),
  );
  const filteredMovements = data.movements.filter((item) =>
    queryTerm.length === 0 ? true : movementMatches(item, queryTerm, itemLookup),
  );
  const filteredFefoCandidates = data.fefoCandidates.filter((item) =>
    queryTerm.length === 0 ? true : lotMatches(item, queryTerm),
  );

  const selectedReceiptItem = itemLookup.get(receiptItemId) ?? data.stockByItem[0] ?? null;
  const selectedIssueItem = itemLookup.get(issueItemId) ?? data.stockByItem[0] ?? null;
  const issueFefoOptions = useMemo(() => {
    const candidates = data.fefoCandidates.filter(
      (candidate) =>
        candidate.itemId === issueItemId &&
        (issueWarehouseId.length === 0 || candidate.warehouseId === issueWarehouseId),
    );

    return candidates;
  }, [data.fefoCandidates, issueItemId, issueWarehouseId]);

  useEffect(() => {
    if (!selectedReceiptItem) {
      return;
    }

    setReceiptUnitCost(
      String(
        selectedReceiptItem.lastPurchaseCost ||
          selectedReceiptItem.averageUnitCost ||
          0,
      ),
    );

    if (
      receiptExpiredAt.length === 0 &&
      selectedReceiptItem.defaultShelfLifeDays != null
    ) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + selectedReceiptItem.defaultShelfLifeDays);
      setReceiptExpiredAt(toLocalDateTimeValue(expiry));
    }
  }, [receiptExpiredAt.length, selectedReceiptItem]);

  useEffect(() => {
    if (issueFefoOptions.length === 0) {
      setIssueLotId("");
      return;
    }

    if (!issueFefoOptions.some((candidate) => candidate.lotId === issueLotId)) {
      setIssueLotId(issueFefoOptions[0].lotId);
    }
  }, [issueFefoOptions, issueLotId]);

  const receiptPayload = JSON.stringify({
    receiptNo,
    receivedAt: toIsoFromLocalValue(receiptReceivedAt),
    warehouseId: receiptWarehouseId,
    supplierId: receiptSupplierId || null,
    note: receiptNote || null,
    postImmediately: receiptPostImmediately,
    items: [
      {
        itemId: receiptItemId,
        qtyReceived: Number(receiptQty || 0),
        unitCost: Number(receiptUnitCost || 0),
        lotNoSnapshot: receiptLotNo || null,
        lotBarcodeSnapshot: receiptLotBarcode || null,
        manufacturedAt: receiptManufacturedAt
          ? toIsoFromLocalValue(receiptManufacturedAt)
          : null,
        expiredAt: receiptExpiredAt ? toIsoFromLocalValue(receiptExpiredAt) : null,
        note: receiptNote || null,
      },
    ],
  });

  const issuePayload = JSON.stringify({
    issueNo,
    issuedAt: toIsoFromLocalValue(issueIssuedAt),
    warehouseId: issueWarehouseId,
    note: issueNote || null,
    postImmediately: issuePostImmediately,
    items: [
      {
        itemId: issueItemId,
        qtyIssued: Number(issueQty || 0),
        lotId: issueLotId || null,
        suggestedLotId: issueFefoOptions[0]?.lotId ?? null,
        fefoOverrideReason:
          issueLotId && issueFefoOptions[0] && issueLotId !== issueFefoOptions[0].lotId
            ? issueNote || "Manual FEFO override"
            : null,
        note: issueNote || null,
      },
    ],
  });

  const totalStockValue = data.stockByItem.reduce(
    (sum, item) => sum + item.stockValue,
    0,
  );
  const lowStockCount = data.stockByItem.filter((item) => item.isLowStock).length;
  const expiredLotCount = data.stockByLot.filter((item) => item.isExpired).length;

  return (
    <div className="space-y-6 pb-8">
      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Stock value
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {formatCurrency(totalStockValue)}
          </p>
        </div>
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Items / lots
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {data.stockByItem.length} / {data.stockByLot.length}
          </p>
        </div>
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Low / expired
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {lowStockCount} / {expiredLotCount}
          </p>
        </div>
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Latest movement
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {data.movements[0] ? formatDate(data.movements[0].movementAt) : "N/A"}
          </p>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Inventory core
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Tồn theo item, lot, receipt và issue
            </h2>
          </div>
          <label className="w-full max-w-md">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Search
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              placeholder="Tìm item, lot, phiếu nhập/xuất..."
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <form action={saveReceiptAction} className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <input type="hidden" name="payload" value={receiptPayload} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Inventory receipt
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Tạo phiếu nhập
              </h3>
            </div>
            <StatusPill label="Draft" tone="warning" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Số phiếu
              </span>
              <input
                value={receiptNo}
                onChange={(event) => setReceiptNo(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Ngày nhập
              </span>
              <input
                type="datetime-local"
                value={receiptReceivedAt}
                onChange={(event) => setReceiptReceivedAt(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Kho
              </span>
              <select
                value={receiptWarehouseId}
                onChange={(event) => setReceiptWarehouseId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {data.warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Supplier
              </span>
              <select
                value={receiptSupplierId}
                onChange={(event) => setReceiptSupplierId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="">Không chọn</option>
                {data.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Item
              </span>
              <select
                value={receiptItemId}
                onChange={(event) => setReceiptItemId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {data.stockByItem.map((item) => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.itemName} · {item.sku}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Số lượng
              </span>
              <input
                type="number"
                step="0.001"
                min="0"
                value={receiptQty}
                onChange={(event) => setReceiptQty(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Giá vốn / unit
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={receiptUnitCost}
                onChange={(event) => setReceiptUnitCost(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Lot no
              </span>
              <input
                value={receiptLotNo}
                onChange={(event) => setReceiptLotNo(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Tự sinh khi để trống"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Lot barcode
              </span>
              <input
                value={receiptLotBarcode}
                onChange={(event) => setReceiptLotBarcode(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Barcode lô nếu có"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Manufactured at
              </span>
              <input
                type="datetime-local"
                value={receiptManufacturedAt}
                onChange={(event) => setReceiptManufacturedAt(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Expired at
              </span>
              <input
                type="datetime-local"
                value={receiptExpiredAt}
                onChange={(event) => setReceiptExpiredAt(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Ghi chú
            </span>
            <textarea
              rows={3}
              value={receiptNote}
              onChange={(event) => setReceiptNote(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </label>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={receiptPostImmediately}
              onChange={(event) => setReceiptPostImmediately(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#18352d] focus:ring-[#18352d]"
            />
            <span>Post ngay sau khi lưu</span>
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Phiếu nhập sẽ tạo lot + movement. Tồn cập nhật từ ledger, không
              chỉnh trực tiếp.
            </p>
            <button
              type="submit"
              disabled={savingReceipt}
              className="inline-flex items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingReceipt ? "Đang lưu..." : "Lưu phiếu nhập"}
            </button>
          </div>

          {receiptState.status !== "idle" ? (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                receiptState.status === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {receiptState.message}
            </p>
          ) : null}
        </form>

        <form action={saveIssueAction} className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <input type="hidden" name="payload" value={issuePayload} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Inventory issue
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Tạo phiếu xuất
              </h3>
            </div>
            <StatusPill label="Draft" tone="warning" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Số phiếu
              </span>
              <input
                value={issueNo}
                onChange={(event) => setIssueNo(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Ngày xuất
              </span>
              <input
                type="datetime-local"
                value={issueIssuedAt}
                onChange={(event) => setIssueIssuedAt(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Kho
              </span>
              <select
                value={issueWarehouseId}
                onChange={(event) => setIssueWarehouseId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {data.warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Item
              </span>
              <select
                value={issueItemId}
                onChange={(event) => setIssueItemId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {data.stockByItem.map((item) => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.itemName} · {item.sku}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Số lượng
              </span>
              <input
                type="number"
                step="0.001"
                min="0"
                value={issueQty}
                onChange={(event) => setIssueQty(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                FEFO lot gợi ý
              </span>
              <select
                value={issueLotId}
                onChange={(event) => setIssueLotId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="">Auto FEFO</option>
                {issueFefoOptions.map((lot) => (
                  <option key={lot.lotId} value={lot.lotId}>
                    {lot.lotNo} · {formatQuantity(lot.onHand, selectedIssueItem?.unit ?? "unit")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Ghi chú / override reason
              </span>
              <textarea
                rows={3}
                value={issueNote}
                onChange={(event) => setIssueNote(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Nếu chọn lot khác FEFO, ghi rõ lý do ở đây."
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={issuePostImmediately}
              onChange={(event) => setIssuePostImmediately(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#18352d] focus:ring-[#18352d]"
            />
            <span>Post ngay sau khi lưu</span>
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              FEFO được lưu vào draft. Khi post, DB sẽ tự chặn override nếu thiếu quyền.
            </p>
            <button
              type="submit"
              disabled={savingIssue}
              className="inline-flex items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingIssue ? "Đang lưu..." : "Lưu phiếu xuất"}
            </button>
          </div>

          {issueState.status !== "idle" ? (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                issueState.status === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {issueState.message}
            </p>
          ) : null}
        </form>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Stock by item
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Tồn theo item
            </h3>
          </div>
          <p className="text-sm text-slate-500">{filteredStockByItem.length} items</p>
        </div>
        <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">On hand</th>
                <th className="px-4 py-3 font-medium">Lot count</th>
                <th className="px-4 py-3 font-medium">Reorder</th>
                <th className="px-4 py-3 font-medium">AVG cost</th>
                <th className="px-4 py-3 font-medium">Stock value</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStockByItem.map((item) => (
                <tr key={`${item.shopId ?? "shop"}-${item.itemId}`}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{item.itemName}</p>
                    <p className="mt-1 text-slate-500">{item.sku}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {formatQuantity(item.onHand, item.unit)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {item.lotCount}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {formatQuantity(item.reorderPoint, item.unit)}
                  </td>
                  <td className="px-4 py-4 align-top font-medium text-slate-900">
                    {formatCurrency(item.averageUnitCost)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {formatCurrency(item.stockValue)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill
                      label={item.isLowStock ? "Low stock" : "Healthy"}
                      tone={item.isLowStock ? "warning" : "success"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Stock by lot
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Tồn theo lot / FEFO candidates
            </h3>
          </div>
            <p className="text-sm text-slate-500">{filteredStockByLot.length} rows</p>
          </div>
          <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                <th className="px-4 py-3 font-medium">Lot</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Warehouse</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">On hand</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStockByLot.map((lot) => (
                <tr key={lot.lotId}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{lot.lotNo}</p>
                    <p className="mt-1 text-slate-500">{lot.lotBarcode ?? "No barcode"}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{lot.itemName}</p>
                    <p className="mt-1 text-slate-500">{lot.sku}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {lot.warehouseName ?? "N/A"}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {lot.expiredAt ? formatDate(lot.expiredAt) : "N/A"}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {formatQuantity(lot.onHand, lot.unit)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill
                      label={lot.isExpired ? "Expired" : lot.isFefoEnabled ? "FEFO" : "Normal"}
                      tone={lot.isExpired ? "muted" : "success"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-medium text-slate-900">
            FEFO preview
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {filteredFefoCandidates.slice(0, 5).map((lot) => (
              <span
                key={lot.lotId}
                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {lot.lotNo} · #{lot.fefoRank}
              </span>
            ))}
            {filteredFefoCandidates.length === 0 ? (
              <span className="text-sm text-slate-500">
                Không có candidate FEFO phù hợp.
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Receipts
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Phiếu nhập gần đây
              </h3>
            </div>
            <p className="text-sm text-slate-500">{filteredReceipts.length} rows</p>
          </div>
          <div className="mt-5 space-y-3">
            {filteredReceipts.map((receipt) => (
              <div key={receipt.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {receipt.receiptNo} · {receipt.warehouseName ?? "N/A"}
                      </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {receipt.supplierName ?? "No supplier"} ·{" "}
                      {formatDate(receipt.createdAt)}
                    </p>
                  </div>
                  <StatusPill
                    label={formatStatusLabel(receipt.status)}
                    tone={formatStatusTone(receipt.status)}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>{receipt.items.length} lines</span>
                  <span>{formatCurrency(totalLineValue(receipt.items))}</span>
                </div>
                {receipt.status === "draft" && data.permissions.canPostReceipt ? (
                  <form action={postReceiptAction} className="mt-3">
                    <input type="hidden" name="payload" value={JSON.stringify({ receiptId: receipt.id, receiptNo: receipt.receiptNo })} />
                    <button
                      type="submit"
                      disabled={postingReceipt}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {postingReceipt ? "Posting..." : "Post"}
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
            {filteredReceipts.length === 0 ? (
              <p className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                Chưa có phiếu nhập phù hợp với filter hiện tại.
              </p>
            ) : null}
          </div>
          {postReceiptState.status !== "idle" ? (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                postReceiptState.status === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {postReceiptState.message}
            </p>
          ) : null}
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Issues
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Phiếu xuất gần đây
              </h3>
            </div>
            <p className="text-sm text-slate-500">{filteredIssues.length} rows</p>
          </div>
          <div className="mt-5 space-y-3">
            {filteredIssues.map((issue) => {
              const issueUnit =
                itemLookup.get(issue.items[0]?.itemId ?? "")?.unit ?? "unit";
              const issueTotalQty = issue.items.reduce(
                (sum, item) => sum + item.qtyIssued,
                0,
              );

              return (
                <div
                  key={issue.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {issue.issueNo} · {issue.warehouseName ?? "N/A"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {issue.reasonCode ?? "No reason"} ·{" "}
                        {formatDate(issue.createdAt)}
                      </p>
                    </div>
                    <StatusPill
                      label={formatStatusLabel(issue.status)}
                      tone={formatStatusTone(issue.status)}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>{issue.items.length} lines</span>
                    <span>{formatQuantity(issueTotalQty, issueUnit)}</span>
                  </div>
                  {issue.status === "draft" && data.permissions.canPostIssue ? (
                    <form action={postIssueAction} className="mt-3">
                      <input
                        type="hidden"
                        name="payload"
                        value={JSON.stringify({
                          issueId: issue.id,
                          issueNo: issue.issueNo,
                        })}
                      />
                      <button
                        type="submit"
                        disabled={postingIssue}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {postingIssue ? "Posting..." : "Post"}
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
            {filteredIssues.length === 0 ? (
              <p className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                Chưa có phiếu xuất phù hợp với filter hiện tại.
              </p>
            ) : null}
          </div>
          {postIssueState.status !== "idle" ? (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                postIssueState.status === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {postIssueState.message}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Movement ledger
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Giao dịch kho gần nhất
            </h3>
          </div>
          <p className="text-sm text-slate-500">{filteredMovements.length} rows</p>
        </div>
        <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Lot</th>
                <th className="px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredMovements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {formatDate(movement.movementAt)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">
                      {itemLookup.get(movement.itemId)?.itemName ?? movement.itemId}
                    </p>
                    <p className="mt-1 text-slate-500">{movement.notes ?? ""}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {movement.movementType}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {movement.quantityDelta >= 0 ? "+" : ""}
                    {formatQuantity(movement.quantityDelta, itemLookup.get(movement.itemId)?.unit ?? "unit")}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {movement.lotId ?? "N/A"}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {movement.referenceType ?? "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {receiptState.status !== "idle" && receiptState.message ? (
        <div className="sr-only">{receiptState.message}</div>
      ) : null}
    </div>
  );
}

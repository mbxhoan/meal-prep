"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { FaTriangleExclamation } from "react-icons/fa6";
import {
  ExportExcelButton,
  GuardrailChecklist,
  GuidedWorkflowCard,
  StatusPill,
} from "@/features/admin/components";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/admin/format";
import { createId } from "@/lib/id";
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
  return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${createId("doc")
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
      return "Đã ghi sổ";
    case "cancelled":
      return "Đã hủy";
    default:
      return "Bản nháp";
  }
}

function formatMovementTypeLabel(type: string) {
  switch (type) {
    case "purchase":
      return "Nhập kho";
    case "receipt":
      return "Phiếu nhập";
    case "issue":
      return "Phiếu xuất";
    case "adjustment":
      return "Điều chỉnh";
    case "waste":
      return "Hao hụt";
    case "order_consumption":
      return "Xuất cho đơn";
    default:
      return type;
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

  const stockItemExportRows = filteredStockByItem.map((item) => ({
    mặt_hàng: item.itemName,
    sku: item.sku,
    đơn_vị: item.unit,
    tồn_kho: formatQuantity(item.onHand, item.unit),
    số_lô: item.lotCount,
    mức_đặt_hàng: formatQuantity(item.reorderPoint, item.unit),
    avg_cost: formatCurrency(item.averageUnitCost),
    giá_trị_tồn: formatCurrency(item.stockValue),
    trạng_thái: item.isLowStock ? "Tồn thấp" : "Bình thường",
  }));

  const stockLotExportRows = filteredStockByLot.map((lot) => ({
    lô: lot.lotNo,
    mã_vạch_lô: lot.lotBarcode ?? "",
    mặt_hàng: lot.itemName,
    sku: lot.sku,
    kho: lot.warehouseName ?? "",
    hạn_sử_dụng: lot.expiredAt ? formatDate(lot.expiredAt) : "Không có",
    tồn_kho: formatQuantity(lot.onHand, lot.unit),
    trạng_thái: lot.isExpired ? "Hết hạn" : lot.isFefoEnabled ? "FEFO" : "Bình thường",
  }));

  const receiptExportRows = filteredReceipts.map((receipt) => ({
    số_phiếu: receipt.receiptNo,
    kho: receipt.warehouseName ?? "",
    nhà_cung_cấp: receipt.supplierName ?? "",
    ngày_nhập: formatDate(receipt.receivedAt),
    trạng_thái: formatStatusLabel(receipt.status),
    số_dòng: receipt.items.length,
    tổng_giá_trị: formatCurrency(totalLineValue(receipt.items)),
  }));

  const issueExportRows = filteredIssues.map((issue) => ({
    số_phiếu: issue.issueNo,
    kho: issue.warehouseName ?? "",
    lý_do: issue.reasonCode ?? "",
    ngày_xuất: formatDate(issue.issuedAt),
    trạng_thái: formatStatusLabel(issue.status),
    số_dòng: issue.items.length,
    tổng_số_lượng: formatQuantity(
      issue.items.reduce((sum, item) => sum + item.qtyIssued, 0),
      itemLookup.get(issue.items[0]?.itemId ?? "")?.unit ?? "unit",
    ),
  }));

  const movementExportRows = filteredMovements.map((movement) => ({
    thời_gian: formatDate(movement.movementAt),
    mặt_hàng: itemLookup.get(movement.itemId)?.itemName ?? movement.itemId,
    loại: formatMovementTypeLabel(movement.movementType),
    số_lượng: formatQuantity(
      movement.quantityDelta,
      itemLookup.get(movement.itemId)?.unit ?? "unit",
    ),
    lô: movement.lotId ?? "",
    tham_chiếu: movement.referenceType ?? "",
    ghi_chú: movement.notes ?? "",
  }));

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
  const receiptRequiresExpiry = Boolean(
    selectedReceiptItem?.isExpirable && receiptExpiredAt.length === 0,
  );
  const issueFefoOverride =
    issueLotId.length > 0 &&
    Boolean(issueFefoOptions[0]) &&
    issueLotId !== issueFefoOptions[0].lotId;

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
            ? issueNote || "Ghi đè FEFO thủ công"
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
    <div className="space-y-4 pb-8">
      <GuidedWorkflowCard
        eyebrow="Quy trình kho"
        title="Nhập, xuất, ghi sổ"
        description="Dùng nháp trước, kiểm FEFO rồi mới ghi sổ."
        steps={[
          "Xem cảnh báo trước.",
          "Tạo phiếu và chọn lô.",
          "Rà HSD và lý do override.",
          "Ghi sổ khi đã đủ.",
        ]}
      />

      <section className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Giá trị tồn
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {formatCurrency(totalStockValue)}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Mặt hàng / lô
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {data.stockByItem.length} / {data.stockByLot.length}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Tồn thấp / hết hạn
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {lowStockCount} / {expiredLotCount}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Giao dịch gần nhất
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {data.movements[0] ? formatDate(data.movements[0].movementAt) : "Không có"}
            </p>
          </div>
        </div>

        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
              <FaTriangleExclamation className="text-sm" />
            </div>
            <p className="text-sm leading-6 text-amber-900/85">
              Tồn chỉ đổi qua phiếu. Hàng có HSD ưu tiên FEFO.
            </p>
          </div>
        </div>

        <div className="rounded-[20px] border border-sky-200 bg-sky-50 px-4 py-3">
          <p className="text-sm font-semibold text-sky-900">
            Rà nhanh
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
            <GuardrailChecklist
              title="Phiếu nhập"
              note="Ghi sổ sẽ tạo movement."
              items={[
                "Kho và nhà cung cấp đã đúng.",
                "Mã lô, HSD và giá vốn đã rà.",
                "Item có HSD thì không để trống.",
              ]}
            />
            <GuardrailChecklist
              title="Phiếu xuất"
              tone="warning"
              note="FEFO là mặc định."
              items={[
                "Đã kiểm tra lô gợi ý.",
                "Số lượng không vượt tồn.",
                "Override thì có lý do.",
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExportExcelButton
            filename={`ton-theo-item-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Tồn theo mặt hàng"
            title="Xuất Excel tồn theo mặt hàng"
            columns={[
              { key: "mặt_hàng", label: "Mặt hàng" },
              { key: "sku", label: "Mã hàng" },
              { key: "đơn_vị", label: "Đơn vị" },
              { key: "tồn_kho", label: "Tồn kho" },
              { key: "số_lô", label: "Số lô" },
              { key: "mức_đặt_hàng", label: "Mức đặt hàng" },
              { key: "avg_cost", label: "Giá vốn TB" },
              { key: "giá_trị_tồn", label: "Giá trị tồn" },
              { key: "trạng_thái", label: "Trạng thái" },
            ]}
            rows={stockItemExportRows}
          />
          <ExportExcelButton
            filename={`ton-theo-lo-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Tồn theo lô"
            title="Xuất Excel tồn theo lô"
            columns={[
              { key: "lô", label: "Lô" },
              { key: "mã_vạch_lô", label: "Mã vạch lô" },
              { key: "mặt_hàng", label: "Mặt hàng" },
              { key: "sku", label: "Mã hàng" },
              { key: "kho", label: "Kho" },
              { key: "hạn_sử_dụng", label: "Hạn sử dụng" },
              { key: "tồn_kho", label: "Tồn kho" },
              { key: "trạng_thái", label: "Trạng thái" },
            ]}
            rows={stockLotExportRows}
          />
          <ExportExcelButton
            filename={`phieu-nhap-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Phiếu nhập"
            title="Xuất Excel phiếu nhập"
            columns={[
              { key: "số_phiếu", label: "Số phiếu" },
              { key: "kho", label: "Kho" },
              { key: "nhà_cung_cấp", label: "Nhà cung cấp" },
              { key: "ngày_nhập", label: "Ngày nhập" },
              { key: "trạng_thái", label: "Trạng thái" },
              { key: "số_dòng", label: "Số dòng" },
              { key: "tổng_giá_trị", label: "Tổng giá trị" },
            ]}
            rows={receiptExportRows}
          />
          <ExportExcelButton
            filename={`phieu-xuat-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Phiếu xuất"
            title="Xuất Excel phiếu xuất"
            columns={[
              { key: "số_phiếu", label: "Số phiếu" },
              { key: "kho", label: "Kho" },
              { key: "lý_do", label: "Lý do" },
              { key: "ngày_xuất", label: "Ngày xuất" },
              { key: "trạng_thái", label: "Trạng thái" },
              { key: "số_dòng", label: "Số dòng" },
              { key: "tổng_số_lượng", label: "Tổng số lượng" },
            ]}
            rows={issueExportRows}
          />
          <ExportExcelButton
            filename={`so-giao-dich-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Sổ giao dịch"
            title="Xuất Excel sổ giao dịch"
            columns={[
              { key: "thời_gian", label: "Thời gian" },
              { key: "mặt_hàng", label: "Mặt hàng" },
              { key: "loại", label: "Loại" },
              { key: "số_lượng", label: "Số lượng" },
              { key: "lô", label: "Lô" },
              { key: "tham_chiếu", label: "Tham chiếu" },
              { key: "ghi_chú", label: "Ghi chú" },
            ]}
            rows={movementExportRows}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Tồn kho
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Theo mặt hàng, lô và phiếu
            </h2>
          </div>
          <label className="w-full max-w-md">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Tìm kiếm
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              placeholder="Tìm mặt hàng, lô, phiếu..."
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <form
          action={saveReceiptAction}
          className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]"
          onSubmit={(event) => {
            if (
              receiptPostImmediately &&
              !window.confirm(
                `Ghi sổ phiếu nhập ngay? ${receiptRequiresExpiry ? "Item này có HSD, hãy kiểm tra hạn sử dụng. " : ""}Tồn sẽ đi qua sổ kho.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="payload" value={receiptPayload} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Phiếu nhập kho
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Phiếu nhập</h3>
            </div>
            <StatusPill label="Bản nháp" tone="warning" />
          </div>

          <GuardrailChecklist
            title="Trước khi lưu phiếu nhập"
            note="Nháp vẫn cần đủ lô và HSD."
            items={[
              "Kho, nhà cung cấp và mặt hàng đã đúng.",
              "Số lượng, giá vốn và mã lô đã rà.",
              "Item có HSD thì đã nhập.",
            ]}
          />

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
                Nhà cung cấp
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
                Mặt hàng
              </span>
              <select
                value={receiptItemId}
                onChange={(event) => setReceiptItemId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {data.stockByItem.map((item) => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.itemName} · Mã {item.sku}
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
                Giá vốn / đơn vị
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
                Số lô
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
                Mã vạch lô
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
                Ngày sản xuất
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
                Hạn sử dụng
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
            <span>Ghi sổ ngay sau khi lưu</span>
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Lưu xong sẽ tạo lô và movement. Không sửa trực tiếp số tồn.
            </p>
            <button
              type="submit"
              disabled={savingReceipt}
              className="inline-flex items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingReceipt ? "Đang lưu..." : "Lưu"}
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

        <form
          action={saveIssueAction}
          className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]"
          onSubmit={(event) => {
            if (
              issuePostImmediately &&
              !window.confirm(
                `Ghi sổ phiếu xuất ngay? ${issueFefoOverride ? "Bạn đang chọn lô khác FEFO. " : ""}Tồn sẽ đi qua sổ kho.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="payload" value={issuePayload} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Phiếu xuất kho
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Phiếu xuất</h3>
            </div>
            <StatusPill label="Bản nháp" tone="warning" />
          </div>

          <GuardrailChecklist
            title="Trước khi lưu phiếu xuất"
            tone="warning"
            note="FEFO là mặc định."
            items={[
              "Phiếu liên kết đúng đơn hoặc lý do.",
              "Đã kiểm tra lô gợi ý.",
              "Override thì có lý do.",
            ]}
          />

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
                Mặt hàng
              </span>
              <select
                value={issueItemId}
                onChange={(event) => setIssueItemId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {data.stockByItem.map((item) => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.itemName} · Mã {item.sku}
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
                Lô FEFO
              </span>
              <select
                value={issueLotId}
                onChange={(event) => setIssueLotId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="">Tự động</option>
                {issueFefoOptions.map((lot) => (
                  <option key={lot.lotId} value={lot.lotId}>
                    {lot.lotNo} · {formatQuantity(lot.onHand, selectedIssueItem?.unit ?? "unit")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Ghi chú
              </span>
              <textarea
                rows={3}
                value={issueNote}
                onChange={(event) => setIssueNote(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Nếu đổi lô, ghi lý do."
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
            <span>Ghi sổ ngay sau khi lưu</span>
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              FEFO lưu vào phiếu nháp. Ghi sổ sẽ chặn nếu thiếu quyền.
            </p>
            <button
              type="submit"
              disabled={savingIssue}
              className="inline-flex items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingIssue ? "Đang lưu..." : "Lưu"}
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
              Tồn theo mặt hàng
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Theo mặt hàng</h3>
          </div>
          <p className="text-sm text-slate-500">{filteredStockByItem.length} dòng</p>
        </div>
        <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Mặt hàng</th>
                <th className="px-4 py-3 font-medium">Tồn</th>
                <th className="px-4 py-3 font-medium">Số lô</th>
                <th className="px-4 py-3 font-medium">Mức đặt hàng</th>
                <th className="px-4 py-3 font-medium">Giá vốn TB</th>
                <th className="px-4 py-3 font-medium">Giá trị tồn</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStockByItem.map((item) => (
                <tr key={`${item.shopId ?? "shop"}-${item.itemId}`}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{item.itemName}</p>
                    <p className="mt-1 text-slate-500">Mã hàng: {item.sku}</p>
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
                      label={item.isLowStock ? "Tồn thấp" : "Bình thường"}
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
              Tồn theo lô
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Theo lô</h3>
          </div>
          <p className="text-sm text-slate-500">{filteredStockByLot.length} dòng</p>
          </div>
          <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                <th className="px-4 py-3 font-medium">Lô</th>
                <th className="px-4 py-3 font-medium">Mặt hàng</th>
                <th className="px-4 py-3 font-medium">Kho</th>
                <th className="px-4 py-3 font-medium">Hạn</th>
                <th className="px-4 py-3 font-medium">Tồn</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStockByLot.map((lot) => (
                <tr key={lot.lotId}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{lot.lotNo}</p>
                    <p className="mt-1 text-slate-500">{lot.lotBarcode ?? "Không có mã"}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{lot.itemName}</p>
                    <p className="mt-1 text-slate-500">{lot.sku}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {lot.warehouseName ?? "Không có"}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {lot.expiredAt ? formatDate(lot.expiredAt) : "Không có"}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {formatQuantity(lot.onHand, lot.unit)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill
                      label={lot.isExpired ? "Hết hạn" : lot.isFefoEnabled ? "FEFO" : "Bình thường"}
                      tone={lot.isExpired ? "muted" : "success"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-medium text-slate-900">Gợi ý FEFO</p>
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
                Không có gợi ý FEFO.
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Phiếu nhập
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Phiếu nhập</h3>
            </div>
            <p className="text-sm text-slate-500">{filteredReceipts.length} dòng</p>
          </div>
          <div className="mt-5 space-y-3">
            {filteredReceipts.map((receipt) => (
              <div key={receipt.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {receipt.receiptNo} · {receipt.warehouseName ?? "Không có"}
                      </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {receipt.supplierName ?? "Không có nhà cung cấp"} ·{" "}
                      {formatDate(receipt.createdAt)}
                    </p>
                  </div>
                  <StatusPill
                    label={formatStatusLabel(receipt.status)}
                    tone={formatStatusTone(receipt.status)}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>{receipt.items.length} dòng</span>
                  <span>{formatCurrency(totalLineValue(receipt.items))}</span>
                </div>
                {receipt.status === "draft" && data.permissions.canPostReceipt ? (
                  <form
                    action={postReceiptAction}
                    className="mt-3"
                    onSubmit={(event) => {
                      if (
                        !window.confirm(
                          "Ghi sổ phiếu nhập ngay? Hãy chắc chắn kho, item, số lượng, giá vốn và HSD đều đúng.",
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="payload" value={JSON.stringify({ receiptId: receipt.id, receiptNo: receipt.receiptNo })} />
                    <button
                      type="submit"
                      disabled={postingReceipt}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {postingReceipt ? "Đang ghi sổ..." : "Ghi sổ"}
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
            {filteredReceipts.length === 0 ? (
              <p className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                Chưa có phiếu nhập phù hợp với bộ lọc hiện tại.
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

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                Phiếu xuất
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Phiếu xuất</h3>
            </div>
            <p className="text-sm text-slate-500">{filteredIssues.length} dòng</p>
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
                  className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {issue.issueNo} · {issue.warehouseName ?? "Không có"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {issue.reasonCode ?? "Không có lý do"} ·{" "}
                        {formatDate(issue.createdAt)}
                      </p>
                    </div>
                    <StatusPill
                      label={formatStatusLabel(issue.status)}
                      tone={formatStatusTone(issue.status)}
                    />
                  </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>{issue.items.length} dòng</span>
                  <span>{formatQuantity(issueTotalQty, issueUnit)}</span>
                </div>
                {issue.status === "draft" && data.permissions.canPostIssue ? (
                  <form
                    action={postIssueAction}
                    className="mt-3"
                    onSubmit={(event) => {
                      if (
                        !window.confirm(
                          "Ghi sổ phiếu xuất ngay? Hãy chắc chắn FEFO, lô chọn và số lượng đều đúng.",
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
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
                        {postingIssue ? "Đang ghi sổ..." : "Ghi sổ"}
                      </button>
                  </form>
                ) : null}
                </div>
              );
            })}
            {filteredIssues.length === 0 ? (
              <p className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                Chưa có phiếu xuất phù hợp với bộ lọc hiện tại.
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

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Sổ giao dịch kho
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Sổ giao dịch</h3>
          </div>
          <p className="text-sm text-slate-500">{filteredMovements.length} dòng</p>
        </div>
        {filteredMovements.length > 0 ? (
          <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-medium text-slate-900">Gần đây</p>
            <div className="mt-3 space-y-3">
              {filteredMovements.slice(0, 5).map((movement) => (
                <div key={movement.id} className="flex gap-3">
                  <div className="mt-2 flex flex-col items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#51724f]" />
                    <span className="min-h-8 w-px flex-1 bg-slate-200" />
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="text-sm font-medium text-slate-900">
                      {formatMovementTypeLabel(movement.movementType)} ·{" "}
                      {itemLookup.get(movement.itemId)?.itemName ?? movement.itemId}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(movement.movementAt)} ·{" "}
                      {movement.quantityDelta >= 0 ? "+" : ""}
                      {formatQuantity(
                        movement.quantityDelta,
                        itemLookup.get(movement.itemId)?.unit ?? "unit",
                      )}
                      {movement.lotId ? ` · Lô ${movement.lotId}` : ""}
                    </p>
                    {movement.notes ? (
                      <p className="mt-1 text-xs leading-6 text-slate-400">
                        {movement.notes}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium">Mặt hàng</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium">Số lượng</th>
                <th className="px-4 py-3 font-medium">Lô</th>
                <th className="px-4 py-3 font-medium">Tham chiếu</th>
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
                    {formatMovementTypeLabel(movement.movementType)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {movement.quantityDelta >= 0 ? "+" : ""}
                    {formatQuantity(movement.quantityDelta, itemLookup.get(movement.itemId)?.unit ?? "unit")}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {movement.lotId ?? "Không có"}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {movement.referenceType ?? "Không có"}
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

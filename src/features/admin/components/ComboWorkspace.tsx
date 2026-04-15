"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { FaPlus, FaRotateLeft, FaTrash } from "react-icons/fa6";
import { StatusPill } from "@/features/admin/components/StatusPill";
import {
  deleteMasterDataAction,
  saveMasterDataAction,
} from "@/lib/master-data/actions";
import type {
  MasterDataOptionGroup,
  MasterDataOption,
  MasterDataRow,
} from "@/lib/master-data/types";
import { getNestedValue } from "@/lib/master-data/validation";
import type { ActionState } from "@/lib/admin/types";
import { createId } from "@/lib/id";
import { formatCurrency } from "@/lib/admin/format";
import {
  StickyFormFooter,
  getSelectClassName,
  getTextFieldClassName,
  getTextareaClassName,
} from "@/features/admin/components/form-ux";

const initialState: ActionState = {
  status: "idle",
  message: "",
  mode: "live",
};

type ComboItemDraft = {
  id: string;
  recordId: string | null;
  comboId: string;
  productVariantId: string;
  legacyMenuItemVariantId: string;
  quantity: string;
  sortOrder: string;
  notes: string;
  isActive: boolean;
};

function normalizeOptionLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildVariantLabelFromRow(row: MasterDataRow) {
  const productName = String(
    getNestedValue(row, "product_variants.products.name") ??
      getNestedValue(row, "menu_item_variants.menu_items.name") ??
      "",
  ).trim();
  const variantLabel = String(
    getNestedValue(row, "product_variants.label") ??
      getNestedValue(row, "menu_item_variants.label") ??
      "",
  ).trim();
  const weightValue =
    getNestedValue(row, "product_variants.weight_in_grams") ??
    getNestedValue(row, "menu_item_variants.weight_grams");
  const weightLabel =
    weightValue == null || String(weightValue).trim().length === 0
      ? ""
      : `${weightValue}g`;

  return [productName, variantLabel, weightLabel].filter(Boolean).join(" · ");
}

function buildProductVariantLookup(options: MasterDataOption[]) {
  const lookup = new Map<string, string>();

  for (const option of options) {
    const key = normalizeOptionLabel(option.label);

    if (!lookup.has(key)) {
      lookup.set(key, option.value);
    }
  }

  return lookup;
}

function firstOptionGroup(
  optionGroups: MasterDataOptionGroup[],
  key: MasterDataOptionGroup["key"],
) {
  return optionGroups.find((group) => group.key === key) ?? null;
}

function toComboDraft(combo: MasterDataRow | null) {
  if (!combo) {
    return {
      code: "",
      name: "",
      salePrice: "",
      notes: "",
      isActive: true,
    };
  }

  return {
    code: String(combo.code ?? ""),
    name: String(combo.name ?? ""),
    salePrice: String(combo.sale_price ?? 0),
    notes: String(combo.notes ?? ""),
    isActive: combo.is_active !== false,
  };
}

function toComboItemDraft(
  row: MasterDataRow | null,
  fallbackComboId: string,
  variantLookup?: Map<string, string>,
) {
  if (!row) {
    return {
      id: createId("combo-item"),
      comboId: fallbackComboId,
      recordId: null,
      productVariantId: "",
      legacyMenuItemVariantId: "",
      quantity: "1",
      sortOrder: "0",
      notes: "",
      isActive: true,
    };
  }

  const productVariantId = String(row.product_variant_id ?? "").trim();
  const legacyMenuItemVariantId = String(row.menu_item_variant_id ?? "").trim();
  const resolvedProductVariantId =
    productVariantId.length > 0
      ? productVariantId
      : variantLookup?.get(normalizeOptionLabel(buildVariantLabelFromRow(row))) ?? "";

  return {
    id: String(row.id ?? createId("combo-item")),
    recordId: String(row.id ?? ""),
    comboId: String(row.combo_id ?? fallbackComboId),
    productVariantId: resolvedProductVariantId,
    legacyMenuItemVariantId:
      resolvedProductVariantId.length > 0 ? "" : legacyMenuItemVariantId,
    quantity: String(row.quantity ?? 1),
    sortOrder: String(row.sort_order ?? 0),
    notes: String(row.notes ?? ""),
    isActive: row.is_active !== false,
  };
}

function makeQuickComboItemDraft(comboId: string): ComboItemDraft {
  return {
    id: createId("combo-item"),
    recordId: null,
    comboId,
    productVariantId: "",
    legacyMenuItemVariantId: "",
    quantity: "1",
    sortOrder: "0",
    notes: "",
    isActive: true,
  };
}

export function ComboWorkspace({
  combos,
  comboItems,
  comboItemOptionGroups,
  productVariantOptions = [],
}: {
  combos: MasterDataRow[];
  comboItems: MasterDataRow[];
  comboItemOptionGroups: MasterDataOptionGroup[];
  productVariantOptions?: MasterDataOption[];
}) {
  const existingComboIds = useMemo(
    () => new Set(combos.map((combo) => combo.id)),
    [combos],
  );
  const [selectedComboId, setSelectedComboId] = useState<string>(
    combos[0]?.id ?? createId("combo"),
  );
  const selectedCombo =
    combos.find((combo) => combo.id === selectedComboId) ?? null;
  const comboExists = existingComboIds.has(selectedComboId);

  const [comboDraft, setComboDraft] = useState(() =>
    toComboDraft(selectedCombo),
  );
  const [quickItemDrafts, setQuickItemDrafts] = useState<ComboItemDraft[]>(
    () => [],
  );

  const [comboState, comboAction, comboPending] = useActionState(
    saveMasterDataAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteMasterDataAction,
    initialState,
  );

  const comboItemVariantOptions =
    productVariantOptions.length > 0
      ? productVariantOptions
      : firstOptionGroup(comboItemOptionGroups, "product_variants")?.options ??
        firstOptionGroup(comboItemOptionGroups, "menu_item_variants")?.options ??
        [];
  const productVariantLookupByLabel = useMemo(
    () => buildProductVariantLookup(comboItemVariantOptions),
    [comboItemVariantOptions],
  );

  const selectedComboItems = useMemo(
    () =>
      comboItems
        .filter((row) => String(row.combo_id ?? "") === selectedComboId)
        .filter((row) => row.deleted_at == null && row.is_active !== false)
        .sort((left, right) => {
          const leftOrder = Number(left.sort_order ?? 0);
          const rightOrder = Number(right.sort_order ?? 0);

          return leftOrder - rightOrder;
        }),
    [comboItems, selectedComboId],
  );

  const selectedComboItemCount = selectedComboItems.length;
  const selectedComboTotalCost = useMemo(
    () =>
      selectedComboItems.reduce(
        (sum, row) => sum + Number(row.line_cost_total ?? 0),
        0,
      ),
    [selectedComboItems],
  );
  const selectedComboActualSalePrice = useMemo(
    () =>
      selectedComboItems.reduce(
        (sum, row) => sum + Number(row.line_sale_total ?? 0),
        0,
      ),
    [selectedComboItems],
  );
  const selectedComboDefaultSalePrice = selectedCombo
    ? Number(selectedCombo.default_sale_price ?? 0)
    : 0;
  const selectedComboLabel = selectedCombo
    ? [selectedCombo.code, selectedCombo.name].filter(Boolean).join(" · ")
    : "Combo mới chưa lưu";

  useEffect(() => {
    setComboDraft(toComboDraft(selectedCombo));
  }, [selectedCombo]);

  useEffect(() => {
    const nextDrafts = selectedComboItems.length > 0
      ? selectedComboItems.map((row) =>
          toComboItemDraft(row, selectedComboId, productVariantLookupByLabel),
        )
      : [makeQuickComboItemDraft(selectedComboId)];

    setQuickItemDrafts(nextDrafts);
  }, [productVariantLookupByLabel, selectedComboId, selectedComboItems]);

  const handleCreateNewCombo = () => {
    const nextId = createId("combo");
    setSelectedComboId(nextId);
    setComboDraft(toComboDraft(null));
    setQuickItemDrafts([makeQuickComboItemDraft(nextId)]);
  };

  const appendQuickItemDraft = () => {
    setQuickItemDrafts((current) => [...current, makeQuickComboItemDraft(selectedComboId)]);
  };

  const updateQuickItemDraft = (
    draftId: string,
    updater: (current: ComboItemDraft) => ComboItemDraft,
  ) => {
    setQuickItemDrafts((current) =>
      current.map((draft) => (draft.id === draftId ? updater(draft) : draft)),
    );
  };

  const removeQuickItemDraft = (draftId: string) => {
    setQuickItemDrafts((current) => {
      const remaining = current.filter((draft) => draft.id !== draftId);

      return remaining.length > 0
        ? remaining
        : [makeQuickComboItemDraft(selectedComboId)];
    });
  };

  const comboItemPayloads = useMemo(
    () =>
      quickItemDrafts
        .filter(
          (draft) =>
            draft.productVariantId.trim().length > 0 ||
            draft.legacyMenuItemVariantId.trim().length > 0,
        )
        .map((draft) => ({
          recordId: draft.recordId,
          productVariantId: draft.productVariantId,
          menuItemVariantId: draft.legacyMenuItemVariantId,
          quantity: draft.quantity,
          sortOrder: draft.sortOrder,
          notes: draft.notes,
          isActive: draft.isActive,
        })),
    [quickItemDrafts],
  );

  const comboItemVariantIds = comboItemPayloads.map((item) =>
    item.productVariantId.trim() || item.menuItemVariantId.trim(),
  );

  const quickItemHasDuplicates =
    new Set(comboItemVariantIds).size !== comboItemVariantIds.length;

  const quickItemHasInvalidRows = comboItemPayloads.some(
    (item) => Number(item.quantity) <= 0 || !Number.isFinite(Number(item.quantity)),
  );

  const comboCanSave =
    comboDraft.code.trim().length > 0 &&
    comboDraft.name.trim().length > 0 &&
    Number(comboDraft.salePrice) > 0 &&
    !quickItemHasDuplicates &&
    !quickItemHasInvalidRows;

  const comboPayload = JSON.stringify({
    entity: "combos",
    recordId: selectedComboId,
    values: {
      code: comboDraft.code,
      name: comboDraft.name,
      sale_price: comboDraft.salePrice,
      notes: comboDraft.notes,
      is_active: comboDraft.isActive,
      comboItems: comboItemPayloads,
    },
  });

  const selectedComboItemSummary = `${selectedComboItemCount} dòng · ${formatCurrency(
    selectedComboDefaultSalePrice,
  )} mặc định`;

  return (
    <section
      id="combo-workspace"
      className="overflow-hidden rounded-[24px] border border-white/70 bg-white/90 p-4 pb-28 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Combo
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            Tên, giá và món trong combo
          </h3>
          <p className="mt-1 text-[13px] leading-5 text-slate-500">
            Chọn combo có sẵn để sửa, hoặc bấm tạo combo mới rồi chỉnh combo và các dòng draft trước khi lưu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            label={comboExists ? "Đã lưu combo" : "Combo mới"}
            tone={comboExists ? "success" : "warning"}
          />
          <StatusPill label={selectedComboItemSummary} tone="muted" />
          <Link
            href="/admin/master-data/combos"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Xem bảng combo
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-semibold text-slate-900">1. Tạo / sửa combo</h4>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Mã, tên và giá bán combo. Nút lưu ở dưới cùng sẽ lưu luôn các món draft bên phải.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNewCombo}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <FaPlus className="text-xs" />
                <span>Tạo combo mới</span>
              </button>
              <button
                type="button"
                onClick={() => setComboDraft(toComboDraft(selectedCombo))}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <FaRotateLeft className="text-xs" />
                <span>Khôi phục</span>
              </button>
              {comboExists ? (
                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    if (!window.confirm(`Xoá combo "${selectedComboLabel}"?`)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input
                    type="hidden"
                    name="payload"
                    value={JSON.stringify({
                      entity: "combos",
                      recordId: selectedComboId,
                    })}
                  />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[13px] font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaTrash className="text-xs" />
                    <span>Xoá combo</span>
                  </button>
                </form>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 md:col-span-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                Combo đang chỉnh
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">
                  {selectedComboLabel}
                </span>
                <StatusPill
                  label={comboExists ? "Đã lưu combo" : "Combo mới"}
                  tone={comboExists ? "success" : "warning"}
                />
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">
                Mã combo
              </span>
              <input
                value={comboDraft.code}
                onChange={(event) =>
                  setComboDraft((current) => ({ ...current, code: event.target.value }))
                }
                className={getTextFieldClassName(comboDraft.code.trim().length > 0)}
                placeholder="CB001"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">
                Tên combo
              </span>
              <input
                value={comboDraft.name}
                onChange={(event) =>
                  setComboDraft((current) => ({ ...current, name: event.target.value }))
                }
                className={getTextFieldClassName(comboDraft.name.trim().length > 0)}
                placeholder="Combo giảm cân"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">
                Giá bán combo
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={comboDraft.salePrice}
                onChange={(event) =>
                  setComboDraft((current) => ({ ...current, salePrice: event.target.value }))
                }
                className={getTextFieldClassName(Number(comboDraft.salePrice) > 0)}
                placeholder="219000"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">
                Ghi chú
              </span>
              <textarea
                rows={3}
                value={comboDraft.notes}
                onChange={(event) =>
                  setComboDraft((current) => ({ ...current, notes: event.target.value }))
                }
                className={getTextareaClassName(comboDraft.notes.trim().length > 0)}
                placeholder="Ghi chú ngắn cho combo..."
              />
            </label>

            <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={comboDraft.isActive}
                onChange={(event) =>
                  setComboDraft((current) => ({ ...current, isActive: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-[#18352d]"
              />
              <span>Đang hoạt động</span>
            </label>

            <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Tổng giá vốn
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatCurrency(selectedComboTotalCost)}
                </p>
                <p className="mt-1 text-[12px] text-slate-500">
                  Tính từ tổng giá vốn của các món hàng trong combo hiện có.
                </p>
              </div>

              <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Giá bán thực tế
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatCurrency(selectedComboActualSalePrice)}
                </p>
                <p className="mt-1 text-[12px] text-slate-500">
                  Tính từ tổng giá bán snapshot của các món hàng trong combo hiện có.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-semibold text-slate-900">Thêm nhanh nhiều món</h4>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Chọn món hàng, số lượng và thứ tự cho từng dòng. Bấm dấu cộng ở cuối khối để thêm dòng trống.
              </p>
            </div>

            <StatusPill
              label={
                quickItemDrafts.some(
                  (draft) =>
                    draft.productVariantId.trim().length > 0 ||
                    draft.legacyMenuItemVariantId.trim().length > 0,
                )
                  ? `${quickItemDrafts.filter(
                      (draft) =>
                        draft.productVariantId.trim().length > 0 ||
                        draft.legacyMenuItemVariantId.trim().length > 0,
                    ).length} dòng draft`
                  : "Chưa có dòng"
              }
              tone={comboExists ? "success" : "muted"}
            />
          </div>

          <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Lưu combo sẽ lưu luôn mọi dòng đang chỉnh ở bên phải. Dòng trống sẽ được bỏ qua.
          </div>

          <div className="mt-4 space-y-3">
            {quickItemDrafts.map((draft, index) => (
              <div key={draft.id} className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Dòng {index + 1}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {draft.comboId === selectedComboId
                        ? selectedComboLabel
                        : "Combo mới"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuickItemDraft(draft.id)}
                    disabled={quickItemDrafts.length === 1}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaTrash className="text-[10px]" />
                    <span>Bỏ dòng</span>
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Món hàng trong combo
                    </span>
                    <select
                      value={draft.productVariantId}
                      onChange={(event) =>
                        updateQuickItemDraft(draft.id, (current) => ({
                          ...current,
                          productVariantId: event.target.value,
                          legacyMenuItemVariantId: "",
                        }))
                      }
                      className={getSelectClassName(draft.productVariantId.trim().length > 0)}
                    >
                      <option value="">Chọn món</option>
                      {comboItemVariantOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {draft.legacyMenuItemVariantId.trim().length > 0 ? (
                      <p className="mt-2 text-xs text-amber-700">
                        Dòng này đang dùng tham chiếu cũ. Hãy chọn lại một món hàng để chuyển sang catalog mới.
                      </p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Số lượng
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={draft.quantity}
                      onChange={(event) =>
                        updateQuickItemDraft(draft.id, (current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                      className={getTextFieldClassName(Number(draft.quantity) > 0)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Thứ tự
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.sortOrder}
                      onChange={(event) =>
                        updateQuickItemDraft(draft.id, (current) => ({
                          ...current,
                          sortOrder: event.target.value,
                        }))
                      }
                      className={getTextFieldClassName(true)}
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Ghi chú
                    </span>
                    <textarea
                      rows={3}
                      value={draft.notes}
                      onChange={(event) =>
                        updateQuickItemDraft(draft.id, (current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      className={getTextareaClassName(draft.notes.trim().length > 0)}
                      placeholder="Ví dụ: phần chính, món phụ..."
                    />
                  </label>

                  <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) =>
                        updateQuickItemDraft(draft.id, (current) => ({
                          ...current,
                          isActive: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#18352d]"
                    />
                    <span>Đang hoạt động</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {!quickItemHasDuplicates ? null : (
            <p className="mt-3 rounded-2xl bg-amber-400/15 px-3 py-2 text-sm text-amber-700">
              Có món bị chọn trùng trong các dòng draft. Mỗi combo item phải dùng một biến thể khác nhau.
            </p>
          )}

          {quickItemHasInvalidRows ? (
            <p className="mt-3 rounded-2xl bg-rose-400/15 px-3 py-2 text-sm text-rose-700">
              Có dòng draft đang thiếu số lượng hợp lệ.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={appendQuickItemDraft}
              title="Thêm dòng trống"
              aria-label="Thêm dòng trống"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              <FaPlus className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() =>
                setQuickItemDrafts(
                  selectedComboItems.length > 0
                    ? selectedComboItems.map((row) =>
                        toComboItemDraft(
                          row,
                          selectedComboId,
                          productVariantLookupByLabel,
                        ),
                      )
                    : [makeQuickComboItemDraft(selectedComboId)],
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FaRotateLeft className="text-xs" />
              <span>Khôi phục dòng</span>
            </button>
          </div>
        </div>
      </div>

      <form id="combo-save-form" action={comboAction} className="hidden">
        <input type="hidden" name="payload" value={comboPayload} />
      </form>

      <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-semibold text-slate-900">Chi tiết hiện có của combo</h4>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">
              Danh sách chỉ để tham chiếu và xoá nhanh. Mọi thay đổi chi tiết đang chỉnh ở khối bên phải.
            </p>
          </div>
          <StatusPill label={`${selectedComboItems.length} dòng`} tone="muted" />
        </div>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-[12px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-left">SL</th>
                <th className="px-4 py-3 text-left">Giá bán</th>
                <th className="px-4 py-3 text-left">Giá vốn</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Xoá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedComboItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Chưa có dòng chi tiết nào. Hãy chọn combo đã lưu và thêm món vào combo.
                  </td>
                </tr>
              ) : (
                selectedComboItems.map((row) => {
                  const displayText = String(row.display_text ?? "").trim();
                  const productName = String(
                    getNestedValue(row, "product_variants.products.name") ??
                      getNestedValue(row, "menu_item_variants.menu_items.name") ??
                      "",
                  );
                  const variantLabel = String(
                    getNestedValue(row, "product_variants.label") ??
                      getNestedValue(row, "menu_item_variants.label") ??
                      "",
                  );

                  return (
                    <tr key={String(row.id)} className="transition hover:bg-emerald-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {displayText || productName || "Dòng combo"}
                        </div>
                        <div className="mt-1 text-[12px] text-slate-500">
                          {productName}
                          {variantLabel ? ` · ${variantLabel}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {String(row.quantity ?? "")}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatCurrency(Number(row.unit_sale_price_snapshot ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatCurrency(Number(row.unit_cost_snapshot ?? 0))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill
                          label={row.is_active === false ? "Tạm ẩn" : "Đang dùng"}
                          tone={row.is_active === false ? "warning" : "success"}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form
                          action={deleteAction}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="hidden"
                            name="payload"
                            value={JSON.stringify({
                              entity: "combo_items",
                              recordId: row.id,
                            })}
                          />
                          <button
                            type="submit"
                            disabled={deletePending}
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {deleteState.status !== "idle" ? (
          <p
            className={`mt-3 rounded-2xl px-3 py-2 text-sm ${
              deleteState.status === "success"
                ? "bg-emerald-400/15 text-emerald-700"
                : "bg-rose-400/15 text-rose-700"
            }`}
          >
            {deleteState.message}
          </p>
        ) : null}
      </div>

      <StickyFormFooter
        form="combo-save-form"
        note="Lưu combo sẽ tự động lưu thông tin combo và toàn bộ dòng draft bên phải."
        message={
          comboState.status !== "idle"
            ? comboState.message
            : !comboCanSave
              ? "Nhập mã, tên, giá bán lớn hơn 0 và không để món bị chọn trùng hoặc số lượng không hợp lệ."
              : undefined
        }
        messageTone={
          comboState.status !== "idle"
            ? comboState.status === "success"
              ? "success"
              : "danger"
            : "danger"
        }
        submitLabel="Lưu combo"
        pendingLabel="Đang lưu..."
        pending={comboPending}
        disabled={!comboCanSave}
      />
    </section>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  FaFilter,
  FaCopy,
  FaPenToSquare,
  FaPlus,
  FaRotateLeft,
  FaMagnifyingGlass,
  FaTableColumns,
} from "react-icons/fa6";
import { ExportExcelButton } from "@/features/admin/components/ExportExcelButton";
import { StatusPill } from "@/features/admin/components/StatusPill";
import {
  duplicateComboAction,
  updateComboSalePriceAction,
} from "@/lib/admin/actions";
import { ADMIN_SIMPLE_MODE } from "@/features/admin/config";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import type {
  ActionState,
  AdminCategory,
  MenuProduct,
  MenuVariant,
} from "@/lib/admin/types";
import type { SalesComboOption } from "@/lib/sales/types";
import { MenuExcelImportPanel } from "@/features/admin/components/MenuExcelImportPanel";

function pickVariantByWeight(product: MenuProduct, targetWeight: number) {
  return (
    product.variants.find((variant) => variant.weightInGrams === targetWeight) ??
    product.variants.find((variant) => variant.label.trim() === `${targetWeight}g`) ??
    product.variants.find((variant) => variant.label.trim() === `${targetWeight} G`) ??
    null
  );
}

function pickDefaultVariant(product: MenuProduct) {
  return product.variants.find((variant) => variant.isDefault) ?? product.variants[0] ?? null;
}

function variantPriceText(variant: MenuVariant | null) {
  return variant ? formatCurrency(variant.price) : "—";
}

function variantCostText(variant: MenuVariant | null) {
  return variant ? formatCurrency(variant.totalCost) : "—";
}

type ColumnKey =
  | "name"
  | "category"
  | "100g"
  | "150g"
  | "200g"
  | "cost"
  | "profit"
  | "status"
  | "updated"
  | "edit";

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  name: true,
  category: true,
  "100g": true,
  "150g": true,
  "200g": true,
  cost: true,
  profit: true,
  status: true,
  updated: true,
  edit: true,
};

const comboCopyInitialState: ActionState = {
  status: "idle",
  message: "",
  mode: "live",
};

const comboPriceInitialState: ActionState = {
  status: "idle",
  message: "",
  mode: "live",
};

function formatComboComponentSummary(combo: SalesComboOption) {
  const texts = combo.components
    .map((component) => component.displayText.trim())
    .filter((text) => text.length > 0);

  if (texts.length === 0) {
    return "Chưa có thành phần";
  }

  const visible = texts.slice(0, 1);
  const hiddenCount = texts.length - visible.length;

  return hiddenCount > 0
    ? `${visible.join(" · ")} · +${hiddenCount}`
    : visible.join(" · ");
}

function ComboCatalog({ combos }: { combos: SalesComboOption[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [copyState, copyAction, copyPending] = useActionState(
    duplicateComboAction,
    comboCopyInitialState,
  );

  const filteredCombos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return combos.filter((combo) => {
      if (statusFilter === "active" && !combo.isActive) {
        return false;
      }

      if (statusFilter === "hidden" && combo.isActive) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      const haystack = [
        combo.code ?? "",
        combo.name,
        combo.notes ?? "",
        combo.components.map((component) => component.displayText).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [combos, query, statusFilter]);

  const activeCount = filteredCombos.filter((combo) => combo.isActive).length;
  const componentCount = filteredCombos.reduce(
    (sum, combo) => sum + combo.components.length,
    0,
  );
  const defaultSaleTotal = filteredCombos.reduce(
    (sum, combo) => sum + combo.defaultSalePrice,
    0,
  );

  const exportRows = useMemo(
    () =>
      filteredCombos.map((combo) => ({
        ma_combo: combo.code ?? "",
        ten_combo: combo.name,
        thanh_phan: formatComboComponentSummary(combo),
        gia_mac_dinh: formatCurrency(combo.defaultSalePrice),
        gia_ban: formatCurrency(combo.salePrice),
        gia_von: formatCurrency(combo.totalCost),
        lai: formatCurrency(combo.grossProfit),
        ty_le_lai: `${(combo.grossMargin * 100).toFixed(1)}%`,
        trang_thai: combo.isActive ? "Đang dùng" : "Tạm ẩn",
      })),
    [filteredCombos],
  );

  return (
    <section className="overflow-hidden rounded-[24px] border border-white/70 bg-white/90 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
      <div className="px-4 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Combo
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">Danh sách combo</h3>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">
              Combo gộp nhiều món bên trong, giá bán thực tế có thể thấp hơn giá mặc định.
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-slate-400">
              Mỗi lần lưu sẽ sinh thêm một phiên bản lịch sử, bill cũ vẫn giữ nguyên snapshot.
              Mở chi tiết trong tab mới để sửa sâu, hoặc bấm sao chép để nhân combo cũ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={`${activeCount} đang dùng`} tone="success" />
            <StatusPill label={`${filteredCombos.length} combo`} tone="muted" />
            <StatusPill label={`${componentCount} thành phần`} tone="info" />
            <StatusPill
              label={`Mặc định ${formatCurrency(defaultSaleTotal)}`}
              tone="muted"
            />
            <ExportExcelButton
              filename={`combo-${new Date().toISOString().slice(0, 10)}`}
              sheetName="Combo"
              title="Xuất Excel combo"
              columns={[
                { key: "ma_combo", label: "Mã combo" },
                { key: "ten_combo", label: "Tên combo" },
                { key: "thanh_phan", label: "Thành phần" },
                { key: "gia_mac_dinh", label: "Giá mặc định" },
                { key: "gia_ban", label: "Giá bán" },
                { key: "gia_von", label: "Giá vốn" },
                { key: "lai", label: "Lãi" },
                { key: "ty_le_lai", label: "Tỷ lệ lãi" },
                { key: "trang_thai", label: "Trạng thái" },
              ]}
              rows={exportRows}
            />
            <Link
              href="/admin/master-data/combos"
              className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-3 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90"
            >
              <FaPlus className="text-xs" />
              <span>Thêm combo</span>
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            <FaMagnifyingGlass className="text-xs" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm combo, mã hoặc thành phần..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              setStatusFilter((current) =>
                current === "all" ? "active" : current === "active" ? "hidden" : "all",
              )
            }
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaFilter className="text-xs" />
            <span>
              {statusFilter === "all"
                ? "Tất cả"
                : statusFilter === "active"
                  ? "Đang dùng"
                  : "Tạm ẩn"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaRotateLeft className="text-xs" />
            <span>Đặt lại</span>
          </button>
        </div>

        {copyState.status !== "idle" ? (
          <p
            className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
              copyState.status === "success"
                ? "bg-emerald-400/15 text-emerald-700"
                : "bg-rose-400/15 text-rose-700"
            }`}
          >
            {copyState.message}
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCombos.length === 0 ? (
          <div className="col-span-full rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Chưa có combo nào khớp bộ lọc. Hãy đổi từ khóa hoặc bấm <strong>Sao chép</strong>
            ở combo có sẵn để tạo combo mới nhanh hơn.
          </div>
        ) : null}
        {filteredCombos.map((combo) => (
          <div
            key={combo.id}
            className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {combo.code ?? "Combo"}
                </p>
                <h4 className="mt-1 text-base font-semibold text-slate-900">{combo.name}</h4>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  {formatComboComponentSummary(combo)}
                </p>
              </div>
              <StatusPill
                label={combo.isActive ? "Đang dùng" : "Tạm ẩn"}
                tone={combo.isActive ? "success" : "warning"}
              />
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Giá mặc định / bán
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatCurrency(combo.defaultSalePrice)} · {formatCurrency(combo.salePrice)}
                </p>
              </div>
              <div className="rounded-2xl border border-white bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Giá vốn / lãi
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatCurrency(combo.totalCost)} · {formatCurrency(combo.grossProfit)}
                </p>
              </div>
              <div className="rounded-2xl border border-white bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Tỷ lệ lãi
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {(combo.grossMargin * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <ComboSalePriceForm combo={combo} />

            <div className="mt-4 flex flex-wrap gap-2">
              <form action={copyAction}>
                <input type="hidden" name="payload" value={JSON.stringify({ comboId: combo.id })} />
                <button
                  type="submit"
                  disabled={copyPending}
                  className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-3 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaCopy className="text-xs" />
                  <span>Sao chép</span>
                </button>
              </form>
              <Link
                href="/admin/master-data/combos"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Xem chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComboSalePriceForm({ combo }: { combo: SalesComboOption }) {
  const [priceState, priceAction, pricePending] = useActionState(
    updateComboSalePriceAction,
    comboPriceInitialState,
  );
  const [salePrice, setSalePrice] = useState(String(combo.salePrice));

  return (
    <form action={priceAction} className="mt-3">
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          comboId: combo.id,
          salePrice: Number(salePrice || 0),
        })}
      />
      <div className="flex items-end gap-2">
        <label className="block flex-1">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">
            Giá bán thực tế
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={salePrice}
            onChange={(event) => setSalePrice(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pricePending}
          className="rounded-2xl bg-[#18352d] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Lưu giá
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
        <span>Giá thực tế có thể thấp hơn giá mặc định.</span>
        <button
          type="button"
          className="font-medium text-[#18352d] underline decoration-slate-300 underline-offset-2"
          onClick={() => setSalePrice(String(combo.defaultSalePrice))}
        >
          Về giá mặc định
        </button>
      </div>
      {priceState.status !== "idle" ? (
        <p
          className={`mt-2 rounded-2xl px-3 py-2 text-sm ${
            priceState.status === "success"
              ? "bg-emerald-400/15 text-emerald-700"
              : "bg-rose-400/15 text-rose-700"
          }`}
        >
          {priceState.message}
        </p>
      ) : null}
    </form>
  );
}

export function MenuCatalog({
  products,
  combos,
  categories,
}: {
  products: MenuProduct[];
  combos: SalesComboOption[];
  categories: AdminCategory[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "hidden">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(
    DEFAULT_COLUMNS,
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      if (statusFilter === "published" && !product.isPublished) {
        return false;
      }

      if (statusFilter === "hidden" && product.isPublished) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      const haystack = [
        product.name,
        product.categoryName,
        product.shortDescription,
        product.description,
        product.variants.map((variant) => variant.label).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [products, query, statusFilter]);

  const publishedCount = filteredProducts.filter((product) => product.isPublished).length;

  const exportRows = useMemo(
    () =>
      filteredProducts.map((product) => {
        const variant100 = pickVariantByWeight(product, 100);
        const variant150 = pickVariantByWeight(product, 150);
        const variant200 = pickVariantByWeight(product, 200);
        const defaultVariant = pickDefaultVariant(product);

        return {
          ten_mon: product.name,
          nhom: product.categoryName,
          gia_100g: variantPriceText(variant100),
          gia_150g: variantPriceText(variant150),
          gia_200g: variantPriceText(variant200),
          gia_von: variantCostText(defaultVariant),
          lai_gioi: defaultVariant ? formatCurrency(defaultVariant.grossProfit) : "—",
          trang_thai: product.isPublished ? "Đang dùng" : "Tạm ẩn",
          cap_nhat: formatDate(product.updatedAt),
        };
      }),
    [filteredProducts],
  );

  const variantRows = useMemo(
    () =>
      filteredProducts.flatMap((product) =>
        product.variants.map((variant) => ({
          id: variant.id,
          ten_mon: product.name,
          nhom: product.categoryName,
          trong_luong: variant.weightInGrams == null ? variant.label : `${variant.weightInGrams}g`,
          gia_ban: formatCurrency(variant.price),
          gia_von: formatCurrency(variant.totalCost),
          lai_gop: formatCurrency(variant.grossProfit),
        })),
      ),
    [filteredProducts],
  );

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              {filteredProducts.length} món
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Món & Combo</h2>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">
              Nhìn như sheet: mỗi món có cột giá riêng, combo ghép nhiều món bên trong.
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-slate-400">
              Thêm món hoặc combo mới ở đây, giá sẽ dùng ngay khi tạo đơn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={`${publishedCount} đang dùng`} tone="success" />
            <StatusPill label={`${filteredProducts.length} kết quả`} tone="muted" />
            <Link
              href="/admin/menu/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-3 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90"
            >
              <FaPlus className="text-xs" />
              <span>Thêm món mới</span>
            </Link>
            <ExportExcelButton
              filename={`thuc-don-${new Date().toISOString().slice(0, 10)}`}
              sheetName="Thực đơn"
              title="Xuất Excel thực đơn"
              columns={[
                { key: "ten_mon", label: "Tên món" },
                { key: "nhom", label: "Nhóm" },
                { key: "gia_100g", label: "100g" },
                { key: "gia_150g", label: "150g" },
                { key: "gia_200g", label: "200g" },
                { key: "gia_von", label: "Giá vốn" },
                { key: "lai_gioi", label: "Lãi/gói" },
                { key: "trang_thai", label: "Trạng thái" },
                { key: "cap_nhat", label: "Cập nhật" },
              ]}
              rows={exportRows}
            />
          </div>
        </div>

        <div className="mt-4">
          <MenuExcelImportPanel categories={categories} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            <FaMagnifyingGlass className="text-xs" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm món, nhóm hoặc khối lượng..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaFilter className="text-xs" />
            <span>Bộ lọc</span>
          </button>
          <button
            type="button"
            onClick={() => setShowColumns((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaTableColumns className="text-xs" />
            <span>Cột hiển thị</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setVisibleColumns(DEFAULT_COLUMNS);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaRotateLeft className="text-xs" />
            <span>Đặt lại</span>
          </button>
        </div>

        {showFilters ? (
          <div className="mt-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 md:max-w-sm">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Trạng thái
              </span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | "published" | "hidden")
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="published">Đang dùng</option>
                <option value="hidden">Tạm ẩn</option>
              </select>
            </label>
          </div>
        ) : null}

        {showColumns ? (
          <div className="mt-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {(Object.keys(visibleColumns) as ColumnKey[]).map((key) => {
                const labels: Record<ColumnKey, string> = {
                  name: "Tên món",
                  category: "Nhóm",
                  "100g": "100g",
                  "150g": "150g",
                  "200g": "200g",
                  cost: "Giá vốn",
                  profit: "Lãi/gói",
                  status: "Trạng thái",
                  updated: "Cập nhật",
                  edit: "Sửa",
                };

                return (
                  <label
                    key={key}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={(event) =>
                        setVisibleColumns((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))
                      }
                    />
                    <span>{labels[key]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-white/70 bg-white/90 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {visibleColumns.name ? <th className="px-4 py-3 font-medium">Tên món</th> : null}
                {visibleColumns.category ? <th className="px-4 py-3 font-medium">Nhóm</th> : null}
                {visibleColumns["100g"] ? <th className="px-4 py-3 font-medium">100g</th> : null}
                {visibleColumns["150g"] ? <th className="px-4 py-3 font-medium">150g</th> : null}
                {visibleColumns["200g"] ? <th className="px-4 py-3 font-medium">200g</th> : null}
                {visibleColumns.cost ? <th className="px-4 py-3 font-medium">Giá vốn</th> : null}
                {visibleColumns.profit ? <th className="px-4 py-3 font-medium">Lãi/gói</th> : null}
                {visibleColumns.status ? (
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                ) : null}
                {visibleColumns.updated ? <th className="px-4 py-3 font-medium">Cập nhật</th> : null}
                {visibleColumns.edit ? <th className="px-4 py-3 font-medium">Sửa</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredProducts.map((product) => {
                const variant100 = pickVariantByWeight(product, 100);
                const variant150 = pickVariantByWeight(product, 150);
                const variant200 = pickVariantByWeight(product, 200);
                const defaultVariant = pickDefaultVariant(product);

                return (
                  <tr key={product.id}>
                    {visibleColumns.name ? (
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium text-slate-900">{product.name}</p>
                        {!ADMIN_SIMPLE_MODE ? (
                          <p className="mt-1 text-[13px] leading-5 text-slate-500">
                            {product.shortDescription || "Chưa có mô tả"}
                          </p>
                        ) : null}
                      </td>
                    ) : null}
                    {visibleColumns.category ? (
                      <td className="px-4 py-4 align-top text-slate-700">
                        {product.categoryName}
                      </td>
                    ) : null}
                    {visibleColumns["100g"] ? (
                      <td className="px-4 py-4 align-top font-medium text-slate-900">
                        {variantPriceText(variant100)}
                      </td>
                    ) : null}
                    {visibleColumns["150g"] ? (
                      <td className="px-4 py-4 align-top font-medium text-slate-900">
                        {variantPriceText(variant150)}
                      </td>
                    ) : null}
                    {visibleColumns["200g"] ? (
                      <td className="px-4 py-4 align-top font-medium text-slate-900">
                        {variantPriceText(variant200)}
                      </td>
                    ) : null}
                    {visibleColumns.cost ? (
                      <td className="px-4 py-4 align-top font-medium text-slate-900">
                        {variantCostText(defaultVariant)}
                      </td>
                    ) : null}
                    {visibleColumns.profit ? (
                      <td className="px-4 py-4 align-top font-medium text-slate-900">
                        {defaultVariant ? formatCurrency(defaultVariant.grossProfit) : "—"}
                      </td>
                    ) : null}
                    {visibleColumns.status ? (
                      <td className="px-4 py-4 align-top">
                        <StatusPill
                          label={product.isPublished ? "Đang dùng" : "Tạm ẩn"}
                          tone={product.isPublished ? "success" : "warning"}
                        />
                      </td>
                    ) : null}
                    {visibleColumns.updated ? (
                      <td className="px-4 py-4 align-top text-slate-500">
                        {formatDate(product.updatedAt)}
                      </td>
                    ) : null}
                    {visibleColumns.edit ? (
                      <td className="px-4 py-4 align-top">
                        <Link
                          href={`/admin/menu/${product.id}`}
                          title="Sửa món"
                          aria-label="Sửa món"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white"
                        >
                          <FaPenToSquare className="text-sm" />
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ComboCatalog combos={combos} />

      <section className="overflow-hidden rounded-[24px] border border-white/70 bg-white/90 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Bảng giá
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              Chi tiết theo loại
            </h3>
          </div>
          <StatusPill label={`${variantRows.length} dòng`} tone="muted" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Món</th>
                <th className="px-4 py-3 font-medium">Nhóm</th>
                <th className="px-4 py-3 font-medium">Trọng lượng</th>
                <th className="px-4 py-3 font-medium">Giá bán</th>
                <th className="px-4 py-3 font-medium">Giá vốn</th>
                <th className="px-4 py-3 font-medium">Lãi/gói</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {variantRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-4 align-top font-medium text-slate-900">
                    {row.ten_mon}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">{row.nhom}</td>
                  <td className="px-4 py-4 align-top text-slate-700">{row.trong_luong}</td>
                  <td className="px-4 py-4 align-top font-medium text-slate-900">
                    {row.gia_ban}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">{row.gia_von}</td>
                  <td className="px-4 py-4 align-top font-medium text-slate-900">
                    {row.lai_gop}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

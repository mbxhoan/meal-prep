"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FaPenToSquare } from "react-icons/fa6";
import { ExportExcelButton } from "@/features/admin/components/ExportExcelButton";
import { StatusPill } from "@/features/admin/components/StatusPill";
import { ViewModeToggle } from "@/features/admin/components/ViewModeToggle";
import { formatCurrency, formatDate, formatPercent } from "@/lib/admin/format";
import type { MenuProduct } from "@/lib/admin/types";
import { SmartImage } from "@/shared";

function pickDefaultVariant(product: MenuProduct) {
  return product.variants.find((variant) => variant.isDefault) ?? product.variants[0];
}

export function MenuCatalog({ products }: { products: MenuProduct[] }) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const exportRows = useMemo(
    () =>
      products.map((product) => {
        const defaultVariant = pickDefaultVariant(product);

        return {
          tên_món: product.name,
          danh_mục: product.categoryName,
          số_biến_thể: product.variants.length,
          giá_bán: defaultVariant ? formatCurrency(defaultVariant.price) : "—",
          giá_vốn: defaultVariant ? formatCurrency(defaultVariant.totalCost) : "—",
          biên_lợi_nhuận: defaultVariant ? formatPercent(defaultVariant.grossMargin) : "—",
          trạng_thái: product.isPublished ? "Đã đăng" : "Bản nháp",
          cập_nhật: formatDate(product.updatedAt),
        };
      }),
    [products],
  );

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              {products.length} món
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Thực đơn, giá và vốn
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Mặc định là danh sách.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill
              label={`${products.filter((product) => product.isPublished).length} đã đăng`}
              tone="success"
            />
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <ExportExcelButton
              filename={`thuc-don-${new Date().toISOString().slice(0, 10)}`}
              sheetName="Thực đơn"
              title="Xuất Excel thực đơn"
              columns={[
                { key: "tên_món", label: "Tên món" },
                { key: "danh_mục", label: "Danh mục" },
                { key: "số_biến_thể", label: "Số biến thể" },
                { key: "giá_bán", label: "Giá bán" },
                { key: "giá_vốn", label: "Giá vốn" },
                { key: "biên_lợi_nhuận", label: "Biên lợi nhuận" },
                { key: "trạng_thái", label: "Trạng thái" },
                { key: "cập_nhật", label: "Cập nhật" },
              ]}
              rows={exportRows}
            />
          </div>
        </div>
      </section>

      {viewMode === "list" ? (
        <section className="space-y-3">
          {products.map((product) => {
            const defaultVariant = pickDefaultVariant(product);

            return (
              <article
                key={product.id}
                className="rounded-[26px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.36)]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] border border-slate-100 bg-white md:h-24 md:w-24">
                      <SmartImage
                        src={product.mainImageUrl}
                        alt={product.name}
                        fill
                        sizes="96px"
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#51724f]">
                        {product.categoryName}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                        {product.name}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                        {product.shortDescription}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusPill
                          label={product.isPublished ? "Đã đăng" : "Bản nháp"}
                          tone={product.isPublished ? "success" : "warning"}
                        />
                        <StatusPill label={`${product.variants.length} biến thể`} tone="info" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-[22px] bg-slate-50 p-4 text-sm md:min-w-[320px] md:grid-cols-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        Biến thể mặc định
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {defaultVariant?.label ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        Giá bán / giá vốn
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {defaultVariant
                          ? `${formatCurrency(defaultVariant.price)} / ${formatCurrency(defaultVariant.totalCost)}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        Biên lợi nhuận
                      </p>
                      <p className="mt-1 font-medium text-emerald-700">
                        {defaultVariant ? formatPercent(defaultVariant.grossMargin) : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <p className="text-xs text-slate-500">
                      Cập nhật {formatDate(product.updatedAt)}
                    </p>
                    <Link
                      href={`/admin/menu/${product.id}`}
                      title="Chỉnh sửa thực đơn"
                      aria-label="Chỉnh sửa thực đơn"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#18352d] text-white transition hover:opacity-90"
                    >
                      <FaPenToSquare />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => {
            const defaultVariant = pickDefaultVariant(product);

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]"
              >
                <div className="relative bg-[radial-gradient(circle_at_top_left,_rgba(24,53,45,0.12),_transparent_44%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-5 pb-5 pt-6">
                  <div className="absolute right-4 top-4">
                    <StatusPill
                      label={product.isPublished ? "Đã đăng" : "Bản nháp"}
                      tone={product.isPublished ? "success" : "warning"}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] border border-slate-100 bg-white md:h-24 md:w-24">
                      <SmartImage
                        src={product.mainImageUrl}
                        alt={product.name}
                        fill
                        sizes="96px"
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#51724f]">
                        {product.categoryName}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {product.shortDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 px-5 py-5">
                  {defaultVariant ? (
                    <div className="grid gap-3 rounded-[20px] bg-slate-50 p-4 md:grid-cols-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                          Biến thể mặc định
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {defaultVariant.label}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                          Giá bán / giá vốn
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {formatCurrency(defaultVariant.price)} /{" "}
                          {formatCurrency(defaultVariant.totalCost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                          Biên lợi nhuận
                        </p>
                        <p className="mt-1 font-medium text-emerald-700">
                          {formatPercent(defaultVariant.grossMargin)}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{product.variants.length} biến thể</span>
                    <span>Cập nhật {formatDate(product.updatedAt)}</span>
                  </div>

                  <Link
                    href={`/admin/menu/${product.id}`}
                    title="Chỉnh sửa thực đơn"
                    aria-label="Chỉnh sửa thực đơn"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#18352d] text-white transition hover:opacity-90"
                  >
                    <FaPenToSquare />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MenuCatalog;

"use client";

import { useActionState, useMemo, useState } from "react";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import { saveMenuProductAction } from "@/lib/admin/actions";
import { formatCurrency, slugify } from "@/lib/admin/format";
import type {
  AdminCategory,
  InventoryItem,
  MenuProduct,
  MenuVariant,
  RecipeComponent,
} from "@/lib/admin/types";

const initialState = {
  status: "idle",
  message: "",
  mode: "demo",
} as const;

type VariantState = MenuVariant;

function makeEmptyVariant(productId: string): VariantState {
  return {
    id: crypto.randomUUID(),
    productId,
    label: "New variant",
    weightInGrams: null,
    price: 0,
    compareAtPrice: null,
    packagingCost: 0,
    laborCost: 0,
    overheadCost: 0,
    recipeCost: 0,
    totalCost: 0,
    grossProfit: 0,
    grossMargin: 0,
    isDefault: false,
    isActive: true,
    sortOrder: 99,
    recipeComponents: [],
  };
}

function recalculateVariantCosts(
  variant: VariantState,
  inventoryIndex: Record<string, InventoryItem>,
): VariantState {
  const recipeComponents = variant.recipeComponents.map((component) => {
    const inventoryItem = inventoryIndex[component.inventoryItemId];
    const unitCost = inventoryItem?.averageUnitCost ?? component.unitCost;
    const ingredientName = inventoryItem?.name ?? component.ingredientName;
    const unit = inventoryItem?.unit ?? component.unit;
    const lineCost = Math.round(
      component.quantityPerUnit *
        unitCost *
        (1 + component.wastagePercent / 100),
    );

    return {
      ...component,
      ingredientName,
      unit,
      unitCost,
      lineCost,
    };
  });

  const recipeCost = recipeComponents.reduce(
    (sum, component) => sum + component.lineCost,
    0,
  );
  const totalCost =
    recipeCost + variant.packagingCost + variant.laborCost + variant.overheadCost;
  const grossProfit = variant.price - totalCost;
  const grossMargin = variant.price > 0 ? grossProfit / variant.price : 0;

  return {
    ...variant,
    recipeComponents,
    recipeCost,
    totalCost,
    grossProfit,
    grossMargin,
  };
}

export function ProductEditorForm({
  product,
  categories,
  inventoryItems,
}: {
  product: MenuProduct;
  categories: AdminCategory[];
  inventoryItems: InventoryItem[];
}) {
  const inventoryIndex = useMemo(
    () => Object.fromEntries(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems],
  );
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [shortDescription, setShortDescription] = useState(product.shortDescription);
  const [description, setDescription] = useState(product.description);
  const [mainImageUrl, setMainImageUrl] = useState(product.mainImageUrl);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);
  const [isPublished, setIsPublished] = useState(product.isPublished);
  const [sortOrder, setSortOrder] = useState(product.sortOrder);
  const [variants, setVariants] = useState<VariantState[]>(
    product.variants.map((variant) => recalculateVariantCosts(variant, inventoryIndex)),
  );
  const [state, action, pending] = useActionState(saveMenuProductAction, initialState);

  function updateVariant(variantId: string, updater: (variant: VariantState) => VariantState) {
    setVariants((current) =>
      current.map((variant) =>
        variant.id === variantId
          ? recalculateVariantCosts(updater(variant), inventoryIndex)
          : variant,
      ),
    );
  }

  function addRecipeComponent(variantId: string) {
    const defaultItem = inventoryItems[0];

    if (!defaultItem) {
      return;
    }

    updateVariant(variantId, (variant) => ({
      ...variant,
      recipeComponents: [
        ...variant.recipeComponents,
        {
          id: crypto.randomUUID(),
          variantId,
          inventoryItemId: defaultItem.id,
          ingredientName: defaultItem.name,
          unit: defaultItem.unit,
          quantityPerUnit: 1,
          unitCost: defaultItem.averageUnitCost,
          wastagePercent: 0,
          lineCost: defaultItem.averageUnitCost,
        },
      ],
    }));
  }

  return (
    <form action={action} className="space-y-6">
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          id: product.id,
          categoryId: categoryId || null,
          name,
          slug,
          shortDescription,
          description,
          mainImageUrl,
          isFeatured,
          isPublished,
          sortOrder,
          variants: variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            weightInGrams: variant.weightInGrams,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            packagingCost: variant.packagingCost,
            laborCost: variant.laborCost,
            overheadCost: variant.overheadCost,
            isDefault: variant.isDefault,
            isActive: variant.isActive,
            sortOrder: variant.sortOrder,
            recipeComponents: variant.recipeComponents.map((component) => ({
              id: component.id,
              inventoryItemId: component.inventoryItemId,
              quantityPerUnit: component.quantityPerUnit,
              wastagePercent: component.wastagePercent,
            })),
          })),
        })}
      />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                  Menu editor
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Chỉnh ảnh đại diện và thông tin thực đơn
                </h2>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-500">
                Product ID: {product.id.slice(0, 8)}...
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Tên món
                </span>
                <input
                  value={name}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setName(nextName);
                    setSlug((current) =>
                      current === product.slug ? slugify(nextName) : current,
                    );
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Slug
                </span>
                <input
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Danh mục
                </span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="">Chưa phân loại</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Sort order
                </span>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(Number(event.target.value || 0))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Mô tả ngắn
              </span>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Mô tả chi tiết
              </span>
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                />
                Featured
              </label>
              <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(event) => setIsPublished(event.target.checked)}
                />
                Published
              </label>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                  Cost model
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Giá bán, cost và recipe theo variant
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setVariants((current) => [...current, makeEmptyVariant(product.id)])
                }
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                Thêm variant
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Label
                      </span>
                      <input
                        value={variant.label}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Weight (g)
                      </span>
                      <input
                        type="number"
                        value={variant.weightInGrams ?? ""}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            weightInGrams: event.target.value
                              ? Number(event.target.value)
                              : null,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Giá bán
                      </span>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            price: Number(event.target.value || 0),
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Compare at
                      </span>
                      <input
                        type="number"
                        value={variant.compareAtPrice ?? ""}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            compareAtPrice: event.target.value
                              ? Number(event.target.value)
                              : null,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Packaging
                      </span>
                      <input
                        type="number"
                        value={variant.packagingCost}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            packagingCost: Number(event.target.value || 0),
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Labor
                      </span>
                      <input
                        type="number"
                        value={variant.laborCost}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            laborCost: Number(event.target.value || 0),
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Overhead
                      </span>
                      <input
                        type="number"
                        value={variant.overheadCost}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            overheadCost: Number(event.target.value || 0),
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Sort
                      </span>
                      <input
                        type="number"
                        value={variant.sortOrder}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            sortOrder: Number(event.target.value || 0),
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={variant.isDefault}
                        onChange={(event) =>
                          setVariants((current) =>
                            current.map((entry) => ({
                              ...entry,
                              isDefault:
                                entry.id === variant.id ? event.target.checked : false,
                            })),
                          )
                        }
                      />
                      Default
                    </label>
                    <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((current) =>
                          current.length > 1
                            ? current.filter((entry) => entry.id !== variant.id)
                            : current,
                        )
                      }
                      className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                    >
                      Xoá variant
                    </button>
                  </div>

                  <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Recipe components
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Ingredient cost được lấy từ tồn kho theo AVG cost hiện tại.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addRecipeComponent(variant.id)}
                        className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                      >
                        Thêm nguyên liệu
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {variant.recipeComponents.length === 0 ? (
                        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          Variant này chưa có BOM. Hãy thêm nguyên liệu để hệ thống
                          tự tính recipe cost.
                        </p>
                      ) : null}

                      {variant.recipeComponents.map((component: RecipeComponent) => (
                        <div
                          key={component.id}
                          className="grid gap-3 rounded-2xl bg-slate-50 px-4 py-3 lg:grid-cols-[1.2fr_0.7fr_0.6fr_0.6fr_auto]"
                        >
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Nguyên liệu
                            </span>
                            <select
                              value={component.inventoryItemId}
                              onChange={(event) =>
                                updateVariant(variant.id, (current) => ({
                                  ...current,
                                  recipeComponents: current.recipeComponents.map((entry) =>
                                    entry.id === component.id
                                      ? {
                                          ...entry,
                                          inventoryItemId: event.target.value,
                                        }
                                      : entry,
                                  ),
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                            >
                              {inventoryItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Qty / unit
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={component.quantityPerUnit}
                              onChange={(event) =>
                                updateVariant(variant.id, (current) => ({
                                  ...current,
                                  recipeComponents: current.recipeComponents.map((entry) =>
                                    entry.id === component.id
                                      ? {
                                          ...entry,
                                          quantityPerUnit: Number(event.target.value || 0),
                                        }
                                      : entry,
                                  ),
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Waste %
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              value={component.wastagePercent}
                              onChange={(event) =>
                                updateVariant(variant.id, (current) => ({
                                  ...current,
                                  recipeComponents: current.recipeComponents.map((entry) =>
                                    entry.id === component.id
                                      ? {
                                          ...entry,
                                          wastagePercent: Number(event.target.value || 0),
                                        }
                                      : entry,
                                  ),
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                            />
                          </label>
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Line cost
                            </p>
                            <p className="mt-2 font-medium text-slate-800">
                              {formatCurrency(component.lineCost)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateVariant(variant.id, (current) => ({
                                ...current,
                                recipeComponents: current.recipeComponents.filter(
                                  (entry) => entry.id !== component.id,
                                ),
                              }))
                            }
                            className="mt-6 inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                          >
                            Xoá
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-[24px] bg-[#18352d] p-4 text-white md:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                        Recipe cost
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatCurrency(variant.recipeCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                        Total COGS
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatCurrency(variant.totalCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                        Gross profit
                      </p>
                      <p className="mt-2 text-lg font-semibold text-emerald-300">
                        {formatCurrency(variant.grossProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                        Margin
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {(variant.grossMargin * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Hero image
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Ảnh đại diện thực đơn
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Ảnh này được dùng làm thumbnail ở trang menu và cũng là ảnh chính khi
              vào chi tiết sản phẩm.
            </p>
            <div className="mt-5">
              <ImageUploader value={mainImageUrl} onChange={setMainImageUrl} />
            </div>
          </div>

          <div className="rounded-[30px] border border-[#18352d]/10 bg-[#18352d] p-6 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.9)]">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Save flow
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Lưu menu + cost profile</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Khi bạn lưu, frontend sẽ upsert vào <code>products</code>,{" "}
              <code>product_variants</code> và <code>recipe_components</code>. Khi
              tạo đơn mới, Supabase trigger sẽ dùng các giá trị này để tính COGS và
              gross profit tự động.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-[#18352d] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Đang lưu..." : "Lưu thực đơn"}
            </button>
            {state.status !== "idle" ? (
              <p
                className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                  state.status === "success"
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "bg-rose-400/15 text-rose-200"
                }`}
              >
                {state.message}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </form>
  );
}

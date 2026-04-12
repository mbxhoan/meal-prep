"use client";

import { useActionState, useMemo, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import { saveMenuProductAction } from "@/lib/admin/actions";
import { formatCurrency, slugify } from "@/lib/admin/format";
import { ADMIN_SIMPLE_MODE } from "@/features/admin/config";
import type {
  AdminCategory,
  InventoryItem,
  MenuProduct,
  MenuProductImage,
  MenuVariant,
  RecipeComponent,
} from "@/lib/admin/types";

const initialState = {
  status: "idle",
  message: "",
  mode: "demo",
} as const;

type VariantState = MenuVariant;

function makeEmptyGalleryImage(
  productId: string,
  index: number,
  isPrimary = false,
): MenuProductImage {
  return {
    id: crypto.randomUUID(),
    productId,
    imageUrl: "",
    altText: "",
    sortOrder: index,
    isPrimary,
  };
}

function normalizeGalleryImages(images: MenuProductImage[]) {
  const normalized = images.slice(0, 8).map((image, index) => ({
    ...image,
    imageUrl: image.imageUrl.trim(),
    altText: image.altText.trim(),
    sortOrder: index,
  }));

  const primaryIndex = normalized.findIndex(
    (image) => image.isPrimary && image.imageUrl.length > 0,
  );
  const firstFilledIndex = normalized.findIndex(
    (image) => image.imageUrl.length > 0,
  );
  const resolvedPrimaryIndex =
    primaryIndex >= 0 ? primaryIndex : firstFilledIndex;

  return normalized.map((image, index) => ({
    ...image,
    isPrimary:
      resolvedPrimaryIndex >= 0
        ? index === resolvedPrimaryIndex
        : index === 0 && normalized.length > 0,
  }));
}

function buildInitialGallery(product: MenuProduct): MenuProductImage[] {
  const existingImages = product.images ?? [];
  const sourceImages =
    existingImages.length > 0
      ? existingImages
      : product.mainImageUrl
        ? [
            {
              id: crypto.randomUUID(),
              productId: product.id,
              imageUrl: product.mainImageUrl,
              altText: product.name,
              sortOrder: 0,
              isPrimary: true,
            },
          ]
        : [makeEmptyGalleryImage(product.id, 0, true)];

  return normalizeGalleryImages(sourceImages);
}

function makeEmptyVariant(productId: string): VariantState {
  return {
    id: crypto.randomUUID(),
    productId,
    label: "Biến thể mới",
    weightInGrams: null,
    price: 0,
    compareAtPrice: null,
    standardCost: 0,
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
  const formulaCost =
    recipeCost + variant.packagingCost + variant.laborCost + variant.overheadCost;
  const totalCost = variant.standardCost > 0 ? variant.standardCost : formulaCost;
  const grossProfit = variant.price - totalCost;
  const grossMargin = variant.price > 0 ? grossProfit / variant.price : 0;

  return {
    ...variant,
    standardCost: Math.max(variant.standardCost, 0),
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
  const isSimple = ADMIN_SIMPLE_MODE;
  const inventoryIndex = useMemo(
    () => Object.fromEntries(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems],
  );
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [shortDescription, setShortDescription] = useState(product.shortDescription);
  const [description, setDescription] = useState(product.description);
  const [galleryImages, setGalleryImages] = useState<MenuProductImage[]>(() =>
    buildInitialGallery(product),
  );
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);
  const [isPublished, setIsPublished] = useState(product.isPublished);
  const [sortOrder, setSortOrder] = useState(product.sortOrder);
  const [variants, setVariants] = useState<VariantState[]>(
    product.variants.map((variant) => recalculateVariantCosts(variant, inventoryIndex)),
  );
  const [state, action, pending] = useActionState(saveMenuProductAction, initialState);
  const mainImageUrl = useMemo(() => {
    const primaryImage = galleryImages.find(
      (image) => image.isPrimary && image.imageUrl.trim().length > 0,
    );

    return (
      primaryImage?.imageUrl ??
      galleryImages.find((image) => image.imageUrl.trim().length > 0)?.imageUrl ??
      ""
    );
  }, [galleryImages]);

  function updateVariant(variantId: string, updater: (variant: VariantState) => VariantState) {
    setVariants((current) =>
      current.map((variant) =>
        variant.id === variantId
          ? recalculateVariantCosts(updater(variant), inventoryIndex)
          : variant,
      ),
    );
  }

  function updateGalleryImage(
    imageId: string,
    updater: (image: MenuProductImage) => MenuProductImage,
  ) {
    setGalleryImages((current) =>
      normalizeGalleryImages(
        current.map((image) => (image.id === imageId ? updater(image) : image)),
      ),
    );
  }

  function addGalleryImage() {
    setGalleryImages((current) => {
      if (current.length >= 8) {
        return current;
      }

      return normalizeGalleryImages([
        ...current,
        makeEmptyGalleryImage(product.id, current.length, current.length === 0),
      ]);
    });
  }

  function setPrimaryGalleryImage(imageId: string) {
    setGalleryImages((current) =>
      normalizeGalleryImages(
        current.map((image) => ({
          ...image,
          isPrimary: image.id === imageId,
        })),
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
          images: galleryImages.map((image, index) => ({
            id: image.id,
            imageUrl: image.imageUrl,
            altText: image.altText || `${name} ${index + 1}`,
            sortOrder: index,
            isPrimary: image.isPrimary,
          })),
          isFeatured,
          isPublished,
          sortOrder,
          variants: variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            weightInGrams: variant.weightInGrams,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            standardCost: variant.standardCost,
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
        <div className="space-y-5">
          <div className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                  Món hàng
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  Tên, nhóm và giá
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isSimple
                    ? "Nhập khối lượng, giá vốn và giá bán như bảng tính."
                    : "Nhập đầy đủ thông tin của món và các phần nâng cao nếu cần."}
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-500">
                Mã: {product.id.slice(0, 8)}...
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
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
              {!isSimple ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Đường dẫn
                  </span>
                  <input
                    value={slug}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Nhóm
                </span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="">Chưa chọn nhóm</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              {!isSimple ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Thứ tự sắp xếp
                  </span>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(Number(event.target.value || 0))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                </label>
              ) : null}
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Ghi chú ngắn
              </span>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>

            {!isSimple ? (
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
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              {!isSimple ? (
                <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(event) => setIsFeatured(event.target.checked)}
                  />
                  Nổi bật
                </label>
              ) : null}
              <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(event) => setIsPublished(event.target.checked)}
                />
                Đang dùng
              </label>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                  Loại món
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  Mỗi khối lượng có một giá riêng
                </h2>
              </div>
              {!isSimple ? (
                <button
                  type="button"
                  onClick={() =>
                    setVariants((current) => [...current, makeEmptyVariant(product.id)])
                  }
                  title="Thêm loại"
                  aria-label="Thêm loại"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  <FaPlus className="text-sm" />
                </button>
              ) : null}
            </div>

            <div className="mt-4 space-y-4">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div
                    className={`grid gap-4 ${
                      isSimple ? "md:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-5"
                    }`}
                  >
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Tên loại
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
                        Khối lượng (g)
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
                        Giá vốn
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.standardCost}
                        onChange={(event) =>
                          updateVariant(variant.id, (current) => ({
                            ...current,
                            standardCost: Math.max(Number(event.target.value || 0), 0),
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
                        min="0"
                        step="1"
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

                    {!isSimple ? (
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Giá so sánh
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
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 xl:col-span-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Tự tính
                        </p>
                        <p className="mt-2 text-slate-700">
                          Lãi và tỷ lệ lãi sẽ đổi ngay khi bạn sửa giá vốn hoặc giá bán.
                        </p>
                      </div>
                    )}
                  </div>

                  {!isSimple ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Bao bì
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
                          Nhân công
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
                          Chi phí chung
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
                          Thứ tự
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
                  ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      Phần chi phí đang tạm ẩn.
                    </p>
                  )}

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
                      Mặc định
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
                      Đang dùng
                    </label>
                    {!isSimple ? (
                      <button
                        type="button"
                        onClick={() =>
                          setVariants((current) =>
                            current.length > 1
                              ? current.filter((entry) => entry.id !== variant.id)
                              : current,
                          )
                        }
                        title="Xóa loại"
                        aria-label="Xóa loại"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    ) : null}
                  </div>

                  {!isSimple ? (
                    <>
                      <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Thành phần công thức
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Chi phí nguyên liệu được lấy từ tồn kho theo giá vốn
                              bình quân hiện tại.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addRecipeComponent(variant.id)}
                            title="Thêm nguyên liệu"
                            aria-label="Thêm nguyên liệu"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                          >
                            <FaPlus className="text-sm" />
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {variant.recipeComponents.length === 0 ? (
                            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                              Biến thể này chưa có công thức định lượng. Hãy thêm
                              nguyên liệu để hệ thống tự tính chi phí công thức.
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
                                  Số lượng / đơn vị
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
                                  Hao hụt %
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
                                  Chi phí dòng
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
                                title="Xóa nguyên liệu"
                                aria-label="Xóa nguyên liệu"
                                className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-[24px] bg-[#18352d] p-4 text-white md:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                            Chi phí công thức
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {formatCurrency(variant.recipeCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                            Tổng giá vốn
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {formatCurrency(variant.totalCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                            Lợi nhuận gộp
                          </p>
                          <p className="mt-2 text-lg font-semibold text-emerald-300">
                            {formatCurrency(variant.grossProfit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                            Biên lợi nhuận
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {(variant.grossMargin * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 grid gap-3 rounded-[24px] bg-[#18352d] p-4 text-white md:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                          Giá vốn
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {formatCurrency(variant.totalCost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                          Lợi nhuận gộp
                        </p>
                        <p className="mt-2 text-lg font-semibold text-emerald-300">
                          {formatCurrency(variant.grossProfit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                          Tỷ lệ lãi
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {(variant.grossMargin * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                          Giá bán
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {formatCurrency(variant.price)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!isSimple ? (
            <div className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
                  Ảnh món
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  Tối đa 8 ảnh
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Ảnh này sẽ dùng cho menu và bill.
                </p>
              </div>
              <button
                type="button"
                onClick={addGalleryImage}
                disabled={galleryImages.length >= 8}
                title="Thêm ảnh"
                aria-label="Thêm ảnh"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPlus className="text-sm" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {galleryImages.map((image, index) => (
                <div
                  key={image.id}
                  className="rounded-[26px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Ảnh {index + 1}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                        {image.isPrimary ? "Ảnh đại diện" : "Ảnh phụ"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrimaryGalleryImage(image.id)}
                      disabled={
                        image.isPrimary || image.imageUrl.trim().length === 0
                      }
                      className="rounded-full border border-[#18352d]/20 bg-white px-4 py-2 text-xs font-medium text-[#18352d] transition hover:border-[#18352d]/40 hover:bg-[#18352d]/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Ảnh đại diện
                    </button>
                  </div>
                  <div className="mt-4">
                    <ImageUploader
                      value={image.imageUrl}
                      onChange={(nextValue) =>
                        updateGalleryImage(image.id, (current) => ({
                          ...current,
                          imageUrl: nextValue,
                          altText: current.altText || name,
                        }))
                      }
                      pathPrefix={`products/${product.id}/images`}
                      title={`Ảnh món ${index + 1}`}
                      label="Link ảnh"
                      emptyText="Chưa có ảnh"
                      uploadLabel="Tải ảnh lên"
                      helpText="Dán link ảnh hoặc tải ảnh lên."
                    />
                  </div>
                </div>
              ))}
            </div>
            </div>
          ) : null}

          <div className="rounded-[30px] border border-[#18352d]/10 bg-[#18352d] p-5 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.9)]">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Lưu món
            </p>
            <h2 className="mt-3 text-lg font-semibold">Lưu</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Lưu xong, món sẽ dùng giá mới ngay.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-[#18352d] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Đang lưu..." : "Lưu"}
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

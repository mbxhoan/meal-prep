"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaPlus, FaTrash, FaTriangleExclamation } from "react-icons/fa6";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import {
  StickyFormFooter,
  getImageShellClassName,
  getSelectClassName,
  getSectionClassName,
  getTextFieldClassName,
  getTextareaClassName,
  getToggleLabelClassName,
} from "@/features/admin/components/form-ux";
import { deleteMenuProductAction, saveMenuProductAction } from "@/lib/admin/actions";
import { formatCurrency, slugify } from "@/lib/admin/format";
import { ADMIN_SIMPLE_MODE } from "@/features/admin/config";
import { createId } from "@/lib/id";
import { validateMenuProductPayload } from "@/lib/admin/menu-product";
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

const initialDeleteState = {
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
    id: createId("gallery"),
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
              id: createId("gallery"),
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
    id: createId("variant"),
    productId,
    label: "",
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

function imageSignature(image: MenuProductImage) {
  return {
    imageUrl: image.imageUrl.trim(),
    altText: image.altText.trim(),
    isPrimary: image.isPrimary,
  };
}

function variantFieldSignature(variant: VariantState) {
  return {
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
      inventoryItemId: component.inventoryItemId,
      quantityPerUnit: component.quantityPerUnit,
      wastagePercent: component.wastagePercent,
    })),
  };
}

function isVariantValueDirty(
  current: VariantState,
  original: VariantState | null,
  key: keyof Pick<
    VariantState,
    | "label"
    | "weightInGrams"
    | "price"
    | "compareAtPrice"
    | "standardCost"
    | "packagingCost"
    | "laborCost"
    | "overheadCost"
    | "isDefault"
    | "isActive"
    | "sortOrder"
  >,
) {
  if (!original) {
    return true;
  }

  return current[key] !== original[key];
}

function isRecipeComponentDirty(
  component: RecipeComponent,
  original: RecipeComponent | null,
) {
  if (!original) {
    return true;
  }

  return (
    component.inventoryItemId !== original.inventoryItemId ||
    component.quantityPerUnit !== original.quantityPerUnit ||
    component.wastagePercent !== original.wastagePercent
  );
}

export function ProductEditorForm({
  product,
  categories,
  inventoryItems,
  allowDelete = false,
}: {
  product: MenuProduct;
  categories: AdminCategory[];
  inventoryItems: InventoryItem[];
  allowDelete?: boolean;
}) {
  const router = useRouter();
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
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteMenuProductAction,
    initialDeleteState,
  );
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
  const originalGallerySignature = useMemo(
    () =>
      JSON.stringify(
        buildInitialGallery(product).map((image) => imageSignature(image)),
      ),
    [product],
  );
  const currentGallerySignature = useMemo(
    () => JSON.stringify(galleryImages.map((image) => imageSignature(image))),
    [galleryImages],
  );
  const originalVariantMap = useMemo(
    () => new Map(product.variants.map((variant) => [variant.id, variant])),
    [product.variants],
  );
  const validationMessage = useMemo(
    () =>
      validateMenuProductPayload({
        name,
        categoryId,
        variants,
      }),
    [categoryId, name, variants],
  );
  const canSaveProduct = validationMessage == null;
  const nameDirty = name !== product.name;
  const slugDirty = slug !== product.slug;
  const categoryDirty = categoryId !== (product.categoryId ?? "");
  const shortDescriptionDirty = shortDescription !== product.shortDescription;
  const descriptionDirty = description !== product.description;
  const sortOrderDirty = sortOrder !== product.sortOrder;
  const isFeaturedDirty = isFeatured !== product.isFeatured;
  const isPublishedDirty = isPublished !== product.isPublished;
  const galleryDirty = currentGallerySignature !== originalGallerySignature;

  useEffect(() => {
    if (allowDelete && deleteState.status === "success") {
      router.replace("/admin/menu");
    }
  }, [allowDelete, deleteState.status, router]);

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
          id: createId("gallery"),
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
    <form action={action} className="space-y-6 pb-40">
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
      {allowDelete ? (
        <input
          type="hidden"
          name="deletePayload"
          value={JSON.stringify({ productId: product.id })}
        />
      ) : null}

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
                  className={getTextFieldClassName(nameDirty)}
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
                    className={getTextFieldClassName(slugDirty)}
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
                  className={getSelectClassName(categoryDirty)}
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
                    className={getTextFieldClassName(sortOrderDirty)}
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
              className={getTextareaClassName(shortDescriptionDirty)}
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
                  className={getTextareaClassName(descriptionDirty)}
                />
              </label>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              {!isSimple ? (
                <label className={getToggleLabelClassName(isFeaturedDirty)}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(event) => setIsFeatured(event.target.checked)}
                  />
                  Nổi bật
                </label>
              ) : null}
              <label className={getToggleLabelClassName(isPublishedDirty)}>
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
            </div>

            <div className="mt-4 space-y-4">
              {variants.map((variant) => (
                (() => {
                  const originalVariant = originalVariantMap.get(variant.id) ?? null;
                  const originalVariantSignature = originalVariant
                    ? JSON.stringify(variantFieldSignature(originalVariant))
                    : null;
                  const variantCardDirty =
                    !originalVariant ||
                    JSON.stringify(variantFieldSignature(variant)) !==
                      originalVariantSignature;

                  return (
                <div
                  key={variant.id}
                  className={getSectionClassName(variantCardDirty)}
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
                        placeholder="Ví dụ: 100g"
                        className={getTextFieldClassName(
                          isVariantValueDirty(variant, originalVariant, "label"),
                          "bg-white",
                        )}
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
                        placeholder="Ví dụ: 100"
                        className={getTextFieldClassName(
                          isVariantValueDirty(
                            variant,
                            originalVariant,
                            "weightInGrams",
                          ),
                          "bg-white",
                        )}
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
                        className={getTextFieldClassName(
                          isVariantValueDirty(variant, originalVariant, "standardCost"),
                          "bg-white",
                        )}
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
                        className={getTextFieldClassName(
                          isVariantValueDirty(variant, originalVariant, "price"),
                          "bg-white",
                        )}
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
                          className={getTextFieldClassName(
                            isVariantValueDirty(
                              variant,
                              originalVariant,
                              "compareAtPrice",
                            ),
                            "bg-white",
                          )}
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
                          className={getTextFieldClassName(
                            isVariantValueDirty(variant, originalVariant, "packagingCost"),
                            "bg-white",
                          )}
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
                          className={getTextFieldClassName(
                            isVariantValueDirty(variant, originalVariant, "laborCost"),
                            "bg-white",
                          )}
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
                          className={getTextFieldClassName(
                            isVariantValueDirty(variant, originalVariant, "overheadCost"),
                            "bg-white",
                          )}
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
                          className={getTextFieldClassName(
                            isVariantValueDirty(variant, originalVariant, "sortOrder"),
                            "bg-white",
                          )}
                        />
                      </label>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      Phần chi phí đang tạm ẩn.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <label className={getToggleLabelClassName(
                      originalVariant ? variant.isDefault !== originalVariant.isDefault : true,
                      "bg-white",
                    )}>
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
                    <label className={getToggleLabelClassName(
                      originalVariant ? variant.isActive !== originalVariant.isActive : true,
                      "bg-white",
                    )}>
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
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((current) =>
                          current.length > 1
                            ? current.filter((entry) => entry.id !== variant.id)
                            : current,
                        )
                      }
                      disabled={variants.length <= 1}
                      title="Xóa loại"
                      aria-label="Xóa loại"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>

                  {!isSimple ? (
                    <>
                      <div
                        className={`mt-4 rounded-[24px] border bg-white p-4 ${
                          variant.recipeComponents.length > 0 &&
                          variant.recipeComponents.some((component) => {
                            const originalComponent =
                              originalVariant?.recipeComponents.find(
                                (entry) => entry.id === component.id,
                              ) ?? null;
                            return isRecipeComponentDirty(component, originalComponent);
                          })
                            ? "border-emerald-200 ring-2 ring-emerald-100/80"
                            : "border-slate-200"
                        }`}
                      >
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
                                  className={getSelectClassName(
                                    isRecipeComponentDirty(
                                      component,
                                      originalVariant?.recipeComponents.find(
                                        (entry) => entry.id === component.id,
                                      ) ?? null,
                                    ),
                                    "bg-white",
                                  )}
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
                                  className={getTextFieldClassName(
                                    isRecipeComponentDirty(
                                      component,
                                      originalVariant?.recipeComponents.find(
                                        (entry) => entry.id === component.id,
                                      ) ?? null,
                                    ),
                                    "bg-white",
                                  )}
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
                                  className={getTextFieldClassName(
                                    isRecipeComponentDirty(
                                      component,
                                      originalVariant?.recipeComponents.find(
                                        (entry) => entry.id === component.id,
                                      ) ?? null,
                                    ),
                                    "bg-white",
                                  )}
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
                  );
                })()
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!isSimple ? (
            <div
              className={`rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] ${
                galleryDirty ? "ring-2 ring-emerald-100/80" : ""
              }`}
            >
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
                  className={getImageShellClassName(
                    String(image.imageUrl).trim() !== "" ||
                      String(image.altText).trim() !== "" ||
                      image.isPrimary,
                    "rounded-[26px] p-4",
                  )}
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

          {allowDelete ? (
            <div className="rounded-[30px] border border-rose-200 bg-rose-50/75 p-5 shadow-[0_20px_80px_-40px_rgba(239,68,68,0.28)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-600">
                    <FaTriangleExclamation className="text-[10px]" />
                    Xoá món
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-rose-900">
                    Xoá chỉ khi món chưa được dùng
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-rose-700/80">
                    Nếu món này đã xuất hiện trong đơn hàng, combo hoặc bảng giá,
                    hệ thống sẽ chặn và chỉ ra nơi đang dùng để bạn mở tab kiểm tra.
                  </p>
                </div>
                <button
                  type="submit"
                  formAction={deleteAction}
                  disabled={deletePending}
                  onClick={(event) => {
                    if (
                      !window.confirm(
                        "Xoá món này? Chỉ thực hiện khi bạn chắc chắn món chưa được dùng ở bất kỳ đâu.",
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletePending ? "Đang xoá..." : "Xoá món"}
                </button>
              </div>

              {deleteState.status !== "idle" ? (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    deleteState.status === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-white text-rose-700"
                  }`}
                >
                  <p className="font-medium">{deleteState.message}</p>
                  {deleteState.references?.length ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-rose-500">
                        Đã được dùng ở
                      </p>
                      {deleteState.references.map((reference) => (
                        <Link
                          key={`${reference.label}-${reference.href}`}
                          href={reference.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start justify-between gap-3 rounded-2xl border border-rose-100 bg-white px-3 py-2 transition hover:border-rose-200 hover:bg-rose-50/60"
                        >
                          <span className="min-w-0">
                            <span className="block font-medium text-slate-900">
                              {reference.label}
                            </span>
                            {reference.note ? (
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {reference.note}
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-xs font-medium text-rose-600">
                            Mở tab
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <StickyFormFooter
            note="Lưu xong, món sẽ dùng giá mới ngay."
            message={
              canSaveProduct
                ? state.status !== "idle"
                  ? state.message
                  : undefined
                : "Tên món, nhóm và ít nhất 1 loại có khối lượng, giá vốn và giá bán là bắt buộc."
            }
            messageTone={
              canSaveProduct
                ? state.status === "success"
                  ? "success"
                  : "danger"
                : "danger"
            }
            submitLabel={canSaveProduct ? "Lưu" : "Nhập tên, nhóm và ít nhất 1 loại"}
            pendingLabel="Đang lưu..."
            pending={pending}
            disabled={!canSaveProduct}
          />
        </div>
      </section>
    </form>
  );
}

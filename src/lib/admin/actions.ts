"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext, getCategories, getMenuProducts } from "@/lib/admin/service";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { requirePermission, PermissionDeniedError } from "@/lib/rbac/server";
import { createId } from "@/lib/id";
import type {
  ActionState,
  ActionReference,
  MenuExcelImportRow,
  MenuExcelImportSummary,
  MenuProduct,
  MenuProductPayload,
} from "@/lib/admin/types";
import { createSalesOrderAction } from "@/lib/sales/actions";
import { slugify } from "@/lib/admin/format";
import { validateMenuProductPayload } from "@/lib/admin/menu-product";

const demoSuccess = (message: string): ActionState => ({
  status: "success",
  message,
  mode: "demo",
});

const liveSuccess = (message: string): ActionState => ({
  status: "success",
  message,
  mode: "live",
});

const actionError = (message: string, mode: ActionState["mode"]): ActionState => ({
  status: "error",
  message,
  mode,
});

function parseJsonField<T>(formData: FormData, key: string) {
  const raw = formData.get(key);

  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Missing ${key}`);
  }

  return JSON.parse(raw) as T;
}

function sanitizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMenuProductImages(payload: MenuProductPayload) {
  const images = (payload.images ?? [])
    .map((image, index) => ({
      imageUrl: String(image.imageUrl ?? "").trim(),
      altText: String(image.altText ?? payload.name ?? "").trim(),
      sortOrder: sanitizeNumber(image.sortOrder, index),
      isPrimary: image.isPrimary === true,
    }))
    .filter((image) => image.imageUrl.length > 0)
    .slice(0, 8);

  if (images.length === 0 && payload.mainImageUrl.trim().length > 0) {
    images.push({
      imageUrl: payload.mainImageUrl.trim(),
      altText: payload.name,
      sortOrder: 0,
      isPrimary: true,
    });
  }

  if (images.length === 0) {
    return [];
  }

  const primaryIndex = images.findIndex((image) => image.isPrimary);
  const resolvedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return images.map((image, index) => ({
    ...image,
    sortOrder: index,
    isPrimary: index === resolvedPrimaryIndex,
  }));
}

export async function saveMenuProductAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: MenuProductPayload;

  try {
    payload = parseJsonField<MenuProductPayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu thực đơn.", "demo");
  }

  const validationMessage = validateMenuProductPayload({
    name: payload.name,
    categoryId: payload.categoryId,
    variants: payload.variants,
  });

  if (validationMessage) {
    return actionError(
      validationMessage,
      isSupabaseConfigured() ? "live" : "demo",
    );
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess(
      "Đã lưu trong chế độ demo. Khi nối Supabase thật, form này sẽ ghi trực tiếp vào products, product_variants và recipe_components.",
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoSuccess("Supabase chưa sẵn sàng, đang giữ ở chế độ demo.");
    }

    const images = normalizeMenuProductImages(payload);
    const primaryImageUrl = images.find((image) => image.isPrimary)?.imageUrl ?? "";

    const { error: productError } = await supabase.from("products").upsert(
      {
        id: payload.id,
        category_id: payload.categoryId,
        name: payload.name,
        slug: payload.slug,
        short_description: payload.shortDescription,
        description: payload.description,
        main_image_url: primaryImageUrl.length > 0 ? primaryImageUrl : null,
        is_featured: payload.isFeatured,
        is_published: payload.isPublished,
        sort_order: sanitizeNumber(payload.sortOrder, 0),
      },
      { onConflict: "id" },
    );

    if (productError) {
      return actionError(productError.message, "live");
    }

    const { error: imageDeleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", payload.id);

    if (imageDeleteError) {
      return actionError(imageDeleteError.message, "live");
    }

    if (images.length > 0) {
      const { error: imageInsertError } = await supabase
        .from("product_images")
        .insert(
          images.map((image) => ({
            product_id: payload.id,
            image_url: image.imageUrl,
            alt_text: image.altText.length > 0 ? image.altText : payload.name,
            sort_order: image.sortOrder,
            is_primary: image.isPrimary,
          })),
        );

      if (imageInsertError) {
        return actionError(imageInsertError.message, "live");
      }
    }

    const variantRows = payload.variants.map((variant) => ({
      id: variant.id,
      product_id: payload.id,
      label: variant.label,
      weight_in_grams:
        variant.weightInGrams == null
          ? null
          : sanitizeNumber(variant.weightInGrams),
      price: sanitizeNumber(variant.price),
      compare_at_price:
        variant.compareAtPrice == null
          ? null
          : sanitizeNumber(variant.compareAtPrice),
      standard_cost: sanitizeNumber(variant.standardCost),
      packaging_cost: sanitizeNumber(variant.packagingCost),
      labor_cost: sanitizeNumber(variant.laborCost),
      overhead_cost: sanitizeNumber(variant.overheadCost),
      is_default: variant.isDefault,
      is_active: variant.isActive,
      sort_order: sanitizeNumber(variant.sortOrder, 0),
    }));

    if (variantRows.length > 0) {
      const { error: variantError } = await supabase
        .from("product_variants")
        .upsert(variantRows, { onConflict: "id" });

      if (variantError) {
        return actionError(variantError.message, "live");
      }
    }

    const recipeRows = payload.variants.flatMap((variant) =>
      variant.recipeComponents.map((component) => ({
        id: component.id,
        variant_id: variant.id,
        inventory_item_id: component.inventoryItemId,
        quantity_per_unit: sanitizeNumber(component.quantityPerUnit),
        wastage_pct: sanitizeNumber(component.wastagePercent),
      })),
    );

    if (recipeRows.length > 0) {
      const { error: recipeError } = await supabase
        .from("recipe_components")
        .upsert(recipeRows, { onConflict: "id" });

      if (recipeError) {
        return actionError(recipeError.message, "live");
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/menu");
    revalidatePath(`/admin/menu/${payload.id}`);
    revalidatePath("/menu");
    if (payload.slug) {
      revalidatePath(`/product/${payload.slug}`);
    }

    return liveSuccess("Đã lưu thực đơn, cost profile và công thức định lượng.");
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Không lưu được thực đơn.",
      "live",
    );
  }
}

type ImportMenuProductsPayload = {
  rows: Array<Record<string, unknown>>;
};

function normalizeImportKey(value: string) {
  return slugify(value.trim());
}

function parseBooleanField(value: unknown, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  const text = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["1", "true", "yes", "y", "có", "co", "đúng", "dang dung", "dang hoat dong"].includes(text)) {
    return true;
  }

  if (["0", "false", "no", "n", "khong", "không", "tam an", "tạm ẩn"].includes(text)) {
    return false;
  }

  return fallback;
}

function parseNullableNumber(value: unknown) {
  if (value == null || String(value).trim().length === 0) {
    return null;
  }

  const normalized = String(value)
    .replaceAll(".", "")
    .replaceAll(",", ".")
    .trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseRequiredNumber(value: unknown) {
  const parsed = parseNullableNumber(value);
  return parsed == null ? null : parsed;
}

function resolveCategoryId(
  categories: Array<{ id: string; name: string; slug: string }>,
  categoryName: string,
) {
  const normalized = normalizeImportKey(categoryName);

  return (
    categories.find((category) => normalizeImportKey(category.name) === normalized)?.id ??
    categories.find((category) => normalizeImportKey(category.slug) === normalized)?.id ??
    null
  );
}

function normalizeImportRow(row: Record<string, unknown>, rowIndex: number): {
  row: MenuExcelImportRow | null;
  warning?: string;
} {
  const productName = String(
    row["Tên món"] ??
      row["Món"] ??
      row["ten mon"] ??
      row["Tên món "] ??
      row["ten_mon"] ??
      "",
  ).trim();
  const categoryName = String(
    row["Nhóm"] ??
      row["nhom"] ??
      row["Nhóm hàng"] ??
      row["nhom_hang"] ??
      "",
  ).trim();
  const variantLabel = String(
    row["Tên loại"] ??
      row["Loại"] ??
      row["ten loai"] ??
      row["ten_loai"] ??
      row["Loại món"] ??
      "",
  ).trim();
  const weightInGrams =
    parseNullableNumber(
      row["Trọng lượng (g)"] ??
        row["Trọng lượng"] ??
        row["trong luong (g)"] ??
        row["trong_luong_g"],
    ) ??
    parseNullableNumber(
      row["Khối lượng"] ?? row["Khối lượng (g)"] ?? row["khoi_luong"] ?? row["trong luong"],
    );
  const price = parseRequiredNumber(row["Giá bán"] ?? row["gia ban"] ?? row["gia_ban"]);
  const standardCost = parseRequiredNumber(row["Giá vốn"] ?? row["gia von"] ?? row["gia_von"]);
  const compareAtPrice = parseNullableNumber(row["Giá niêm yết"] ?? row["gia niem yet"] ?? row["compare_at_price"]);
  const productSortOrder = parseNullableNumber(row["Thứ tự món"] ?? row["thu tu mon"] ?? row["product_sort_order"]);
  const variantSortOrder = parseNullableNumber(row["Thứ tự loại"] ?? row["thu tu loai"] ?? row["variant_sort_order"]);
  const productId = String(row["Mã món"] ?? row["ma mon"] ?? "").trim();
  const variantId = String(row["Mã loại"] ?? row["ma loai"] ?? "").trim();
  const notes = String(row["Ghi chú"] ?? row["ghi chu"] ?? "").trim();

  if (productName.length === 0 || categoryName.length === 0 || weightInGrams == null || price == null || standardCost == null) {
    return {
      row: null,
      warning: `Dòng ${rowIndex + 2} thiếu Tên món / Nhóm / Trọng lượng / Giá bán / Giá vốn.`,
    };
  }

  if (price <= 0 || standardCost <= 0 || weightInGrams <= 0) {
    return {
      row: null,
      warning: `Dòng ${rowIndex + 2} có giá trị không hợp lệ.`,
    };
  }

  return {
    row: {
      productId: productId.length > 0 ? productId : null,
      productName,
      categoryName,
      variantId: variantId.length > 0 ? variantId : null,
      variantLabel: variantLabel.length > 0 ? variantLabel : null,
      weightInGrams,
      price,
      standardCost,
      compareAtPrice,
      isDefault: parseBooleanField(row["Mặc định"] ?? row["mac dinh"] ?? row["is_default"], false),
      isActive: parseBooleanField(row["Đang dùng"] ?? row["dang dung"] ?? row["is_active"], true),
      productSortOrder: productSortOrder == null ? null : productSortOrder,
      variantSortOrder: variantSortOrder == null ? null : variantSortOrder,
      notes: notes.length > 0 ? notes : null,
    },
  };
}

export async function importMenuProductsFromExcelAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: ImportMenuProductsPayload;

  try {
    payload = parseJsonField<ImportMenuProductsPayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu Excel.", "demo");
  }

  const inputRows = Array.isArray(payload.rows) ? payload.rows : [];

  if (inputRows.length === 0) {
    return actionError("File Excel chưa có dòng dữ liệu hợp lệ.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return liveSuccess(
      `Đã đọc ${inputRows.length} dòng Excel. Khi nối Supabase thật, hệ thống sẽ tự nạp/update món và loại món.`,
    );
  }

  try {
    const context = await getAdminContext();
    if (!context.shop) {
      return actionError("Chưa chọn shop hiện tại.", "live");
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return actionError("Supabase chưa sẵn sàng.", "live");
    }

    const [categories, existingProducts] = await Promise.all([
      getCategories(),
      getMenuProducts(),
    ]);

    const normalizedRows: MenuExcelImportRow[] = [];
    const warnings: string[] = [];

    inputRows.forEach((row, index) => {
      const normalized = normalizeImportRow(row, index);

      if (normalized.warning) {
        warnings.push(normalized.warning);
      }

      if (normalized.row) {
        normalizedRows.push(normalized.row);
      }
    });

    if (normalizedRows.length === 0) {
      return actionError(
        warnings[0] ?? "Không có dòng hợp lệ để nạp.",
        "live",
      );
    }

    const existingById = new Map(existingProducts.map((product) => [product.id, product]));
    const existingByKey = new Map(
      existingProducts.map((product) => [
        `${product.categoryId ?? ""}:${normalizeImportKey(product.name)}`,
        product,
      ]),
    );

    type GroupedProduct = {
      key: string;
      productId: string;
      categoryId: string;
      categoryName: string;
      name: string;
      rows: MenuExcelImportRow[];
      existingProduct: MenuProduct | null;
    };

    const groupedProducts = new Map<string, GroupedProduct>();

    for (const row of normalizedRows) {
      const categoryId = resolveCategoryId(categories, row.categoryName);

      if (!categoryId) {
        warnings.push(`Không tìm thấy nhóm "${row.categoryName}" cho món "${row.productName}".`);
        continue;
      }

      const rowKey = row.productId?.length
        ? `id:${row.productId}`
        : `${categoryId}:${normalizeImportKey(row.productName)}`;
      const existingProduct =
        (row.productId ? existingById.get(row.productId) ?? null : null) ??
        existingByKey.get(`${categoryId}:${normalizeImportKey(row.productName)}`) ??
        null;
      const productId =
        row.productId && row.productId.length > 0
          ? row.productId
          : existingProduct?.id ?? createId("product");

      const bucket =
        groupedProducts.get(rowKey) ??
        ({
          key: rowKey,
          productId,
          categoryId,
          categoryName: row.categoryName,
          name: row.productName,
          rows: [],
          existingProduct,
        } satisfies GroupedProduct);

      bucket.rows.push(row);
      groupedProducts.set(rowKey, bucket);
    }

    const productRows: Array<{
      id: string;
      category_id: string | null;
      name: string;
      slug: string;
      short_description: string;
      description: string;
      main_image_url: string | null;
      is_featured: boolean;
      is_published: boolean;
      sort_order: number;
    }> = [];
    const variantRows: Array<{
      id: string;
      product_id: string;
      label: string;
      weight_in_grams: number | null;
      price: number;
      compare_at_price: number | null;
      standard_cost: number;
      packaging_cost: number;
      labor_cost: number;
      overhead_cost: number;
      is_default: boolean;
      is_active: boolean;
      sort_order: number;
    }> = [];
    let importedProducts = 0;
    let updatedProducts = 0;
    let importedVariants = 0;
    let updatedVariants = 0;

    for (const group of groupedProducts.values()) {
      const product = group.existingProduct;
      const productSlug = slugify(group.name);
      const nextProductId = group.productId;
      const isUpdate = Boolean(product);

      if (isUpdate) {
        updatedProducts += 1;
      } else {
        importedProducts += 1;
      }

      productRows.push({
        id: nextProductId,
        category_id: group.categoryId,
        name: group.name,
        slug: product?.slug ?? productSlug,
        short_description: product?.shortDescription ?? "",
        description: product?.description ?? "",
        main_image_url: product?.mainImageUrl?.trim() ?? "",
        is_featured: product?.isFeatured ?? false,
        is_published: group.rows.some((row) => row.isActive),
        sort_order:
          group.rows.find((row) => row.productSortOrder != null)?.productSortOrder ??
          product?.sortOrder ??
          0,
      });

      const existingVariantsByKey = new Map(
        (product?.variants ?? []).map((variant) => [
          `${normalizeImportKey(variant.label)}:${variant.weightInGrams ?? ""}`,
          variant,
        ]),
      );

      const sortedRows = [...group.rows].sort((left, right) => {
        const leftOrder = left.variantSortOrder ?? left.productSortOrder ?? 0;
        const rightOrder = right.variantSortOrder ?? right.productSortOrder ?? 0;

        return leftOrder - rightOrder;
      });
      const hasDefault = sortedRows.some((row) => row.isDefault);

      sortedRows.forEach((row, index) => {
        const variantKey = `${normalizeImportKey(row.variantLabel ?? `${row.weightInGrams}g`)}:${row.weightInGrams ?? ""}`;
        let existingVariant = existingVariantsByKey.get(variantKey) ?? null;

        if (row.variantId && product) {
          const variantById = product.variants.find((variant) => variant.id === row.variantId);

          if (variantById) {
            existingVariant = variantById;
          }
        }

        const variantId =
          row.variantId && row.variantId.length > 0
            ? row.variantId
            : existingVariant?.id ?? createId("variant");
        const variantLabel =
          row.variantLabel?.trim().length
            ? row.variantLabel.trim()
            : `${row.weightInGrams}g`;

        if (existingVariant) {
          updatedVariants += 1;
        } else {
          importedVariants += 1;
        }

        variantRows.push({
          id: variantId,
          product_id: nextProductId,
          label: variantLabel,
          weight_in_grams: row.weightInGrams,
          price: row.price,
          compare_at_price: row.compareAtPrice,
          standard_cost: row.standardCost,
          packaging_cost: 0,
          labor_cost: 0,
          overhead_cost: 0,
          is_default:
            sortedRows.length === 1 ? true : row.isDefault || (!hasDefault && index === 0),
          is_active: row.isActive,
          sort_order: row.variantSortOrder ?? index,
        });
      });
    }

    if (productRows.length === 0 || variantRows.length === 0) {
      return actionError("File Excel chưa có dòng hợp lệ để nạp.", "live");
    }

    const { error: productError } = await supabase
      .from("products")
      .upsert(productRows, { onConflict: "id" });

    if (productError) {
      return actionError(productError.message, "live");
    }

    const { error: variantError } = await supabase
      .from("product_variants")
      .upsert(variantRows, { onConflict: "id" });

    if (variantError) {
      return actionError(variantError.message, "live");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/menu");
    revalidatePath("/admin/orders/new");
    revalidatePath("/menu");
    for (const group of groupedProducts.values()) {
      const product = group.existingProduct;
      const previousSlug = product?.slug ?? null;
      const nextSlug = slugify(group.name);

      if (previousSlug) {
        revalidatePath(`/product/${previousSlug}`);
      }
      revalidatePath(`/product/${nextSlug}`);
      revalidatePath(`/admin/menu/${group.productId}`);
    }

    const summary: MenuExcelImportSummary = {
      processedRows: inputRows.length,
      importedProducts,
      updatedProducts,
      importedVariants,
      updatedVariants,
      skippedRows: inputRows.length - normalizedRows.length,
      warnings,
    };

    const suffix = warnings.length > 0 ? ` Đã bỏ qua ${warnings.length} dòng lỗi.` : "";
    return liveSuccess(
      `Đã nạp Excel: ${summary.importedProducts} món mới, ${summary.updatedProducts} món cập nhật, ${summary.importedVariants} loại mới, ${summary.updatedVariants} loại cập nhật.${suffix}`,
    );
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Không nạp được file Excel.",
      "live",
    );
  }
}

type DuplicateComboPayload = {
  comboId: string;
};

type UpdateComboSalePricePayload = {
  comboId: string;
  salePrice: number;
};

type DeleteMenuProductPayload = {
  productId: string;
};

function buildDuplicatedComboCode(sourceCode: string, existingCodes: Set<string>) {
  const baseCode = `${sourceCode.trim().length > 0 ? sourceCode.trim() : "COMBO"}-COPY`;

  if (!existingCodes.has(baseCode)) {
    return baseCode;
  }

  let suffix = 2;
  while (existingCodes.has(`${baseCode}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseCode}-${suffix}`;
}

function firstWords(value: string, maxWords = 3) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}

function formatUsageNote(label: string, extra?: string) {
  return extra ? `${label} · ${extra}` : label;
}

type UsageCountRow = {
  id: string;
};

type SalesOrderUsageRow = UsageCountRow & {
  sales_order_id: string;
  item_name_snapshot: string;
  variant_label_snapshot: string | null;
  created_at: string;
  sales_orders: Array<{ id: string; order_no: string }>;
};

type ComboUsageRow = UsageCountRow & {
  combo_id: string;
  display_text: string;
  updated_at: string;
  combos: Array<{ id: string; code: string; name: string }>;
};

type PriceBookUsageRow = UsageCountRow & {
  price_book_id: string;
  updated_at: string;
  price_books: Array<{ id: string; code: string; name: string }>;
};

function groupUsageReferences<T extends UsageCountRow>(
  rows: T[],
  getGroupKey: (row: T) => string,
  buildReference: (groupRows: T[]) => ActionReference | null,
) {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const key = getGroupKey(row);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)?.push(row);
  }

  return Array.from(groups.values())
    .map((groupRows) => buildReference(groupRows))
    .filter((reference): reference is ActionReference => reference != null);
}

async function collectMenuProductDeletionReferences(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  shopId: string,
  productId: string,
) {
  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select("id, name, slug, product_variants(id, label, weight_in_grams)")
    .eq("id", productId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!productRow) {
    throw new Error("Không tìm thấy món cần xoá.");
  }

  const variantRows = Array.isArray((productRow as Record<string, unknown>).product_variants)
    ? ((productRow as Record<string, unknown>).product_variants as Record<string, unknown>[])
    : [];

  const variantIds = variantRows
    .map((variant) => String(variant.id ?? "").trim())
    .filter((variantId) => variantId.length > 0);
  if (variantIds.length === 0) {
    return {
      productName: String((productRow as Record<string, unknown>).name ?? "Món"),
      variantCount: 0,
      references: [],
    };
  }

  const [menuOrderUsageResponse, legacyOrderUsageResponse, combosResponse, priceBooksResponse] =
    await Promise.all([
      supabase
        .from("sales_order_items")
        .select(
          "id, sales_order_id, item_name_snapshot, variant_label_snapshot, created_at, sales_orders(id, order_no)",
          { count: "exact" },
        )
        .eq("shop_id", shopId)
        .in("menu_item_variant_id", variantIds)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("sales_order_items")
        .select(
          "id, sales_order_id, item_name_snapshot, variant_label_snapshot, created_at, sales_orders(id, order_no)",
          { count: "exact" },
        )
        .eq("shop_id", shopId)
        .in("legacy_product_variant_id", variantIds)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("combo_items")
        .select(
          "id, combo_id, display_text, updated_at, combos(id, code, name)",
          { count: "exact" },
        )
        .eq("shop_id", shopId)
        .in("menu_item_variant_id", variantIds)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(12),
      supabase
        .from("price_book_items")
        .select(
          "id, price_book_id, updated_at, price_books(id, code, name)",
          { count: "exact" },
        )
        .eq("shop_id", shopId)
        .in("menu_item_variant_id", variantIds)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(12),
    ]);

  if (menuOrderUsageResponse.error) {
    throw new Error(menuOrderUsageResponse.error.message);
  }
  if (legacyOrderUsageResponse.error) {
    throw new Error(legacyOrderUsageResponse.error.message);
  }
  if (combosResponse.error) {
    throw new Error(combosResponse.error.message);
  }
  if (priceBooksResponse.error) {
    throw new Error(priceBooksResponse.error.message);
  }

  const references: ActionReference[] = [];

  const orderRows = [
    ...((menuOrderUsageResponse.data ?? []) as SalesOrderUsageRow[]),
    ...((legacyOrderUsageResponse.data ?? []) as SalesOrderUsageRow[]),
  ];
  references.push(
    ...groupUsageReferences(
      orderRows,
      (row) => row.sales_order_id,
      (groupRows) => {
        const firstRow = groupRows[0];
        const orderNo =
          firstRow.sales_orders?.[0]?.order_no?.trim() ||
          firstRow.sales_order_id.slice(0, 8);
        const firstItemLabel = firstWords(
          String(
            firstRow.variant_label_snapshot ??
              firstRow.item_name_snapshot ??
              "Dòng món",
          ),
          4,
        );

        return {
          label: `Đơn ${orderNo}`,
          href: `/admin/orders/${firstRow.sales_order_id}`,
          note: formatUsageNote(firstItemLabel, `${groupRows.length} dòng khớp`),
        };
      },
    ),
  );

  const comboRows = (combosResponse.data ?? []) as ComboUsageRow[];
  references.push(
    ...groupUsageReferences(
      comboRows,
      (row) => row.combo_id,
      (groupRows) => {
        const firstRow = groupRows[0];
        const comboMeta = firstRow.combos?.[0] ?? null;
        const comboLabel =
          comboMeta?.code?.trim().length > 0
            ? `Combo ${comboMeta.code.trim()}`
            : comboMeta?.name?.trim() || "Combo";

        return {
          label: comboLabel,
          href: "/admin/master-data/combos",
          note: formatUsageNote(
            firstWords(comboMeta?.name ?? firstRow.display_text ?? "Combo", 4),
            `${groupRows.length} món khớp`,
          ),
        };
      },
    ),
  );

  const priceBookRows = (priceBooksResponse.data ?? []) as PriceBookUsageRow[];
  references.push(
    ...groupUsageReferences(
      priceBookRows,
      (row) => row.price_book_id,
      (groupRows) => {
        const firstRow = groupRows[0];
        const priceBookMeta = firstRow.price_books?.[0] ?? null;
        const priceBookLabel =
          priceBookMeta?.code?.trim().length > 0
            ? `Bảng giá ${priceBookMeta.code.trim()}`
            : priceBookMeta?.name?.trim() || "Bảng giá";

        return {
          label: priceBookLabel,
          href: "/admin/master-data/price_book_items",
          note: formatUsageNote(
            firstWords(priceBookMeta?.name ?? "Bảng giá", 4),
            `${groupRows.length} dòng khớp`,
          ),
        };
      },
    ),
  );

  const hasUsage =
    (menuOrderUsageResponse.count ?? 0) > 0 ||
    (legacyOrderUsageResponse.count ?? 0) > 0 ||
    (combosResponse.count ?? 0) > 0 ||
    (priceBooksResponse.count ?? 0) > 0;

  if (!hasUsage) {
    return {
      productName: String((productRow as Record<string, unknown>).name ?? "Món"),
      variantCount: variantIds.length,
      references: [],
    };
  }

  return {
    productName: String((productRow as Record<string, unknown>).name ?? "Món"),
    variantCount: variantIds.length,
    references,
  };
}

export async function duplicateComboAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: DuplicateComboPayload;

  try {
    payload = parseJsonField<DuplicateComboPayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu combo.", "demo");
  }

  if (!payload.comboId) {
    return actionError("Thiếu comboId.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã sao chép combo trong chế độ demo.");
  }

  try {
    await requirePermission("master.menu.create");

    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoSuccess("Supabase chưa sẵn sàng, đang giữ ở chế độ demo.");
    }

    const { data: sourceCombo, error: sourceError } = await supabase
      .from("combos")
      .select(
        "id, shop_id, code, name, sale_price, notes, is_active, combo_items(id, menu_item_variant_id, quantity, sort_order, is_active, notes, display_text)",
      )
      .eq("id", payload.comboId)
      .maybeSingle();

    if (sourceError) {
      return actionError(sourceError.message, "live");
    }

    if (!sourceCombo) {
      return actionError("Không tìm thấy combo cần sao chép.", "live");
    }

    const sourceRow = sourceCombo as Record<string, unknown>;
    const sourceItems = Array.isArray(sourceRow.combo_items)
      ? (sourceRow.combo_items as Record<string, unknown>[])
      : [];

    const { data: codeRows, error: codeError } = await supabase
      .from("combos")
      .select("code")
      .eq("shop_id", String(sourceRow.shop_id ?? ""))
      .is("deleted_at", null);

    if (codeError) {
      return actionError(codeError.message, "live");
    }

    const existingCodes = new Set(
      (codeRows ?? [])
        .map((row) => String((row as Record<string, unknown>).code ?? "").trim())
        .filter((code) => code.length > 0),
    );

    const duplicatedComboCode = buildDuplicatedComboCode(
      String(sourceRow.code ?? "COMBO"),
      existingCodes,
    );
    const duplicatedComboName = `${String(sourceRow.name ?? "Combo")} (bản sao)`;

    const { data: createdCombo, error: createComboError } = await supabase
      .from("combos")
      .insert({
        id: createId("combo"),
        shop_id: String(sourceRow.shop_id ?? ""),
        code: duplicatedComboCode,
        name: duplicatedComboName,
        sale_price: Number(sourceRow.sale_price ?? 0),
        notes: sourceRow.notes == null ? null : String(sourceRow.notes),
        is_active: sourceRow.is_active !== false,
      })
      .select("id")
      .single();

    if (createComboError) {
      return actionError(createComboError.message, "live");
    }

    const newComboId = String(createdCombo.id);

    if (sourceItems.length > 0) {
      const { error: createItemsError } = await supabase.from("combo_items").insert(
        sourceItems.map((item, index) => ({
          id: createId("combo-item"),
          shop_id: String(sourceRow.shop_id ?? ""),
          combo_id: newComboId,
          menu_item_variant_id: String(item.menu_item_variant_id ?? ""),
          quantity: Number(item.quantity ?? 1),
          sort_order: Number(item.sort_order ?? index),
          is_active: item.is_active !== false,
          notes: item.notes == null ? null : String(item.notes),
          display_text:
            item.display_text == null ? "" : String(item.display_text),
        })),
      );

      if (createItemsError) {
        return actionError(createItemsError.message, "live");
      }
    }

    revalidatePath("/admin/menu");
    revalidatePath("/admin/orders/new");
    revalidatePath("/admin/master-data");
    revalidatePath("/admin/master-data/combos");
    revalidatePath("/admin/master-data/combo_items");

    return liveSuccess(`Đã sao chép ${duplicatedComboName}.`);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền sao chép combo.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không sao chép được combo.",
      "live",
    );
  }
}

export async function updateComboSalePriceAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: UpdateComboSalePricePayload;

  try {
    payload = parseJsonField<UpdateComboSalePricePayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu combo.", "demo");
  }

  if (!payload.comboId) {
    return actionError("Thiếu comboId.", "demo");
  }

  if (!Number.isFinite(payload.salePrice) || payload.salePrice <= 0) {
    return actionError("Giá bán phải lớn hơn 0.", isSupabaseConfigured() ? "live" : "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã cập nhật giá bán combo trong chế độ demo.");
  }

  try {
    await requirePermission("master.menu.update");

    const context = await getAdminContext();
    if (!context.shop) {
      return actionError("Thiếu shop đang hoạt động.", "live");
    }

    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoSuccess("Supabase chưa sẵn sàng, đang giữ ở chế độ demo.");
    }

    const { error } = await supabase
      .from("combos")
      .update({ sale_price: payload.salePrice })
      .eq("id", payload.comboId)
      .eq("shop_id", context.shop.id);

    if (error) {
      return actionError(error.message, "live");
    }

    revalidatePath("/admin/menu");
    revalidatePath("/admin/orders/new");
    revalidatePath("/admin/master-data");
    revalidatePath("/admin/master-data/combos");
    revalidatePath("/admin/master-data/combo_items");

    return liveSuccess("Đã cập nhật giá bán combo.");
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền cập nhật combo.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không cập nhật được combo.",
      "live",
    );
  }
}

export async function deleteMenuProductAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: DeleteMenuProductPayload;

  try {
    payload = parseJsonField<DeleteMenuProductPayload>(formData, "deletePayload");
  } catch {
    try {
      payload = parseJsonField<DeleteMenuProductPayload>(formData, "payload");
    } catch {
      return actionError("Không đọc được dữ liệu món.", "demo");
    }
  }

  if (!payload.productId) {
    return actionError("Thiếu productId.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã mô phỏng xoá món trong chế độ demo.");
  }

  try {
    await requirePermission("master.menu.delete");

    const context = await getAdminContext();
    if (!context.shop) {
      return actionError("Thiếu shop đang hoạt động.", "live");
    }

    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoSuccess("Supabase chưa sẵn sàng, đang giữ ở chế độ demo.");
    }

    const usage = await collectMenuProductDeletionReferences(
      supabase,
      context.shop.id,
      payload.productId,
    );

    if (usage.references.length > 0) {
      return {
        status: "error",
        mode: "live",
        message: `Món ${usage.productName} đã được dùng ở ${usage.references.length} nơi nên chưa thể xoá.`,
        references: usage.references.slice(0, 12),
      };
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", payload.productId)
      .eq("shop_id", context.shop.id);

    if (error) {
      return actionError(error.message, "live");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/menu");
    revalidatePath(`/admin/menu/${payload.productId}`);
    revalidatePath("/admin/orders/new");
    revalidatePath("/menu");

    return liveSuccess("Đã xoá món.");
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền xoá món.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không xoá được món.",
      "live",
    );
  }
}

export async function recordInventoryMovementAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  type Payload = {
    inventoryItemId: string;
    movementType: string;
    quantityDelta: number;
    unitCost: number | null;
    notes: string;
    serialId?: string | null;
  };

  let payload: Payload;

  try {
    payload = parseJsonField<Payload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu điều chỉnh kho.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess(
      "Đã ghi nhận điều chỉnh trong chế độ demo. Khi nối Supabase, thao tác này sẽ thêm vào inventory_movements và cập nhật tồn kho tự động.",
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoSuccess("Supabase chưa sẵn sàng, đang giữ ở chế độ demo.");
    }

    const movementRow: Record<string, unknown> = {
      inventory_item_id: payload.inventoryItemId,
      movement_type: payload.movementType,
      quantity_delta: sanitizeNumber(payload.quantityDelta),
      unit_cost:
        payload.unitCost == null ? null : sanitizeNumber(payload.unitCost),
      notes: payload.notes,
    };

    if (payload.serialId) {
      movementRow.serial_id = payload.serialId;
    }

    const { error } = await supabase.from("inventory_movements").insert(movementRow);

    if (error) {
      return actionError(error.message, "live");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/inventory");

    return liveSuccess("Đã ghi nhận biến động kho.");
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Không ghi nhận được biến động kho.",
      "live",
    );
  }
}

export async function createOrderAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return createSalesOrderAction(_previousState, formData);
}

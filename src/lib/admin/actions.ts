"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ActionState,
  MenuProductPayload,
} from "@/lib/admin/types";
import { createSalesOrderAction } from "@/lib/sales/actions";

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

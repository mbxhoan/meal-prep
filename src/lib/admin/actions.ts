"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ActionState,
  MenuProductPayload,
  OrderPayload,
} from "@/lib/admin/types";

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

function generateOrderNumber() {
  const now = new Date();
  const stamp = now
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 12);

  return `MP-${stamp}`;
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
      "Đã lưu trong demo mode. Khi nối Supabase thật, form này sẽ ghi trực tiếp vào products, product_variants và recipe_components.",
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoSuccess("Supabase chưa sẵn sàng, đang giữ ở demo mode.");
    }

    const { error: productError } = await supabase.from("products").upsert(
      {
        id: payload.id,
        category_id: payload.categoryId,
        name: payload.name,
        slug: payload.slug,
        short_description: payload.shortDescription,
        description: payload.description,
        main_image_url: payload.mainImageUrl,
        is_featured: payload.isFeatured,
        is_published: payload.isPublished,
        sort_order: sanitizeNumber(payload.sortOrder, 0),
      },
      { onConflict: "id" },
    );

    if (productError) {
      return actionError(productError.message, "live");
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
  };

  let payload: Payload;

  try {
    payload = parseJsonField<Payload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu điều chỉnh kho.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess(
      "Đã ghi nhận điều chỉnh trong demo mode. Khi nối Supabase, thao tác này sẽ insert vào inventory_movements và cập nhật tồn kho tự động.",
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoSuccess("Supabase chưa sẵn sàng, đang giữ ở demo mode.");
    }

    const { error } = await supabase.from("inventory_movements").insert({
      inventory_item_id: payload.inventoryItemId,
      movement_type: payload.movementType,
      quantity_delta: sanitizeNumber(payload.quantityDelta),
      unit_cost:
        payload.unitCost == null ? null : sanitizeNumber(payload.unitCost),
      notes: payload.notes,
    });

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
  let payload: OrderPayload;

  try {
    payload = parseJsonField<OrderPayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu đơn hàng.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess(
      "Đơn hàng đã được mô phỏng. Khi nối Supabase thật, hệ thống sẽ tự tính doanh thu, COGS, gross profit và trừ tồn kho theo công thức.",
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoSuccess("Supabase chưa sẵn sàng, đang giữ ở demo mode.");
    }

    const orderNumber = generateOrderNumber();
    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone || null,
        sales_channel: payload.salesChannel,
        status: "draft",
        note: payload.note || null,
        discount_amount: sanitizeNumber(payload.discountAmount),
        shipping_fee: sanitizeNumber(payload.shippingFee),
        other_fee: sanitizeNumber(payload.otherFee),
      })
      .select("id")
      .single();

    if (orderError || !orderRow) {
      return actionError(orderError?.message ?? "Không tạo được đơn hàng.", "live");
    }

    const itemRows = payload.items.map((item) => ({
      order_id: orderRow.id,
      variant_id: item.variantId,
      quantity: sanitizeNumber(item.quantity, 1),
      unit_price: sanitizeNumber(item.unitPrice),
    }));

    const { error: itemError } = await supabase
      .from("order_items")
      .insert(itemRows);

    if (itemError) {
      return actionError(itemError.message, "live");
    }

    if (payload.status !== "draft") {
      const { error: statusError } = await supabase
        .from("orders")
        .update({ status: payload.status })
        .eq("id", orderRow.id);

      if (statusError) {
        return actionError(statusError.message, "live");
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/inventory");

    return liveSuccess(
      `Đã tạo đơn ${orderNumber}. Hệ thống sẽ tự tính cost và doanh thu bằng trigger trong Supabase.`,
    );
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Không tạo được đơn hàng.",
      "live",
    );
  }
}

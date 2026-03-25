import { cache } from "react";
import { getMenuProducts } from "@/lib/admin/service";
import type {
  MenuProduct,
  MenuVariant,
  OrderPayload,
} from "@/lib/admin/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/service";
import type {
  SalesOrderBuilderData,
  SalesOrderDetailRecord,
  SalesOrderFulfillmentIssueSummary,
  SalesOrderItemRecord,
  SalesOrderStatusLogRecord,
  SalesOrderStatus,
  SalesPaymentRecord,
} from "@/lib/sales/types";

type CatalogResolution = SalesOrderBuilderData & {
  priceBookItemIdByVariantId: Map<string, string>;
};

function safeString(value: unknown, fallback = "") {
  return value == null ? fallback : String(value);
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildVariantIndex(products: MenuProduct[]) {
  const entries = new Map<
    string,
    { product: MenuProduct; variant: MenuVariant }
  >();

  for (const product of products) {
    for (const variant of product.variants) {
      entries.set(variant.id, { product, variant });
    }
  }

  return entries;
}

async function getCurrentPriceBookContext(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  shopId: string,
) {
  const { data: shopConfig } = await supabase
    .from("shop_configs")
    .select("default_price_book_id")
    .eq("shop_id", shopId)
    .maybeSingle();

  let priceBookId = shopConfig?.default_price_book_id
    ? String(shopConfig.default_price_book_id)
    : null;
  let priceBookName: string | null = null;

  if (priceBookId) {
    const { data: priceBook } = await supabase
      .from("price_books")
      .select("id, name")
      .eq("shop_id", shopId)
      .eq("id", priceBookId)
      .maybeSingle();

    priceBookName = priceBook?.name ?? null;
  }

  if (!priceBookId) {
    const { data: latestPriceBook } = await supabase
      .from("price_books")
      .select("id, name")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    priceBookId = latestPriceBook?.id ? String(latestPriceBook.id) : null;
    priceBookName = latestPriceBook?.name ?? null;
  }

  return {
    priceBookId,
    priceBookName,
  };
}

async function createFulfillmentIssueDraftIfConfirmed(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  orderId: string,
) {
  const { error } = await supabase.rpc(
    "create_fulfillment_issue_draft_from_sales_order",
    { p_sales_order_id: orderId },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function fetchFulfillmentIssueSummaryForOrder(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  shopId: string,
  orderId: string,
): Promise<SalesOrderFulfillmentIssueSummary | null> {
  const { data, error } = await supabase
    .from("inventory_issues")
    .select("id, issue_no, status, posted_at")
    .eq("shop_id", shopId)
    .eq("source_type", "sales_order")
    .eq("source_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as Record<string, unknown>;

  return {
    id: String(row.id ?? ""),
    issueNo: String(row.issue_no ?? ""),
    status: String(row.status ?? "draft"),
    postedAt: row.posted_at == null ? null : String(row.posted_at),
  };
}

async function buildCanonicalCatalog(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  shopId: string,
): Promise<CatalogResolution | null> {
  const { priceBookId, priceBookName } = await getCurrentPriceBookContext(
    supabase,
    shopId,
  );

  const { data: menuItems, error: menuItemsError } = await supabase
    .from("menu_items")
    .select(
      "id, shop_id, code, name, notes, sort_order, is_active, updated_at, menu_item_variants(id, menu_item_id, label, weight_grams, sort_order, is_active, notes)",
    )
    .eq("shop_id", shopId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (menuItemsError || !menuItems || menuItems.length === 0) {
    return null;
  }

  if (!priceBookId) {
    return null;
  }

  const { data: priceBookItems, error: priceBookItemsError } = await supabase
    .from("price_book_items")
    .select(
      "id, price_book_id, menu_item_variant_id, sale_price, standard_cost, target_margin_percent, is_active",
    )
    .eq("shop_id", shopId)
    .eq("price_book_id", priceBookId)
    .is("deleted_at", null)
    .eq("is_active", true);

  if (priceBookItemsError || !priceBookItems || priceBookItems.length === 0) {
    return null;
  }

  const priceBookItemIdByVariantId = new Map<string, string>();
  const priceBookItemByVariantId = new Map<string, Record<string, unknown>>();

  for (const item of priceBookItems) {
    const row = item as Record<string, unknown>;
    const variantId = row.menu_item_variant_id == null ? null : String(row.menu_item_variant_id);

    if (!variantId) {
      continue;
    }

    priceBookItemIdByVariantId.set(variantId, String(row.id));
    priceBookItemByVariantId.set(variantId, row);
  }

  const products: MenuProduct[] = menuItems.map((menuItem) => {
    const item = menuItem as Record<string, unknown>;
    const variants = Array.isArray(item.menu_item_variants)
      ? item.menu_item_variants.map((variant) => {
          const variantRow = variant as Record<string, unknown>;
          const priceBookRow = priceBookItemByVariantId.get(
            String(variantRow.id),
          );
          const salePrice = safeNumber(priceBookRow?.sale_price, 0);
          const standardCost = safeNumber(priceBookRow?.standard_cost, 0);
          const grossProfit = salePrice - standardCost;

          return {
            id: String(variantRow.id),
            productId: String(item.id),
            label: String(variantRow.label ?? "Variant"),
            weightInGrams:
              variantRow.weight_grams == null
                ? null
                : safeNumber(variantRow.weight_grams),
            price: salePrice,
            compareAtPrice: null,
            packagingCost: 0,
            laborCost: 0,
            overheadCost: 0,
            recipeCost: 0,
            totalCost: standardCost,
            grossProfit,
            grossMargin: salePrice > 0 ? grossProfit / salePrice : 0,
            isDefault: safeNumber(variantRow.sort_order, 0) === 0,
            isActive: variantRow.is_active !== false,
            sortOrder: safeNumber(variantRow.sort_order, 0),
            recipeComponents: [],
          } satisfies MenuVariant;
        })
      : [];

    return {
      id: String(item.id),
      categoryId: null,
      categoryName: "Thực đơn",
      name: String(item.name ?? "Món bán"),
      slug: slugify(String(item.code ?? item.name ?? item.id)),
      shortDescription: String(item.notes ?? ""),
      description: String(item.notes ?? ""),
      mainImageUrl: "",
      isFeatured: false,
      isPublished: item.is_active !== false,
      sortOrder: safeNumber(item.sort_order, 0),
      updatedAt: String(item.updated_at ?? new Date().toISOString()),
      variants: variants.sort((left, right) => left.sortOrder - right.sortOrder),
    } satisfies MenuProduct;
  });

  return {
    mode: "canonical",
    products,
    priceBookId,
    priceBookName,
    priceBookItemIdByVariantId,
  };
}

async function buildLegacyCatalog(): Promise<CatalogResolution> {
  const products = await getMenuProducts();

  return {
    mode: "legacy",
    products,
    priceBookId: null,
    priceBookName: null,
    priceBookItemIdByVariantId: new Map<string, string>(),
  };
}

export const getSalesOrderBuilderData = cache(async (): Promise<SalesOrderBuilderData> => {
  const context = await getAdminContext();

  if (!isSupabaseConfigured() || !context.shop) {
    const legacy = await buildLegacyCatalog();

    return {
      mode: legacy.mode,
      products: legacy.products,
      priceBookId: legacy.priceBookId,
      priceBookName: legacy.priceBookName,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const legacy = await buildLegacyCatalog();

    return {
      mode: legacy.mode,
      products: legacy.products,
      priceBookId: legacy.priceBookId,
      priceBookName: legacy.priceBookName,
    };
  }

  const canonical = await buildCanonicalCatalog(supabase, context.shop.id);

  if (!canonical) {
    const legacy = await buildLegacyCatalog();

    return {
      mode: legacy.mode,
      products: legacy.products,
      priceBookId: legacy.priceBookId,
      priceBookName: legacy.priceBookName,
    };
  }

  return {
    mode: canonical.mode,
    products: canonical.products,
    priceBookId: canonical.priceBookId,
    priceBookName: canonical.priceBookName,
  };
});

async function getSalesOrderBuilderResolution() {
  const context = await getAdminContext();

  if (!context.shop) {
    throw new Error("Missing active shop context.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const canonical = await buildCanonicalCatalog(supabase, context.shop.id);

  if (canonical) {
    return {
      context,
      supabase,
      ...canonical,
    };
  }

  const legacy = await buildLegacyCatalog();

  return {
    context,
    supabase,
    ...legacy,
  };
}

export const getSalesOrders = cache(async (): Promise<SalesOrderDetailRecord[]> => {
  const context = await getAdminContext();

  if (!context.shop) {
    return [];
  }

  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      "id, shop_id, order_no, sales_channel, ordered_at, customer_id, customer_name_snapshot, customer_phone_snapshot, customer_address_snapshot, employee_id, status, payment_status, price_book_id_snapshot, subtotal_before_discount, order_discount_type, order_discount_value, order_discount_amount, shipping_fee, other_fee, total_amount, total_revenue, total_cogs, gross_profit, gross_margin, coupon_code_snapshot, notes, sent_at, confirmed_at, created_at, updated_at, sales_order_items(id, sales_order_id, menu_item_variant_id, legacy_product_variant_id, price_book_item_id_snapshot, item_name_snapshot, variant_label_snapshot, weight_grams_snapshot, quantity, unit_price_snapshot, standard_cost_snapshot, line_discount_type, line_discount_value, line_discount_amount, line_total_before_discount, line_total_after_discount, line_cost_total, line_profit_total), sales_payments(id, sales_order_id, payment_method_id, amount, paid_at, note, created_at), sales_order_status_logs(id, sales_order_id, from_status, to_status, action, note, changed_by, created_at)",
    )
    .eq("shop_id", context.shop.id)
    .order("ordered_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => normalizeSalesOrderDetail(row as Record<string, unknown>));
});

export const getSalesOrderById = cache(async (
  orderId: string,
): Promise<SalesOrderDetailRecord | null> => {
  const context = await getAdminContext();

  if (!context.shop || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      "id, shop_id, order_no, sales_channel, ordered_at, customer_id, customer_name_snapshot, customer_phone_snapshot, customer_address_snapshot, employee_id, status, payment_status, price_book_id_snapshot, subtotal_before_discount, order_discount_type, order_discount_value, order_discount_amount, shipping_fee, other_fee, total_amount, total_revenue, total_cogs, gross_profit, gross_margin, coupon_code_snapshot, notes, sent_at, confirmed_at, created_at, updated_at, sales_order_items(id, sales_order_id, menu_item_variant_id, legacy_product_variant_id, price_book_item_id_snapshot, item_name_snapshot, variant_label_snapshot, weight_grams_snapshot, quantity, unit_price_snapshot, standard_cost_snapshot, line_discount_type, line_discount_value, line_discount_amount, line_total_before_discount, line_total_after_discount, line_cost_total, line_profit_total), sales_payments(id, sales_order_id, payment_method_id, amount, paid_at, note, created_at), sales_order_status_logs(id, sales_order_id, from_status, to_status, action, note, changed_by, created_at)",
    )
    .eq("id", orderId)
    .eq("shop_id", context.shop.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const detail = normalizeSalesOrderDetail(data as Record<string, unknown>);
  const fulfillmentIssue = await fetchFulfillmentIssueSummaryForOrder(
    supabase,
    context.shop.id,
    orderId,
  );

  return { ...detail, fulfillmentIssue };
});

export async function createSalesOrderRecord(payload: OrderPayload) {
  const resolution = await getSalesOrderBuilderResolution();
  const { context, supabase, products, mode, priceBookId, priceBookItemIdByVariantId } =
    resolution;
  const shop = context.shop;

  if (!shop) {
    throw new Error("Missing active shop context.");
  }

  const variantIndex = buildVariantIndex(products);
  const orderedAt = new Date().toISOString();
  const orderDate = new Date(orderedAt);
  const monthStart = new Date(
    Date.UTC(orderDate.getUTCFullYear(), orderDate.getUTCMonth(), 1),
  );
  const nextMonthStart = new Date(
    Date.UTC(orderDate.getUTCFullYear(), orderDate.getUTCMonth() + 1, 1),
  );

  const { count } = await supabase
    .from("sales_orders")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .gte("ordered_at", monthStart.toISOString())
    .lt("ordered_at", nextMonthStart.toISOString());

  const orderNo = `SO-${orderedAt.slice(0, 7).replace("-", "")}-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: orderRow, error: orderError } = await supabase
    .from("sales_orders")
    .insert({
      shop_id: shop.id,
      order_no: orderNo,
      sales_channel: payload.salesChannel,
      ordered_at: orderedAt,
      customer_name_snapshot: payload.customerName,
      customer_phone_snapshot: payload.customerPhone || null,
      customer_address_snapshot: payload.customerAddress || null,
      employee_id: context.employee?.id ?? null,
      status: payload.status,
      payment_status: "unpaid",
      price_book_id_snapshot: mode === "canonical" ? priceBookId : null,
      subtotal_before_discount: 0,
      order_discount_type:
        safeNumber(payload.discountAmount) > 0 ? "amount" : null,
      order_discount_value:
        safeNumber(payload.discountAmount) > 0
          ? Math.max(safeNumber(payload.discountAmount), 0)
          : null,
      order_discount_amount: Math.max(safeNumber(payload.discountAmount), 0),
      shipping_fee: Math.max(safeNumber(payload.shippingFee), 0),
      other_fee: Math.max(safeNumber(payload.otherFee), 0),
      total_amount: 0,
      total_revenue: 0,
      total_cogs: 0,
      gross_profit: 0,
      gross_margin: 0,
      notes: payload.note || null,
    })
    .select("id, order_no")
    .single();

  if (orderError || !orderRow) {
    throw new Error(orderError?.message ?? "Không tạo được đơn hàng.");
  }

  const itemRows = payload.items.map((item) => {
    const entry = variantIndex.get(item.variantId);

    if (!entry) {
      throw new Error(`Không tìm thấy biến thể ${item.variantId}.`);
    }

    const variant = entry.variant;
    const isCanonical = mode === "canonical";
    const priceBookItemId = isCanonical
      ? priceBookItemIdByVariantId.get(item.variantId) ?? null
      : null;

    return {
      shop_id: shop.id,
      sales_order_id: orderRow.id,
      menu_item_variant_id: isCanonical ? item.variantId : null,
      legacy_product_variant_id: isCanonical ? null : item.variantId,
      price_book_item_id_snapshot: priceBookItemId,
      item_name_snapshot: entry.product.name,
      variant_label_snapshot: variant.label,
      weight_grams_snapshot: variant.weightInGrams,
      quantity: Math.max(safeNumber(item.quantity, 1), 1),
      unit_price_snapshot: Math.max(safeNumber(item.unitPrice), 0),
      standard_cost_snapshot: Math.max(safeNumber(variant.totalCost), 0),
      line_discount_type: null,
      line_discount_value: null,
      line_discount_amount: 0,
      line_total_before_discount: 0,
      line_total_after_discount: 0,
      line_cost_total: 0,
      line_profit_total: 0,
    };
  });

  const { error: itemError } = await supabase
    .from("sales_order_items")
    .insert(itemRows);

  if (itemError) {
    throw new Error(itemError.message);
  }

  if (payload.status !== "draft") {
    const { error: statusError } = await supabase
      .from("sales_orders")
      .update({ status: payload.status })
      .eq("id", orderRow.id)
      .eq("shop_id", shop.id);

    if (statusError) {
      throw new Error(statusError.message);
    }
  }

  if (payload.status === "confirmed") {
    await createFulfillmentIssueDraftIfConfirmed(supabase, orderRow.id);
  }

  return {
    orderId: orderRow.id,
    orderNo,
  };
}

export async function refreshSalesOrderDraftPrices(orderId: string) {
  const detail = await getSalesOrderById(orderId);
  const context = await getAdminContext();

  if (!detail || !context.shop) {
    throw new Error("Không tìm thấy đơn hàng.");
  }

  if (detail.status !== "draft") {
    throw new Error("Chỉ có thể refresh giá cho đơn draft.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const canonicalIds = detail.items.filter((item) => item.menuItemVariantId != null);

  if (canonicalIds.length > 0) {
    const canonical = await buildCanonicalCatalog(supabase, context.shop.id);

    if (!canonical) {
      throw new Error("Chưa có price book hợp lệ để refresh giá.");
    }

    const priceBookId = canonical.priceBookId;
    const { data: priceItems } = await supabase
      .from("price_book_items")
      .select("id, menu_item_variant_id, sale_price, standard_cost")
      .eq("shop_id", context.shop.id)
      .eq("price_book_id", priceBookId ?? "")
      .is("deleted_at", null)
      .eq("is_active", true);

    const priceMap = new Map<string, Record<string, unknown>>();
    for (const row of priceItems ?? []) {
      const item = row as Record<string, unknown>;
      const variantId = item.menu_item_variant_id == null ? null : String(item.menu_item_variant_id);

      if (variantId) {
        priceMap.set(variantId, item);
      }
    }

    const canonicalIndex = buildVariantIndex(canonical.products);

    for (const line of detail.items) {
      if (!line.menuItemVariantId) {
        continue;
      }

      const entry = canonicalIndex.get(line.menuItemVariantId);
      if (!entry) {
        continue;
      }

      const priceBookRow = priceMap.get(line.menuItemVariantId);
      const salePrice = safeNumber(priceBookRow?.sale_price, entry.variant.price);
      const standardCost = safeNumber(priceBookRow?.standard_cost, entry.variant.totalCost);

      const { error } = await supabase
        .from("sales_order_items")
        .update({
          price_book_item_id_snapshot: priceBookRow?.id ? String(priceBookRow.id) : null,
          item_name_snapshot: entry.product.name,
          variant_label_snapshot: entry.variant.label,
          weight_grams_snapshot: entry.variant.weightInGrams,
          unit_price_snapshot: salePrice,
          standard_cost_snapshot: standardCost,
        })
        .eq("id", line.id)
        .eq("sales_order_id", orderId)
        .eq("shop_id", context.shop.id);

      if (error) {
        throw new Error(error.message);
      }
    }

    const { error: orderUpdateError } = await supabase
      .from("sales_orders")
      .update({ price_book_id_snapshot: priceBookId })
      .eq("id", orderId)
      .eq("shop_id", context.shop.id);

    if (orderUpdateError) {
      throw new Error(orderUpdateError.message);
    }

    return;
  }

  const legacyProducts = await getMenuProducts();
  const legacyIndex = buildVariantIndex(legacyProducts);

  for (const line of detail.items) {
    if (!line.legacyProductVariantId) {
      continue;
    }

    const entry = legacyIndex.get(line.legacyProductVariantId);
    if (!entry) {
      continue;
    }

    const { error } = await supabase
      .from("sales_order_items")
      .update({
        price_book_item_id_snapshot: null,
        item_name_snapshot: entry.product.name,
        variant_label_snapshot: entry.variant.label,
        weight_grams_snapshot: entry.variant.weightInGrams,
        unit_price_snapshot: entry.variant.price,
        standard_cost_snapshot: entry.variant.totalCost,
      })
      .eq("id", line.id)
      .eq("sales_order_id", orderId)
      .eq("shop_id", context.shop.id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function updateSalesOrderStatus(
  orderId: string,
  status: string,
) {
  const context = await getAdminContext();

  if (!context.shop) {
    throw new Error("Missing active shop context.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const { data: existing, error: readError } = await supabase
    .from("sales_orders")
    .select("status")
    .eq("id", orderId)
    .eq("shop_id", context.shop.id)
    .maybeSingle();

  if (readError || !existing) {
    throw new Error(readError?.message ?? "Không tìm thấy đơn hàng.");
  }

  const previousStatus = String(
    (existing as Record<string, unknown>).status ?? "",
  );

  const { error } = await supabase
    .from("sales_orders")
    .update({ status })
    .eq("id", orderId)
    .eq("shop_id", context.shop.id);

  if (error) {
    throw new Error(error.message);
  }

  if (status === "confirmed" && previousStatus !== "confirmed") {
    await createFulfillmentIssueDraftIfConfirmed(supabase, orderId);
  }
}

export async function recordSalesPayment(
  orderId: string,
  payload: {
    amount: number;
    paymentMethodId: string | null;
    note: string | null;
  },
) {
  const context = await getAdminContext();

  if (!context.shop) {
    throw new Error("Missing active shop context.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const { error } = await supabase.from("sales_payments").insert({
    shop_id: context.shop.id,
    sales_order_id: orderId,
    payment_method_id: payload.paymentMethodId,
    amount: Math.max(payload.amount, 0),
    note: payload.note,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function normalizeSalesOrderDetail(
  row: Record<string, unknown>,
): SalesOrderDetailRecord {
  const items = Array.isArray(row.sales_order_items)
    ? row.sales_order_items.map((entry) => {
        const item = entry as Record<string, unknown>;

        return {
          id: safeString(item.id),
          salesOrderId: safeString(item.sales_order_id),
          menuItemVariantId:
            item.menu_item_variant_id == null
              ? null
              : safeString(item.menu_item_variant_id),
          legacyProductVariantId:
            item.legacy_product_variant_id == null
              ? null
              : safeString(item.legacy_product_variant_id),
          priceBookItemIdSnapshot:
            item.price_book_item_id_snapshot == null
              ? null
              : safeString(item.price_book_item_id_snapshot),
          itemNameSnapshot: safeString(item.item_name_snapshot),
          variantLabelSnapshot:
            item.variant_label_snapshot == null
              ? null
              : safeString(item.variant_label_snapshot),
          weightGramsSnapshot:
            item.weight_grams_snapshot == null
              ? null
              : safeNumber(item.weight_grams_snapshot),
          quantity: safeNumber(item.quantity, 0),
          unitPriceSnapshot: safeNumber(item.unit_price_snapshot, 0),
          standardCostSnapshot: safeNumber(item.standard_cost_snapshot, 0),
          lineDiscountType:
            item.line_discount_type == null
              ? null
              : safeString(item.line_discount_type),
          lineDiscountValue:
            item.line_discount_value == null
              ? null
              : safeNumber(item.line_discount_value),
          lineDiscountAmount: safeNumber(item.line_discount_amount, 0),
          lineTotalBeforeDiscount: safeNumber(item.line_total_before_discount, 0),
          lineTotalAfterDiscount: safeNumber(item.line_total_after_discount, 0),
          lineCostTotal: safeNumber(item.line_cost_total, 0),
          lineProfitTotal: safeNumber(item.line_profit_total, 0),
        } satisfies SalesOrderItemRecord;
      })
    : [];

  const payments = Array.isArray(row.sales_payments)
    ? row.sales_payments.map((entry) => {
        const payment = entry as Record<string, unknown>;

        return {
          id: safeString(payment.id),
          salesOrderId: safeString(payment.sales_order_id),
          paymentMethodId:
            payment.payment_method_id == null
              ? null
              : safeString(payment.payment_method_id),
          amount: safeNumber(payment.amount, 0),
          paidAt: safeString(payment.paid_at, new Date().toISOString()),
          note: payment.note == null ? null : safeString(payment.note),
          createdAt: safeString(payment.created_at, new Date().toISOString()),
        } satisfies SalesPaymentRecord;
      })
    : [];

  const statusLogs = Array.isArray(row.sales_order_status_logs)
    ? row.sales_order_status_logs.map((entry) => {
        const log = entry as Record<string, unknown>;

        return {
          id: safeString(log.id),
          salesOrderId: safeString(log.sales_order_id),
          fromStatus:
            log.from_status == null
              ? null
              : safeString(log.from_status) as SalesOrderStatus,
          toStatus: safeString(log.to_status) as SalesOrderStatus,
          action: safeString(log.action, "status_change"),
          note: log.note == null ? null : safeString(log.note),
          changedBy:
            log.changed_by == null ? null : safeString(log.changed_by),
          createdAt: safeString(log.created_at, new Date().toISOString()),
        } satisfies SalesOrderStatusLogRecord;
      })
    : [];

  return {
    id: safeString(row.id),
    shopId: safeString(row.shop_id),
    orderNo: safeString(row.order_no),
    salesChannel: safeString(row.sales_channel, "manual"),
    orderedAt: safeString(row.ordered_at, new Date().toISOString()),
    customerId:
      row.customer_id == null ? null : safeString(row.customer_id),
    customerNameSnapshot: safeString(row.customer_name_snapshot),
    customerPhoneSnapshot:
      row.customer_phone_snapshot == null
        ? null
        : safeString(row.customer_phone_snapshot),
    customerAddressSnapshot:
      row.customer_address_snapshot == null
        ? null
        : safeString(row.customer_address_snapshot),
    employeeId:
      row.employee_id == null ? null : safeString(row.employee_id),
    status: safeString(row.status, "draft") as SalesOrderDetailRecord["status"],
    paymentStatus: safeString(row.payment_status, "unpaid") as SalesOrderDetailRecord["paymentStatus"],
    priceBookIdSnapshot:
      row.price_book_id_snapshot == null
        ? null
        : safeString(row.price_book_id_snapshot),
    subtotalBeforeDiscount: safeNumber(row.subtotal_before_discount, 0),
    orderDiscountType:
      row.order_discount_type == null
        ? null
        : safeString(row.order_discount_type),
    orderDiscountValue:
      row.order_discount_value == null
        ? null
        : safeNumber(row.order_discount_value),
    orderDiscountAmount: safeNumber(row.order_discount_amount, 0),
    shippingFee: safeNumber(row.shipping_fee, 0),
    otherFee: safeNumber(row.other_fee, 0),
    totalAmount: safeNumber(row.total_amount, 0),
    totalRevenue: safeNumber(row.total_revenue, 0),
    totalCogs: safeNumber(row.total_cogs, 0),
    grossProfit: safeNumber(row.gross_profit, 0),
    grossMargin: safeNumber(row.gross_margin, 0),
    couponCodeSnapshot:
      row.coupon_code_snapshot == null
        ? null
        : safeString(row.coupon_code_snapshot),
    notes: row.notes == null ? null : safeString(row.notes),
    sentAt: row.sent_at == null ? null : safeString(row.sent_at),
    confirmedAt: row.confirmed_at == null ? null : safeString(row.confirmed_at),
    createdAt: safeString(row.created_at, new Date().toISOString()),
    updatedAt: safeString(row.updated_at, new Date().toISOString()),
    items,
    payments,
    statusLogs: statusLogs.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    ),
  };
}

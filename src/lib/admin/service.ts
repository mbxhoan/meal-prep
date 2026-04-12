import { cache } from "react";
import {
  demoCategories,
  getDemoAnalytics,
  getDemoDashboardSnapshot,
  demoInventoryItems,
  demoMenuProducts,
  demoOrders,
} from "@/lib/admin/demo-data";
import type {
  AdminContext,
  AnalyticsPoint,
  DashboardSnapshot,
  InventoryItem,
  MenuProduct,
  MenuProductImage,
  OrderRecord,
} from "@/lib/admin/types";
import { normalizeInventoryItemTrackingFields } from "@/lib/inventory";
import { RBAC_PERMISSION_CODES } from "@/lib/rbac";
import { getRbacAccessContext } from "@/lib/rbac/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function createDemoContext(): AdminContext {
  const demoShop = {
    id: "demo-shop",
    code: "mealfit",
    slug: "mealfit",
    name: "MealFit Main Shop",
    address: "TP. Hồ Chí Minh, Việt Nam",
    phone: "+84 123 456 789",
    timezone: "Asia/Ho_Chi_Minh",
    currencyCode: "VND",
    isDefault: true,
    isActive: true,
  };

  return {
    configured: false,
    mode: "demo",
    user: {
      id: "demo-admin",
      email: "demo@mealfit.vn",
      fullName: "MealFit Demo Admin",
      role: "system_admin",
      avatarUrl: null,
      activeShopId: demoShop.id,
      activeShopName: demoShop.name,
    },
    employee: null,
    shop: demoShop,
    shops: [demoShop],
    permissions: [...RBAC_PERMISSION_CODES],
    canEdit: true,
    canAccessPanel: true,
    canManageRoles: true,
  };
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIsoDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeDashboardOrder(row: Record<string, unknown>): OrderRecord {
  const subtotalBeforeDiscount = safeNumber(
    row.subtotal_before_discount ?? row.total_revenue ?? row.total_amount,
  );
  const discountAmount = safeNumber(row.order_discount_amount ?? 0);
  const totalAmount = safeNumber(row.total_amount ?? row.total_revenue);
  const totalRevenue = safeNumber(row.total_revenue ?? row.total_amount);

  return {
    id: String(row.id ?? ""),
    orderNumber: String(row.order_no ?? row.order_number ?? ""),
    customerId: row.customer_id == null ? null : String(row.customer_id),
    customerName: String(
      row.customer_name_snapshot ?? row.customer_name ?? "Khách lẻ",
    ),
    customerPhone:
      row.customer_phone_snapshot == null
        ? null
        : String(row.customer_phone_snapshot),
    customerAddress:
      row.customer_address_snapshot == null
        ? null
        : String(row.customer_address_snapshot),
    employeeId: row.employee_id == null ? null : String(row.employee_id),
    salesChannel: String(row.sales_channel ?? "manual") as OrderRecord["salesChannel"],
    orderType:
      row.order_type == null
        ? undefined
        : (String(row.order_type) as OrderRecord["orderType"]),
    deliveryStatus:
      row.delivery_status == null
        ? undefined
        : (String(row.delivery_status) as OrderRecord["deliveryStatus"]),
    shipperName: row.shipper_name == null ? null : String(row.shipper_name),
    status: String(row.status ?? "draft") as OrderRecord["status"],
    paymentStatus: String(row.payment_status ?? "unpaid") as NonNullable<
      OrderRecord["paymentStatus"]
    >,
    note: row.notes == null ? null : String(row.notes),
    subtotal: subtotalBeforeDiscount,
    subtotalBeforeDiscount,
    discountAmount,
    orderDiscountType:
      row.order_discount_type == null ? null : String(row.order_discount_type),
    orderDiscountValue:
      row.order_discount_value == null ? null : safeNumber(row.order_discount_value),
    orderDiscountAmount: discountAmount,
    shippingFee: safeNumber(row.shipping_fee),
    otherFee: safeNumber(row.other_fee),
    totalAmount,
    totalRevenue,
    totalCogs: safeNumber(row.total_cogs),
    grossProfit: safeNumber(row.gross_profit),
    grossMargin: safeNumber(row.gross_margin),
    orderedAt: String(row.ordered_at ?? row.created_at ?? new Date().toISOString()),
    sentAt: row.sent_at == null ? null : String(row.sent_at),
    confirmedAt: row.confirmed_at == null ? null : String(row.confirmed_at),
    priceBookIdSnapshot:
      row.price_book_id_snapshot == null
        ? null
        : String(row.price_book_id_snapshot),
    priceBookCodeSnapshot:
      row.price_book_code_snapshot == null
        ? null
        : String(row.price_book_code_snapshot),
    inventoryAppliedAt:
      row.inventory_applied_at == null
        ? null
        : String(row.inventory_applied_at),
    payments: [],
    items: [],
  };
}

function buildSalesTrendPoints(
  rows: Record<string, unknown>[],
  days = 7,
): AnalyticsPoint[] {
  const buckets = new Map<string, AnalyticsPoint>();
  const now = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    const key = toIsoDateKey(day);

    buckets.set(key, {
      date: key,
      revenue: 0,
      cogs: 0,
      profit: 0,
      orders: 0,
    });
  }

  for (const row of rows) {
    const status = String(row.status ?? "draft");

    if (status === "draft" || status === "cancelled") {
      continue;
    }

    const orderedAt = String(row.ordered_at ?? "");
    const key = orderedAt.slice(0, 10);
    const bucket = buckets.get(key);

    if (!bucket) {
      continue;
    }

    bucket.revenue += safeNumber(row.total_revenue);
    bucket.cogs += safeNumber(row.total_cogs);
    bucket.profit += safeNumber(row.gross_profit);
    bucket.orders += 1;
  }

  return [...buckets.values()];
}

function normalizeVariant(variant: Record<string, unknown>) {
  const recipeComponents = Array.isArray(variant.recipe_components)
    ? variant.recipe_components.map((component) => {
        const item = component as Record<string, unknown>;
        const inventoryItem = (item.inventory_items ??
          {}) as Record<string, unknown>;
        const unitCost = safeNumber(inventoryItem.average_unit_cost);
        const quantityPerUnit = safeNumber(item.quantity_per_unit);
        const wastagePercent = safeNumber(item.wastage_pct);

        return {
          id: String(item.id),
          variantId: String(item.variant_id),
          inventoryItemId: String(item.inventory_item_id),
          ingredientName: String(inventoryItem.name ?? "Nguyên liệu"),
          unit: String(inventoryItem.unit ?? "unit"),
          quantityPerUnit,
          unitCost,
          wastagePercent,
          lineCost: Math.round(
            quantityPerUnit * unitCost * (1 + wastagePercent / 100),
          ),
        };
      })
    : [];
  const recipeCost = recipeComponents.reduce(
    (sum, component) => sum + component.lineCost,
    0,
  );
  const rawStandardCost = safeNumber(variant.standard_cost);
  const packagingCost = safeNumber(variant.packaging_cost);
  const laborCost = safeNumber(variant.labor_cost);
  const overheadCost = safeNumber(variant.overhead_cost);
  const formulaCost = recipeCost + packagingCost + laborCost + overheadCost;
  const totalCost = rawStandardCost > 0 ? rawStandardCost : formulaCost;
  const price = safeNumber(variant.price);
  const grossProfit = price - totalCost;

  return {
    id: String(variant.id),
    productId: String(variant.product_id),
    label: String(variant.label ?? "Variant"),
    weightInGrams:
      variant.weight_in_grams == null
        ? null
        : safeNumber(variant.weight_in_grams),
    price,
    compareAtPrice:
      variant.compare_at_price == null
        ? null
        : safeNumber(variant.compare_at_price),
    standardCost: totalCost,
    packagingCost,
    laborCost,
    overheadCost,
    recipeCost,
    totalCost,
    grossProfit,
    grossMargin: price > 0 ? grossProfit / price : 0,
    isDefault: Boolean(variant.is_default),
    isActive: variant.is_active !== false,
    sortOrder: safeNumber(variant.sort_order),
    recipeComponents,
  };
}

function normalizeProduct(product: Record<string, unknown>): MenuProduct {
  const variants = Array.isArray(product.product_variants)
    ? product.product_variants.map((variant) =>
        normalizeVariant(variant as Record<string, unknown>),
      )
    : [];
  const productImages = Array.isArray(product.product_images)
    ? (product.product_images as Record<string, unknown>[]).map(
        (image, index): MenuProductImage => ({
          id: String(image.id ?? ""),
          productId: String(image.product_id ?? product.id ?? ""),
          imageUrl: String(image.image_url ?? ""),
          altText: String(image.alt_text ?? product.name ?? "Ảnh món"),
          sortOrder:
            image.sort_order == null ? index : safeNumber(image.sort_order, index),
          isPrimary: Boolean(image.is_primary),
        }),
      )
    : [];
  const category =
    product.categories &&
    typeof product.categories === "object" &&
    !Array.isArray(product.categories)
      ? (product.categories as Record<string, unknown>)
      : {};
  const primaryImageUrl =
    productImages.find((image) => image.isPrimary)?.imageUrl ??
    productImages[0]?.imageUrl ??
    "";
  const mainImageUrl = String(product.main_image_url ?? "").trim();

  return {
    id: String(product.id),
    categoryId:
      product.category_id == null ? null : String(product.category_id),
    categoryName: String(category.name ?? "Chưa phân loại"),
    name: String(product.name ?? "Sản phẩm"),
    slug: String(product.slug ?? ""),
    shortDescription: String(product.short_description ?? ""),
    description: String(product.description ?? ""),
    mainImageUrl: mainImageUrl.length > 0 ? mainImageUrl : primaryImageUrl,
    isFeatured: Boolean(product.is_featured),
    isPublished: product.is_published !== false,
    sortOrder: safeNumber(product.sort_order),
    updatedAt: String(product.updated_at ?? new Date().toISOString()),
    images: productImages.sort((left, right) => left.sortOrder - right.sortOrder),
    variants: variants.sort((left, right) => left.sortOrder - right.sortOrder),
  };
}

function normalizeInventoryItem(row: Record<string, unknown>): InventoryItem {
  const onHand = safeNumber(row.current_quantity);
  const reorderPoint = safeNumber(row.reorder_point);
  const trackingFields = normalizeInventoryItemTrackingFields(row);

  return {
    id: String(row.id),
    name: String(row.name ?? "Nguyên liệu"),
    sku: String(row.sku ?? ""),
    unit: String(row.unit ?? "unit"),
    onHand,
    reorderPoint,
    averageUnitCost: safeNumber(row.average_unit_cost),
    lastPurchaseCost: safeNumber(row.last_purchase_cost),
    supplierName: String(row.supplier_name ?? "N/A"),
    notes: String(row.notes ?? ""),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    isLowStock: onHand <= reorderPoint,
    ...trackingFields,
  };
}

function normalizeOrder(row: Record<string, unknown>): OrderRecord {
  const items = Array.isArray(row.sales_order_items)
    ? row.sales_order_items.map((entry) => {
        const item = entry as Record<string, unknown>;

        return {
          id: String(item.id),
          orderId: String(item.sales_order_id ?? row.id ?? ""),
          productId: String(
            item.menu_item_variant_id ??
              item.legacy_product_variant_id ??
              item.id ??
              "",
          ),
          productName: String(item.item_name_snapshot ?? "Món"),
          variantId: String(
            item.menu_item_variant_id ??
              item.legacy_product_variant_id ??
              item.id ??
              "",
          ),
          variantLabel: String(item.variant_label_snapshot ?? ""),
          quantity: safeNumber(item.quantity, 1),
          unitPrice: safeNumber(item.unit_price_snapshot),
          unitCogs: safeNumber(item.standard_cost_snapshot),
          lineRevenue: safeNumber(item.line_total_after_discount),
          lineCogs: safeNumber(item.line_cost_total),
          lineProfit: safeNumber(item.line_profit_total),
          itemNameSnapshot: String(item.item_name_snapshot ?? "Món"),
          variantLabelSnapshot:
            item.variant_label_snapshot == null
              ? null
              : String(item.variant_label_snapshot),
          weightGramsSnapshot:
            item.weight_grams_snapshot == null
              ? null
              : safeNumber(item.weight_grams_snapshot),
          unitPriceSnapshot: safeNumber(item.unit_price_snapshot),
          standardCostSnapshot: safeNumber(item.standard_cost_snapshot),
          lineDiscountType:
            item.line_discount_type == null
              ? null
              : String(item.line_discount_type),
          lineDiscountValue:
            item.line_discount_value == null
              ? null
              : safeNumber(item.line_discount_value),
          lineDiscountAmount: safeNumber(item.line_discount_amount),
          lineTotalBeforeDiscount: safeNumber(item.line_total_before_discount),
          lineTotalAfterDiscount: safeNumber(item.line_total_after_discount),
          lineCostTotal: safeNumber(item.line_cost_total),
          lineProfitTotal: safeNumber(item.line_profit_total),
          legacyProductVariantId:
            item.legacy_product_variant_id == null
              ? null
              : String(item.legacy_product_variant_id),
          menuItemVariantId:
            item.menu_item_variant_id == null
              ? null
              : String(item.menu_item_variant_id),
          priceBookItemIdSnapshot:
            item.price_book_item_id_snapshot == null
              ? null
              : String(item.price_book_item_id_snapshot),
        };
      })
    : Array.isArray(row.order_items)
      ? row.order_items.map((entry) => {
          const item = entry as Record<string, unknown>;
          const product =
            item.products &&
            typeof item.products === "object" &&
            !Array.isArray(item.products)
              ? (item.products as Record<string, unknown>)
              : {};
          const variant =
            item.product_variants &&
            typeof item.product_variants === "object" &&
            !Array.isArray(item.product_variants)
              ? (item.product_variants as Record<string, unknown>)
              : {};

          return {
            id: String(item.id),
            orderId: String(item.order_id),
            productId: String(item.product_id ?? product.id ?? ""),
            productName: String(product.name ?? "Món"),
            variantId: String(item.variant_id ?? variant.id ?? ""),
            variantLabel: String(variant.label ?? ""),
            quantity: safeNumber(item.quantity, 1),
            unitPrice: safeNumber(item.unit_price),
            unitCogs: safeNumber(item.unit_cogs),
            lineRevenue: safeNumber(item.line_revenue),
            lineCogs: safeNumber(item.line_cogs),
            lineProfit: safeNumber(item.line_profit),
          };
      })
      : [];
  const payments = Array.isArray(row.sales_payments)
    ? row.sales_payments.map((entry) => {
        const payment = entry as Record<string, unknown>;

        return {
          amount: safeNumber(payment.amount, 0),
        };
      })
    : [];
  const customerName = row.customer_name_snapshot ?? row.customer_name;
  const customerPhone = row.customer_phone_snapshot ?? row.customer_phone;
  const customerAddress = row.customer_address_snapshot ?? row.customer_address;
  const orderNumber = row.order_no ?? row.order_number;
  const note = row.notes ?? row.note;
  const subtotalBeforeDiscount = safeNumber(
    row.subtotal_before_discount ?? row.subtotal,
  );
  const discountAmount = safeNumber(
    row.order_discount_amount ?? row.discount_amount,
  );
  const totalAmount = safeNumber(row.total_amount ?? row.total_revenue);
  const totalRevenue = safeNumber(row.total_revenue ?? row.total_amount);

  return {
    id: String(row.id),
    orderNumber: String(orderNumber ?? ""),
    customerId:
      row.customer_id == null ? null : String(row.customer_id),
    customerName: String(customerName ?? "Khách lẻ"),
    customerPhone: customerPhone == null ? null : String(customerPhone),
    customerAddress: customerAddress == null ? null : String(customerAddress),
    employeeId:
      row.employee_id == null ? null : String(row.employee_id),
    salesChannel: String(row.sales_channel ?? "manual") as OrderRecord["salesChannel"],
    orderType:
      row.order_type == null
        ? undefined
        : (String(row.order_type) as OrderRecord["orderType"]),
    deliveryStatus:
      row.delivery_status == null
        ? undefined
        : (String(row.delivery_status) as OrderRecord["deliveryStatus"]),
    shipperName:
      row.shipper_name == null ? null : String(row.shipper_name),
    status: String(row.status ?? "draft") as OrderRecord["status"],
    paymentStatus: String(row.payment_status ?? "unpaid") as NonNullable<
      OrderRecord["paymentStatus"]
    >,
    note: note == null ? null : String(note),
    subtotal: subtotalBeforeDiscount,
    subtotalBeforeDiscount,
    discountAmount,
    orderDiscountType:
      row.order_discount_type == null
        ? null
        : String(row.order_discount_type),
    orderDiscountValue:
      row.order_discount_value == null
        ? null
        : safeNumber(row.order_discount_value),
    orderDiscountAmount: discountAmount,
    shippingFee: safeNumber(row.shipping_fee),
    otherFee: safeNumber(row.other_fee),
    totalAmount,
    totalRevenue,
    totalCogs: safeNumber(row.total_cogs),
    grossProfit: safeNumber(row.gross_profit),
    grossMargin: safeNumber(row.gross_margin),
    orderedAt: String(row.ordered_at ?? row.created_at ?? new Date().toISOString()),
    sentAt:
      row.sent_at == null ? null : String(row.sent_at),
    confirmedAt:
      row.confirmed_at == null ? null : String(row.confirmed_at),
    priceBookIdSnapshot:
      row.price_book_id_snapshot == null
        ? null
        : String(row.price_book_id_snapshot),
    priceBookCodeSnapshot:
      row.price_book_code_snapshot == null
        ? null
        : String(row.price_book_code_snapshot),
    inventoryAppliedAt:
      row.inventory_applied_at == null
        ? null
        : String(row.inventory_applied_at),
    payments,
    items,
  };
}

export const getAdminContext = cache(async (): Promise<AdminContext> => {
  if (!isSupabaseConfigured()) {
    return createDemoContext();
  }

  const context = await getRbacAccessContext();

  if (!context) {
    return {
      configured: true,
      mode: "live",
      user: null,
      employee: null,
      shop: null,
      shops: [],
      permissions: [],
      canEdit: false,
      canAccessPanel: false,
      canManageRoles: false,
    };
  }

  return {
    configured: true,
    mode: "live",
    user: {
      id: context.userId,
      email: context.email,
      fullName: context.fullName,
      role: context.primaryRole,
      avatarUrl: context.avatarUrl,
      activeShopId: context.activeShop?.id ?? null,
      activeShopName: context.activeShop?.name ?? null,
    },
    employee: context.employee,
    shop: context.activeShop,
    shops: context.shops,
    permissions: context.permissions,
    canEdit: context.permissions.includes("master.menu.update"),
    canAccessPanel: context.canAccessPanel,
    canManageRoles: context.canManageRoles,
  };
});

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured()) {
    return getDemoDashboardSnapshot();
  }

  try {
    const context = await getAdminContext();

    if (!context.shop) {
      return getDemoDashboardSnapshot();
    }

    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return getDemoDashboardSnapshot();
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [ordersResponse, menuItemsResponse, openOrdersResponse] = await Promise.all([
      supabase
        .from("sales_orders")
        .select(
          "id, order_no, customer_name_snapshot, customer_phone_snapshot, customer_address_snapshot, employee_id, sales_channel, order_type, delivery_status, shipper_name, status, payment_status, subtotal_before_discount, order_discount_type, order_discount_value, order_discount_amount, shipping_fee, other_fee, total_amount, total_revenue, total_cogs, gross_profit, gross_margin, ordered_at, sent_at, confirmed_at, price_book_id_snapshot, price_book_code_snapshot, inventory_applied_at, notes",
        )
        .eq("shop_id", context.shop.id)
        .gte("ordered_at", since.toISOString())
        .order("ordered_at", { ascending: false }),
      supabase
        .from("menu_items")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", context.shop.id)
        .eq("is_active", true)
        .is("deleted_at", null),
      supabase
        .from("sales_orders")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", context.shop.id)
        .in("status", ["draft", "sent", "confirmed", "preparing", "ready"]),
    ]);

    if (ordersResponse.error || menuItemsResponse.error || openOrdersResponse.error) {
      return getDemoDashboardSnapshot();
    }

    const orders = (ordersResponse.data ?? []) as Record<string, unknown>[];
    const effectiveOrders = orders.filter((row) => {
      const status = String(row.status ?? "draft");

      return status !== "draft" && status !== "cancelled";
    });
    const revenue30d = effectiveOrders.reduce(
      (sum, row) => sum + safeNumber(row.total_revenue),
      0,
    );
    const profit30d = effectiveOrders.reduce(
      (sum, row) => sum + safeNumber(row.gross_profit),
      0,
    );
    const orderCount30d = effectiveOrders.length;
    const salesTrend = buildSalesTrendPoints(orders, 7);
    const todayKey = toIsoDateKey(new Date());
    const todayBucket = salesTrend[salesTrend.length - 1] ?? {
      date: todayKey,
      revenue: 0,
      cogs: 0,
      profit: 0,
      orders: 0,
    };

    return {
      revenue30d,
      profit30d,
      grossMargin30d: revenue30d > 0 ? profit30d / revenue30d : 0,
      avgOrderValue: orderCount30d > 0 ? revenue30d / orderCount30d : 0,
      orderCount30d,
      todayRevenue: todayBucket.revenue,
      todayOrders: todayBucket.orders,
      menuCount:
        menuItemsResponse.count != null && menuItemsResponse.count > 0
          ? menuItemsResponse.count
          : 0,
      lowStockCount: 0,
      openOrders: openOrdersResponse.count ?? 0,
      recentOrders: orders.slice(0, 5).map((row) => normalizeDashboardOrder(row)),
      salesTrend,
      lowStockItems: [],
      bestSellers: [],
    };
  } catch {
    return getDemoDashboardSnapshot();
  }
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured()) {
    return demoInventoryItems;
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoInventoryItems;
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return demoInventoryItems;
    }

    return (data ?? []).map((row) =>
      normalizeInventoryItem(row as Record<string, unknown>),
    );
  } catch {
    return demoInventoryItems;
  }
}

export async function getMenuProducts(): Promise<MenuProduct[]> {
  if (!isSupabaseConfigured()) {
    return demoMenuProducts;
  }

  try {
    const context = await getAdminContext();
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoMenuProducts;
    }

    const variantsSelect = context.canEdit
      ? "product_variants(id, product_id, label, weight_in_grams, price, compare_at_price, standard_cost, is_default, is_active, sort_order, packaging_cost, labor_cost, overhead_cost, recipe_components(id, variant_id, inventory_item_id, quantity_per_unit, wastage_pct, inventory_items(name, unit, average_unit_cost)))"
      : "product_variants(id, product_id, label, weight_in_grams, price, compare_at_price, standard_cost, is_default, is_active, sort_order, packaging_cost, labor_cost, overhead_cost)";

    const { data, error } = await supabase
      .from("products")
      .select(
        `id, category_id, name, slug, short_description, description, main_image_url, is_featured, is_published, sort_order, updated_at, categories(name), product_images(id, product_id, image_url, alt_text, sort_order, is_primary), ${variantsSelect}`,
      )
      .order("sort_order", { ascending: true });

    if (error) {
      return demoMenuProducts;
    }

    return (data ?? [])
      .map((row) => normalizeProduct(row as Record<string, unknown>))
      .sort((left, right) => left.sortOrder - right.sortOrder);
  } catch {
    return demoMenuProducts;
  }
}

export async function getMenuProductById(productId: string) {
  const products = await getMenuProducts();

  return products.find((product) => product.id === productId) ?? null;
}

export async function getMenuProductBySlug(slug: string) {
  const products = await getMenuProducts();

  return products.find((product) => product.slug === slug) ?? null;
}

export async function getOrders(): Promise<OrderRecord[]> {
  if (!isSupabaseConfigured()) {
    return demoOrders;
  }

  try {
    const context = await getAdminContext();

    if (!context.shop) {
      return [];
    }

    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoOrders;
    }

    const salesResponse = await supabase
      .from("sales_orders")
      .select(
        "id, shop_id, order_no, sales_channel, order_type, delivery_status, shipper_name, ordered_at, customer_id, customer_name_snapshot, customer_phone_snapshot, customer_address_snapshot, employee_id, status, payment_status, price_book_id_snapshot, subtotal_before_discount, order_discount_type, order_discount_value, order_discount_amount, shipping_fee, other_fee, total_amount, total_revenue, total_cogs, gross_profit, gross_margin, coupon_code_snapshot, notes, sent_at, confirmed_at, created_at, updated_at, sales_order_items(id, sales_order_id, menu_item_variant_id, legacy_product_variant_id, price_book_item_id_snapshot, item_name_snapshot, variant_label_snapshot, weight_grams_snapshot, quantity, unit_price_snapshot, standard_cost_snapshot, line_discount_type, line_discount_value, line_discount_amount, line_total_before_discount, line_total_after_discount, line_cost_total, line_profit_total), sales_payments(id, sales_order_id, payment_method_id, amount, paid_at, note, created_at)",
      )
      .eq("shop_id", context.shop.id)
      .order("ordered_at", { ascending: false });

    if (!salesResponse.error && (salesResponse.data ?? []).length > 0) {
      return (salesResponse.data ?? []).map((row) =>
        normalizeOrder(row as Record<string, unknown>),
      );
    }

    const legacyResponse = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, sales_channel, status, note, subtotal, discount_amount, shipping_fee, other_fee, total_revenue, total_cogs, gross_profit, gross_margin, ordered_at, inventory_applied_at, order_items(id, order_id, product_id, variant_id, quantity, unit_price, unit_cogs, line_revenue, line_cogs, line_profit, products(id, name), product_variants(id, label))",
      )
      .order("ordered_at", { ascending: false });

    if (legacyResponse.error) {
      return demoOrders;
    }

    return (legacyResponse.data ?? []).map((row) =>
      normalizeOrder(row as Record<string, unknown>),
    );
  } catch {
    return demoOrders;
  }
}

export async function getAnalytics(): Promise<AnalyticsPoint[]> {
  if (!isSupabaseConfigured()) {
    return getDemoAnalytics();
  }

  const orders = await getOrders();
  const buckets = new Map<string, AnalyticsPoint>();

  for (let index = 6; index >= 0; index -= 1) {
    const pointDate = new Date();
    pointDate.setDate(pointDate.getDate() - index);
    const dateKey = pointDate.toISOString().slice(0, 10);

    buckets.set(dateKey, {
      date: dateKey,
      revenue: 0,
      cogs: 0,
      profit: 0,
      orders: 0,
    });
  }

  for (const order of orders) {
    if (order.status === "draft" || order.status === "cancelled") {
      continue;
    }

    const dateKey = order.orderedAt.slice(0, 10);
    const bucket = buckets.get(dateKey);

    if (!bucket) {
      continue;
    }

    bucket.revenue += order.totalRevenue;
    bucket.cogs += order.totalCogs;
    bucket.profit += order.grossProfit;
    bucket.orders += 1;
  }

  return [...buckets.values()];
}

export async function getCategories() {
  if (!isSupabaseConfigured()) {
    return demoCategories;
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoCategories;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return demoCategories;
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      description:
        row.description == null ? null : String(row.description),
      isActive: row.is_active !== false,
    }));
  } catch {
    return demoCategories;
  }
}

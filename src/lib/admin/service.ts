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
  AdminRole,
  AnalyticsPoint,
  DashboardSnapshot,
  InventoryItem,
  MenuProduct,
  OrderRecord,
} from "@/lib/admin/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function createDemoContext(): AdminContext {
  return {
    configured: false,
    mode: "demo",
    user: {
      id: "demo-admin",
      email: "demo@mealfit.vn",
      fullName: "MealFit Demo Admin",
      role: "system_admin",
      avatarUrl: null,
    },
    canEdit: true,
  };
}

function canAccessAdmin(role: AdminRole) {
  return (
    role === "system_admin" ||
    role === "shop_owner" ||
    role === "staff" ||
    role === "admin" ||
    role === "editor"
  );
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
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
  const packagingCost = safeNumber(variant.packaging_cost);
  const laborCost = safeNumber(variant.labor_cost);
  const overheadCost = safeNumber(variant.overhead_cost);
  const totalCost = recipeCost + packagingCost + laborCost + overheadCost;
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
  const category =
    product.categories &&
    typeof product.categories === "object" &&
    !Array.isArray(product.categories)
      ? (product.categories as Record<string, unknown>)
      : {};

  return {
    id: String(product.id),
    categoryId:
      product.category_id == null ? null : String(product.category_id),
    categoryName: String(category.name ?? "Chưa phân loại"),
    name: String(product.name ?? "Sản phẩm"),
    slug: String(product.slug ?? ""),
    shortDescription: String(product.short_description ?? ""),
    description: String(product.description ?? ""),
    mainImageUrl: String(product.main_image_url ?? ""),
    isFeatured: Boolean(product.is_featured),
    isPublished: product.is_published !== false,
    sortOrder: safeNumber(product.sort_order),
    updatedAt: String(product.updated_at ?? new Date().toISOString()),
    variants: variants.sort((left, right) => left.sortOrder - right.sortOrder),
  };
}

function normalizeInventoryItem(row: Record<string, unknown>): InventoryItem {
  const onHand = safeNumber(row.current_quantity);
  const reorderPoint = safeNumber(row.reorder_point);

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
  };
}

function normalizeOrder(row: Record<string, unknown>): OrderRecord {
  const items = Array.isArray(row.order_items)
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
          productName: String(product.name ?? "Menu item"),
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

  return {
    id: String(row.id),
    orderNumber: String(row.order_number ?? ""),
    customerName: String(row.customer_name ?? "Khách lẻ"),
    customerPhone:
      row.customer_phone == null ? null : String(row.customer_phone),
    salesChannel: String(row.sales_channel ?? "manual") as OrderRecord["salesChannel"],
    status: String(row.status ?? "draft") as OrderRecord["status"],
    note: row.note == null ? null : String(row.note),
    subtotal: safeNumber(row.subtotal),
    discountAmount: safeNumber(row.discount_amount),
    shippingFee: safeNumber(row.shipping_fee),
    otherFee: safeNumber(row.other_fee),
    totalRevenue: safeNumber(row.total_revenue),
    totalCogs: safeNumber(row.total_cogs),
    grossProfit: safeNumber(row.gross_profit),
    grossMargin: safeNumber(row.gross_margin),
    orderedAt: String(row.ordered_at ?? row.created_at ?? new Date().toISOString()),
    inventoryAppliedAt:
      row.inventory_applied_at == null
        ? null
        : String(row.inventory_applied_at),
    items,
  };
}

export const getAdminContext = cache(async (): Promise<AdminContext> => {
  if (!isSupabaseConfigured()) {
    return createDemoContext();
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return createDemoContext();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true,
      mode: "live",
      user: null,
      canEdit: false,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "viewer") as AdminRole;

  return {
    configured: true,
    mode: "live",
    user: {
      id: user.id,
      email: profile?.email ?? user.email ?? null,
      fullName: profile?.full_name ?? null,
      role,
      avatarUrl: profile?.avatar_url ?? null,
    },
    canEdit: canAccessAdmin(role),
  };
});

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured()) {
    return getDemoDashboardSnapshot();
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return getDemoDashboardSnapshot();
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [ordersResponse, inventoryResponse, productsResponse] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, customer_phone, sales_channel, status, note, subtotal, discount_amount, shipping_fee, other_fee, total_revenue, total_cogs, gross_profit, gross_margin, ordered_at, inventory_applied_at, order_items(id, order_id, product_id, variant_id, quantity, unit_price, unit_cogs, line_revenue, line_cogs, line_profit, products(id, name), product_variants(id, label))",
        )
        .gte("ordered_at", since.toISOString())
        .order("ordered_at", { ascending: false })
        .limit(12),
      supabase
        .from("inventory_items")
        .select(
          "id, name, sku, unit, current_quantity, reorder_point, average_unit_cost, last_purchase_cost, supplier_name, notes, updated_at",
        )
        .order("updated_at", { ascending: false }),
      supabase.from("products").select("id", { count: "exact", head: true }),
    ]);

    if (ordersResponse.error || inventoryResponse.error || productsResponse.error) {
      return getDemoDashboardSnapshot();
    }

    const orders = (ordersResponse.data ?? []).map((row) =>
      normalizeOrder(row as Record<string, unknown>),
    );
    const inventoryItems = (inventoryResponse.data ?? []).map((row) =>
      normalizeInventoryItem(row as Record<string, unknown>),
    );
    const effectiveOrders = orders.filter(
      (order) => order.status !== "draft" && order.status !== "cancelled",
    );
    const revenue30d = effectiveOrders.reduce(
      (sum, order) => sum + order.totalRevenue,
      0,
    );
    const profit30d = effectiveOrders.reduce(
      (sum, order) => sum + order.grossProfit,
      0,
    );
    const bestSellerMap = new Map<string, DashboardSnapshot["bestSellers"][number]>();

    for (const order of effectiveOrders) {
      for (const item of order.items) {
        const current = bestSellerMap.get(item.productId);

        bestSellerMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          quantity: (current?.quantity ?? 0) + item.quantity,
          revenue: (current?.revenue ?? 0) + item.lineRevenue,
          profit: (current?.profit ?? 0) + item.lineProfit,
        });
      }
    }

    return {
      revenue30d,
      profit30d,
      grossMargin30d: revenue30d > 0 ? profit30d / revenue30d : 0,
      avgOrderValue:
        effectiveOrders.length > 0 ? revenue30d / effectiveOrders.length : 0,
      menuCount: productsResponse.count ?? 0,
      lowStockCount: inventoryItems.filter((item) => item.isLowStock).length,
      openOrders: orders.filter(
        (order) => order.status === "draft" || order.status === "confirmed",
      ).length,
      recentOrders: orders.slice(0, 5),
      lowStockItems: inventoryItems.filter((item) => item.isLowStock).slice(0, 4),
      bestSellers: [...bestSellerMap.values()]
        .sort((left, right) => right.revenue - left.revenue)
        .slice(0, 4),
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
      .select(
        "id, name, sku, unit, current_quantity, reorder_point, average_unit_cost, last_purchase_cost, supplier_name, notes, updated_at",
      )
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
      ? "product_variants(id, product_id, label, weight_in_grams, price, compare_at_price, is_default, is_active, sort_order, packaging_cost, labor_cost, overhead_cost, recipe_components(id, variant_id, inventory_item_id, quantity_per_unit, wastage_pct, inventory_items(name, unit, average_unit_cost)))"
      : "product_variants(id, product_id, label, weight_in_grams, price, compare_at_price, is_default, is_active, sort_order, packaging_cost, labor_cost, overhead_cost)";

    const { data, error } = await supabase
      .from("products")
      .select(
        `id, category_id, name, slug, short_description, description, main_image_url, is_featured, is_published, sort_order, updated_at, categories(name), ${variantsSelect}`,
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
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoOrders;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, sales_channel, status, note, subtotal, discount_amount, shipping_fee, other_fee, total_revenue, total_cogs, gross_profit, gross_margin, ordered_at, inventory_applied_at, order_items(id, order_id, product_id, variant_id, quantity, unit_price, unit_cogs, line_revenue, line_cogs, line_profit, products(id, name), product_variants(id, label))",
      )
      .order("ordered_at", { ascending: false });

    if (error) {
      return demoOrders;
    }

    return (data ?? []).map((row) =>
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

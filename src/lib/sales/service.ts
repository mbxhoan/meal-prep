import { cache } from "react";
import { demoCustomers, demoEmployees } from "@/lib/admin/demo-data";
import { getMenuProducts } from "@/lib/admin/service";
import type {
  DeliveryStatus,
  MenuProduct,
  MenuVariant,
  OrderType,
  OrderPayload,
} from "@/lib/admin/types";
import { roundCurrency } from "@/lib/admin/format";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/service";
import type {
  SalesOrderBuilderData,
  SalesComboComponentOption,
  SalesComboOption,
  SalesOrderCustomerOption,
  SalesOrderDetailRecord,
  SalesOrderFulfillmentIssueSummary,
  SalesOrderItemRecord,
  SalesOrderEmployeeOption,
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

function buildComboComponentText(
  productName: string,
  variantLabel: string | null,
  quantity: number,
  weightGrams: number | null,
) {
  const parts = [productName, variantLabel];

  if (weightGrams != null) {
    parts.push(`${weightGrams}g`);
  }

  parts.push(`x${quantity}`);

  return parts.filter((part) => part != null && String(part).trim().length > 0).join(" ");
}

function buildDemoCombos(products: MenuProduct[]): SalesComboOption[] {
  const pickVariant = (productSlug: string) => {
    const product = products.find((entry) => entry.slug === productSlug);
    return product?.variants[0] ?? null;
  };

  const chicken = pickVariant("marinated-chicken");
  const beef = pickVariant("prime-beef");
  const ribs = pickVariant("bbq-ribs");
  const salmon = pickVariant("orange-salmon");

  const combos: SalesComboOption[] = [];

  if (chicken && beef && ribs) {
    const components: SalesComboComponentOption[] = [
      chicken,
      beef,
      ribs,
    ].map((variant, index) => ({
      productVariantId: variant.id,
      productName: products.find((product) =>
        product.variants.some((entry) => entry.id === variant.id),
      )?.name ?? "Món",
      menuItemVariantId: variant.id,
      menuItemName: products.find((product) =>
        product.variants.some((entry) => entry.id === variant.id),
      )?.name ?? "Món",
      variantLabel: variant.label,
      weightGrams: variant.weightInGrams ?? null,
      quantity: 1,
      unitSalePrice: variant.price,
      unitCost: variant.totalCost,
      lineSaleTotal: variant.price,
      lineCostTotal: variant.totalCost,
      sortOrder: index,
      displayText: buildComboComponentText(
        products.find((product) =>
          product.variants.some((entry) => entry.id === variant.id),
        )?.name ?? "Món",
        variant.label,
        1,
        variant.weightInGrams ?? null,
      ),
    }));

    const defaultSalePrice = roundCurrency(
      components.reduce((sum, component) => sum + component.lineSaleTotal, 0),
    );
    const totalCost = roundCurrency(
      components.reduce((sum, component) => sum + component.lineCostTotal, 0),
    );

    combos.push({
      id: "demo-combo-lean",
      code: "CB002",
      name: "Combo giảm cân",
      salePrice: roundCurrency(defaultSalePrice - 48000),
      defaultSalePrice,
      totalCost,
      grossProfit: roundCurrency(roundCurrency(defaultSalePrice - 48000) - totalCost),
      grossMargin:
        roundCurrency(defaultSalePrice - 48000) > 0
          ? roundCurrency(roundCurrency(defaultSalePrice - 48000) - totalCost) /
            roundCurrency(defaultSalePrice - 48000)
          : 0,
      notes: "Combo mẫu cho chế độ demo.",
      isActive: true,
      updatedAt: new Date().toISOString(),
      components,
    });
  }

  if (chicken && salmon) {
    const components: SalesComboComponentOption[] = [chicken, salmon].map((variant, index) => ({
      productVariantId: variant.id,
      productName: products.find((product) =>
        product.variants.some((entry) => entry.id === variant.id),
      )?.name ?? "Món",
      menuItemVariantId: variant.id,
      menuItemName: products.find((product) =>
        product.variants.some((entry) => entry.id === variant.id),
      )?.name ?? "Món",
      variantLabel: variant.label,
      weightGrams: variant.weightInGrams ?? null,
      quantity: 1,
      unitSalePrice: variant.price,
      unitCost: variant.totalCost,
      lineSaleTotal: variant.price,
      lineCostTotal: variant.totalCost,
      sortOrder: index,
      displayText: buildComboComponentText(
        products.find((product) =>
          product.variants.some((entry) => entry.id === variant.id),
        )?.name ?? "Món",
        variant.label,
        1,
        variant.weightInGrams ?? null,
      ),
    }));

    const defaultSalePrice = roundCurrency(
      components.reduce((sum, component) => sum + component.lineSaleTotal, 0),
    );
    const totalCost = roundCurrency(
      components.reduce((sum, component) => sum + component.lineCostTotal, 0),
    );
    const salePrice = roundCurrency(defaultSalePrice - 35000);

    combos.push({
      id: "demo-combo-fit",
      code: "CB004",
      name: "Combo Power Fit",
      salePrice,
      defaultSalePrice,
      totalCost,
      grossProfit: roundCurrency(salePrice - totalCost),
      grossMargin: salePrice > 0 ? roundCurrency(salePrice - totalCost) / salePrice : 0,
      notes: "Combo mẫu cho chế độ demo.",
      isActive: true,
      updatedAt: new Date().toISOString(),
      components,
    });
  }

  return combos;
}

function normalizeComboOption(row: Record<string, unknown>): SalesComboOption {
  const components = Array.isArray(row.combo_items)
    ? row.combo_items
        .map((entry) => {
          const item = entry as Record<string, unknown>;
          const productVariant = (item.product_variants ?? {}) as Record<string, unknown>;
          const product = (productVariant.products ?? {}) as Record<string, unknown>;
          const legacyVariant = (item.menu_item_variants ?? {}) as Record<string, unknown>;
          const menuItem = (legacyVariant.menu_items ?? {}) as Record<string, unknown>;
          const resolvedVariantId = String(
            item.product_variant_id ?? item.menu_item_variant_id ?? "",
          );
          const productName = String(product.name ?? menuItem.name ?? "Món");
          const variantLabel =
            item.variant_label_snapshot == null
              ? String(productVariant.label ?? legacyVariant.label ?? "") || null
              : String(item.variant_label_snapshot);
          const weightGrams =
            item.weight_grams_snapshot == null
              ? productVariant.weight_in_grams == null
                ? legacyVariant.weight_grams == null
                  ? null
                  : safeNumber(legacyVariant.weight_grams)
                : safeNumber(productVariant.weight_in_grams)
              : safeNumber(item.weight_grams_snapshot);
          const quantity = Math.max(safeNumber(item.quantity, 1), 1);
          const unitSalePrice = safeNumber(item.unit_sale_price_snapshot, 0);
          const unitCost = safeNumber(item.unit_cost_snapshot, 0);
          const lineSaleTotal = safeNumber(item.line_sale_total, unitSalePrice * quantity);
          const lineCostTotal = safeNumber(item.line_cost_total, unitCost * quantity);
          const displayText =
            String(item.display_text ?? "").trim().length > 0
              ? String(item.display_text)
              : buildComboComponentText(productName, variantLabel, quantity, weightGrams);

          return {
            productVariantId: resolvedVariantId,
            productName,
            menuItemVariantId: String(item.menu_item_variant_id ?? item.product_variant_id ?? ""),
            menuItemName: productName,
            variantLabel,
            weightGrams,
            quantity,
            unitSalePrice,
            unitCost,
            lineSaleTotal,
            lineCostTotal,
            sortOrder: safeNumber(item.sort_order, 0),
            displayText,
          } satisfies SalesComboComponentOption;
        })
        .sort((left, right) => {
          const leftOrder = left.sortOrder ?? 0;
          const rightOrder = right.sortOrder ?? 0;

          return leftOrder - rightOrder || left.menuItemVariantId.localeCompare(right.menuItemVariantId);
        })
    : [];

  return {
    id: String(row.id ?? ""),
    code: row.code == null ? null : String(row.code),
    name: String(row.name ?? "Combo"),
    salePrice: safeNumber(row.sale_price, 0),
    defaultSalePrice: safeNumber(row.default_sale_price, 0),
    totalCost: safeNumber(row.total_cost, 0),
    grossProfit: safeNumber(row.gross_profit, 0),
    grossMargin: safeNumber(row.gross_margin, 0),
    notes: row.notes == null ? null : String(row.notes),
    isActive: row.is_active !== false,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    components: components.sort((left, right) => {
      const leftOrder = left.sortOrder ?? 0;
      const rightOrder = right.sortOrder ?? 0;

      return leftOrder - rightOrder || left.menuItemVariantId.localeCompare(right.menuItemVariantId);
    }),
  };
}

function normalizeCustomerOption(
  row: Record<string, unknown>,
): SalesOrderCustomerOption {
  return {
    id: String(row.id ?? ""),
    code: row.code == null ? null : String(row.code),
    name: String(row.name ?? "Khách hàng"),
    phone: row.phone == null ? null : String(row.phone),
    address: row.address == null ? null : String(row.address),
    note: row.note == null ? null : String(row.note),
  };
}

function normalizeEmployeeOption(
  row: Record<string, unknown>,
): SalesOrderEmployeeOption {
  return {
    id: String(row.id ?? ""),
    employeeCode:
      row.employee_code == null ? null : String(row.employee_code),
    fullName: String(row.full_name ?? "Nhân viên"),
    phone: row.phone == null ? null : String(row.phone),
    jobTitle: row.job_title == null ? null : String(row.job_title),
  };
}

function resolveOrderDiscountAmount(
  subtotalBeforeDiscount: number,
  discountPercent?: number,
  discountAmount?: number,
) {
  if (Number.isFinite(discountPercent ?? NaN) && (discountPercent ?? 0) > 0) {
    return roundCurrency(
      Math.max(subtotalBeforeDiscount, 0) * Math.max(discountPercent ?? 0, 0) / 100,
    );
  }

  return roundCurrency(Math.max(discountAmount ?? 0, 0));
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

  const { data: comboRows, error: comboRowsError } = await supabase
    .from("combos")
    .select(
      "id, shop_id, code, name, sale_price, default_sale_price, total_cost, gross_profit, gross_margin, notes, is_active, updated_at, combo_items(id, combo_id, product_variant_id, menu_item_variant_id, quantity, unit_sale_price_snapshot, unit_cost_snapshot, line_sale_total, line_cost_total, display_text, sort_order, is_active, notes, product_variants(label, weight_in_grams, products(name)), menu_item_variants(label, weight_grams, menu_items(name)))",
    )
    .eq("shop_id", shopId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (comboRowsError) {
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
            standardCost,
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

  const combos = (comboRows ?? []).map((row) =>
    normalizeComboOption(row as Record<string, unknown>),
  );

  return {
    mode: "canonical",
    products,
    combos,
    priceBookId,
    priceBookName,
    priceBookItemIdByVariantId,
    customers: [],
    employees: [],
    defaultEmployeeId: null,
  };
}

async function buildLegacyCatalog(): Promise<CatalogResolution> {
  const products = await getMenuProducts();

  return {
    mode: "legacy",
    products,
    combos: buildDemoCombos(products),
    priceBookId: null,
    priceBookName: null,
    priceBookItemIdByVariantId: new Map<string, string>(),
    customers: demoCustomers.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      phone: row.phone,
      address: row.address,
      note: row.note,
    })),
    employees: demoEmployees.map((row) => ({
      id: row.id,
      employeeCode: row.employeeCode,
      fullName: row.fullName,
      phone: row.phone,
      jobTitle: row.jobTitle,
    })),
    defaultEmployeeId: demoEmployees[0]?.id ?? null,
  };
}

async function fetchOrderLookups(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  shopId: string,
  defaultEmployeeId: string | null,
) {
  const [customersResponse, employeesResponse] = await Promise.all([
    supabase
      .from("customers")
      .select("id, shop_id, code, name, phone, address, note, is_active, deleted_at")
      .eq("shop_id", shopId)
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("employees")
      .select("id, shop_id, employee_code, full_name, phone, job_title, is_active, deleted_at")
      .eq("shop_id", shopId)
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  const customers = (customersResponse.data ?? [])
    .map((row) => normalizeCustomerOption(row as Record<string, unknown>))
    .sort((left, right) => left.name.localeCompare(right.name, "vi"));
  const employees = (employeesResponse.data ?? [])
    .map((row) => normalizeEmployeeOption(row as Record<string, unknown>))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "vi"));
  const resolvedDefaultEmployeeId =
    defaultEmployeeId && employees.some((employee) => employee.id === defaultEmployeeId)
      ? defaultEmployeeId
      : employees[0]?.id ?? null;

  return {
    customers,
    employees,
    defaultEmployeeId: resolvedDefaultEmployeeId,
  };
}

export const getSalesOrderBuilderData = cache(async (): Promise<SalesOrderBuilderData> => {
  const context = await getAdminContext();

  if (!isSupabaseConfigured() || !context.shop) {
    const legacy = await buildLegacyCatalog();

    return {
      mode: legacy.mode,
      products: legacy.products,
      combos: legacy.combos,
      priceBookId: legacy.priceBookId,
      priceBookName: legacy.priceBookName,
      customers: legacy.customers,
      employees: legacy.employees,
      defaultEmployeeId: legacy.defaultEmployeeId,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const legacy = await buildLegacyCatalog();

    return {
      mode: legacy.mode,
      products: legacy.products,
      combos: legacy.combos,
      priceBookId: legacy.priceBookId,
      priceBookName: legacy.priceBookName,
      customers: legacy.customers,
      employees: legacy.employees,
      defaultEmployeeId: legacy.defaultEmployeeId,
    };
  }

  const canonical = await buildCanonicalCatalog(supabase, context.shop.id);

  if (!canonical) {
    const legacy = await buildLegacyCatalog();
    const lookups = await fetchOrderLookups(
      supabase,
      context.shop.id,
      context.employee?.id ?? null,
    );

    return {
      mode: legacy.mode,
      products: legacy.products,
      combos: legacy.combos,
      priceBookId: legacy.priceBookId,
      priceBookName: legacy.priceBookName,
      customers: lookups.customers,
      employees: lookups.employees,
      defaultEmployeeId: lookups.defaultEmployeeId,
    };
  }

  const lookups = await fetchOrderLookups(
    supabase,
    context.shop.id,
    context.employee?.id ?? null,
  );

  return {
    mode: canonical.mode,
    products: canonical.products,
    combos: canonical.combos,
    priceBookId: canonical.priceBookId,
    priceBookName: canonical.priceBookName,
    customers: lookups.customers,
    employees: lookups.employees,
    defaultEmployeeId: lookups.defaultEmployeeId,
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
    const lookups = await fetchOrderLookups(
      supabase,
      context.shop.id,
      context.employee?.id ?? null,
    );

    return {
      context,
      supabase,
      ...canonical,
      customers: lookups.customers,
      employees: lookups.employees,
      defaultEmployeeId: lookups.defaultEmployeeId,
    };
  }

  const legacy = await buildLegacyCatalog();
  const lookups = await fetchOrderLookups(
    supabase,
    context.shop.id,
    context.employee?.id ?? null,
  );

  return {
    context,
    supabase,
    ...legacy,
    customers: lookups.customers,
    employees: lookups.employees,
    defaultEmployeeId: lookups.defaultEmployeeId,
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
      "id, shop_id, order_no, sales_channel, order_type, delivery_status, shipper_name, ordered_at, customer_id, customer_name_snapshot, customer_phone_snapshot, customer_address_snapshot, employee_id, status, payment_status, price_book_id_snapshot, subtotal_before_discount, order_discount_type, order_discount_value, order_discount_amount, shipping_fee, other_fee, total_amount, total_revenue, total_cogs, gross_profit, gross_margin, coupon_code_snapshot, notes, sent_at, confirmed_at, created_at, updated_at, sales_order_items(id, sales_order_id, item_type, menu_item_variant_id, legacy_product_variant_id, price_book_item_id_snapshot, item_name_snapshot, variant_label_snapshot, weight_grams_snapshot, quantity, unit_price_snapshot, standard_cost_snapshot, combo_id_snapshot, combo_code_snapshot, combo_name_snapshot, combo_default_sale_price_snapshot, combo_components_snapshot, line_discount_type, line_discount_value, line_discount_amount, line_total_before_discount, line_total_after_discount, line_cost_total, line_profit_total), sales_payments(id, sales_order_id, payment_method_id, amount, paid_at, note, created_at), sales_order_status_logs(id, sales_order_id, from_status, to_status, action, note, changed_by, created_at)",
    )
    .eq("shop_id", context.shop.id)
    .order("ordered_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => normalizeSalesOrderDetail(row as Record<string, unknown>));
});

function normalizeLegacySalesOrderDetail(
  row: Record<string, unknown>,
  shopId: string,
): SalesOrderDetailRecord {
  const salesOrderItems = Array.isArray(row.order_items)
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
        const isCombo = item.item_type === "combo" || item.combo_id_snapshot != null;
        const comboComponents = Array.isArray(item.combo_components_snapshot)
          ? item.combo_components_snapshot.map((component) => {
              const rowComponent = component as Record<string, unknown>;

              return {
                productVariantId: safeString(
                  rowComponent.productVariantId ?? rowComponent.product_variant_id,
                ),
                productName: safeString(
                  rowComponent.productName ?? rowComponent.product_name,
                ),
                menuItemVariantId: safeString(
                  rowComponent.menuItemVariantId ?? rowComponent.menu_item_variant_id,
                ),
                menuItemName: safeString(
                  rowComponent.menuItemName ?? rowComponent.menu_item_name,
                ),
                variantLabel:
                  rowComponent.variantLabel == null && rowComponent.variant_label == null
                    ? null
                    : safeString(rowComponent.variantLabel ?? rowComponent.variant_label),
                weightGrams:
                  rowComponent.weightGrams == null && rowComponent.weight_grams == null
                    ? null
                    : safeNumber(rowComponent.weightGrams ?? rowComponent.weight_grams),
                quantity: safeNumber(rowComponent.quantity, 1),
                unitSalePrice: safeNumber(
                  rowComponent.unitSalePrice ?? rowComponent.unit_sale_price ?? 0,
                ),
                unitCost: safeNumber(rowComponent.unitCost ?? rowComponent.unit_cost ?? 0),
                lineSaleTotal: safeNumber(
                  rowComponent.lineSaleTotal ?? rowComponent.line_sale_total ?? 0,
                ),
                lineCostTotal: safeNumber(
                  rowComponent.lineCostTotal ?? rowComponent.line_cost_total ?? 0,
                ),
                sortOrder:
                  rowComponent.sortOrder == null && rowComponent.sort_order == null
                    ? undefined
                    : safeNumber(rowComponent.sortOrder ?? rowComponent.sort_order, 0),
                displayText: safeString(
                  rowComponent.displayText ?? rowComponent.display_text,
                ),
              };
            })
          : null;

        return {
          id: safeString(item.id),
          salesOrderId: safeString(item.order_id ?? row.id),
          itemType: isCombo ? "combo" : "menu_item",
          menuItemVariantId:
            item.variant_id == null ? null : safeString(item.variant_id),
          legacyProductVariantId:
            item.variant_id == null ? null : safeString(item.variant_id),
          priceBookItemIdSnapshot: null,
          itemNameSnapshot: safeString(
            isCombo
              ? item.combo_name_snapshot ?? item.item_name_snapshot ?? "Combo"
              : product.name ?? item.item_name_snapshot ?? "Món",
          ),
          variantLabelSnapshot:
            isCombo
              ? item.combo_code_snapshot == null
                ? item.variant_label_snapshot == null
                  ? "Combo"
                  : safeString(item.variant_label_snapshot)
                : safeString(item.combo_code_snapshot)
              : variant.label == null
                ? null
                : safeString(item.variant_label_snapshot ?? variant.label),
          weightGramsSnapshot: null,
          quantity: safeNumber(item.quantity, 1),
          unitPriceSnapshot: safeNumber(item.unit_price ?? item.line_revenue ?? 0),
          standardCostSnapshot: safeNumber(item.unit_cogs ?? item.line_cogs ?? 0),
          comboIdSnapshot:
            item.combo_id_snapshot == null ? null : safeString(item.combo_id_snapshot),
          comboCodeSnapshot:
            item.combo_code_snapshot == null ? null : safeString(item.combo_code_snapshot),
          comboNameSnapshot:
            item.combo_name_snapshot == null ? null : safeString(item.combo_name_snapshot),
          comboDefaultSalePriceSnapshot:
            item.combo_default_sale_price_snapshot == null
              ? null
              : safeNumber(item.combo_default_sale_price_snapshot),
          comboComponentsSnapshot: comboComponents,
          lineDiscountType: null,
          lineDiscountValue: null,
          lineDiscountAmount: 0,
          lineTotalBeforeDiscount: safeNumber(item.line_revenue ?? 0),
          lineTotalAfterDiscount: safeNumber(item.line_revenue ?? 0),
          lineCostTotal: safeNumber(item.line_cogs ?? 0),
          lineProfitTotal: safeNumber(item.line_profit ?? 0),
        } satisfies SalesOrderItemRecord;
      })
    : [];

  const transformedRow: Record<string, unknown> = {
    id: safeString(row.id),
    shop_id: shopId,
    order_no: safeString(row.order_number ?? row.order_no ?? row.id),
    sales_channel: safeString(row.sales_channel, "manual"),
    order_type: row.order_type == null ? "order" : safeString(row.order_type),
    delivery_status:
      row.delivery_status == null ? "pending" : safeString(row.delivery_status),
    shipper_name: row.shipper_name == null ? null : safeString(row.shipper_name),
    ordered_at: safeString(row.ordered_at, new Date().toISOString()),
    customer_id: row.customer_id == null ? null : safeString(row.customer_id),
    customer_name_snapshot: safeString(
      row.customer_name_snapshot ?? row.customer_name ?? "Khách lẻ",
    ),
    customer_phone_snapshot:
      row.customer_phone_snapshot == null && row.customer_phone == null
        ? null
        : safeString(row.customer_phone_snapshot ?? row.customer_phone),
    customer_address_snapshot:
      row.customer_address_snapshot == null && row.customer_address == null
        ? null
        : safeString(row.customer_address_snapshot ?? row.customer_address),
    employee_id: row.employee_id == null ? null : safeString(row.employee_id),
    status: safeString(row.status, "draft"),
    payment_status: safeString(row.payment_status, "unpaid"),
    price_book_id_snapshot:
      row.price_book_id_snapshot == null ? null : safeString(row.price_book_id_snapshot),
    subtotal_before_discount: safeNumber(
      row.subtotal_before_discount ?? row.subtotal,
      0,
    ),
    order_discount_type:
      row.order_discount_type == null ? null : safeString(row.order_discount_type),
    order_discount_value:
      row.order_discount_value == null ? null : safeNumber(row.order_discount_value),
    order_discount_amount: safeNumber(
      row.order_discount_amount ?? row.discount_amount,
      0,
    ),
    shipping_fee: safeNumber(row.shipping_fee, 0),
    other_fee: safeNumber(row.other_fee, 0),
    total_amount: safeNumber(row.total_amount ?? row.total_revenue, 0),
    total_revenue: safeNumber(row.total_revenue ?? row.total_amount, 0),
    total_cogs: safeNumber(row.total_cogs, 0),
    gross_profit: safeNumber(row.gross_profit, 0),
    gross_margin: safeNumber(row.gross_margin, 0),
    coupon_code_snapshot:
      row.coupon_code_snapshot == null ? null : safeString(row.coupon_code_snapshot),
    notes:
      row.notes == null
        ? row.note == null
          ? null
          : safeString(row.note)
        : safeString(row.notes),
    sent_at: row.sent_at == null ? null : safeString(row.sent_at),
    confirmed_at: row.confirmed_at == null ? null : safeString(row.confirmed_at),
    created_at: safeString(row.created_at, new Date().toISOString()),
    updated_at: safeString(row.updated_at, new Date().toISOString()),
    sales_order_items: salesOrderItems,
    sales_payments: [],
    sales_order_status_logs: [],
  };

  return normalizeSalesOrderDetail(transformedRow);
}

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

  const orderSelect =
    "id, shop_id, order_no, sales_channel, order_type, delivery_status, shipper_name, ordered_at, customer_id, customer_name_snapshot, customer_phone_snapshot, customer_address_snapshot, employee_id, status, payment_status, price_book_id_snapshot, subtotal_before_discount, order_discount_type, order_discount_value, order_discount_amount, shipping_fee, other_fee, total_amount, total_revenue, total_cogs, gross_profit, gross_margin, coupon_code_snapshot, notes, sent_at, confirmed_at, created_at, updated_at, sales_order_items(id, sales_order_id, item_type, menu_item_variant_id, legacy_product_variant_id, price_book_item_id_snapshot, item_name_snapshot, variant_label_snapshot, weight_grams_snapshot, quantity, unit_price_snapshot, standard_cost_snapshot, combo_id_snapshot, combo_code_snapshot, combo_name_snapshot, combo_default_sale_price_snapshot, combo_components_snapshot, line_discount_type, line_discount_value, line_discount_amount, line_total_before_discount, line_total_after_discount, line_cost_total, line_profit_total), sales_payments(id, sales_order_id, payment_method_id, amount, paid_at, note, created_at), sales_order_status_logs(id, sales_order_id, from_status, to_status, action, note, changed_by, created_at)";

  const { data: dataById, error: errorById } = await supabase
    .from("sales_orders")
    .select(orderSelect)
    .eq("id", orderId)
    .eq("shop_id", context.shop.id)
    .maybeSingle();

  if (errorById) {
    return null;
  }

  let data = dataById;

  if (!data) {
    const legacySelect =
      "id, shop_id, order_number, customer_id, customer_name, customer_phone, customer_address, employee_id, sales_channel, order_type, delivery_status, shipper_name, status, note, subtotal, discount_amount, shipping_fee, other_fee, total_revenue, total_cogs, gross_profit, gross_margin, ordered_at, created_at, updated_at, order_items(id, order_id, product_id, variant_id, item_type, combo_id_snapshot, combo_code_snapshot, combo_name_snapshot, combo_components_snapshot, combo_default_sale_price_snapshot, quantity, unit_price, unit_cogs, line_revenue, line_cogs, line_profit, products(id, name), product_variants(id, label))";

    const { data: legacyById, error: legacyByIdError } = await supabase
      .from("orders")
      .select(legacySelect)
      .eq("id", orderId)
      .eq("shop_id", context.shop.id)
      .maybeSingle();

    if (!legacyByIdError && legacyById) {
      return normalizeLegacySalesOrderDetail(
        legacyById as Record<string, unknown>,
        context.shop.id,
      );
    }

    const { data: legacyByOrderNo, error: legacyByOrderNoError } = await supabase
      .from("orders")
      .select(legacySelect)
      .eq("order_number", orderId)
      .eq("shop_id", context.shop.id)
      .maybeSingle();

    if (!legacyByOrderNoError && legacyByOrderNo) {
      return normalizeLegacySalesOrderDetail(
        legacyByOrderNo as Record<string, unknown>,
        context.shop.id,
      );
    }

    const { data: dataByOrderNo, error: errorByOrderNo } = await supabase
      .from("sales_orders")
      .select(orderSelect)
      .eq("order_no", orderId)
      .eq("shop_id", context.shop.id)
      .maybeSingle();

    if (errorByOrderNo || !dataByOrderNo) {
      return null;
    }

    data = dataByOrderNo;
  }

  const detail = normalizeSalesOrderDetail(data as Record<string, unknown>);
  let employeeNameSnapshot: string | null = null;

  if (detail.employeeId) {
    const { data: employeeRow } = await supabase
      .from("employees")
      .select("full_name, employee_code")
      .eq("id", detail.employeeId)
      .eq("shop_id", context.shop.id)
      .maybeSingle();

    if (employeeRow) {
      const employee = employeeRow as Record<string, unknown>;
      employeeNameSnapshot =
        employee.full_name == null ? null : String(employee.full_name);
    }
  }

  const fulfillmentIssue = await fetchFulfillmentIssueSummaryForOrder(
    supabase,
    context.shop.id,
    orderId,
  );

  return { ...detail, employeeNameSnapshot, fulfillmentIssue };
});

export async function createSalesOrderRecord(payload: OrderPayload) {
  const resolution = await getSalesOrderBuilderResolution();
  const {
    context,
    supabase,
    products,
    combos,
    mode,
    priceBookId,
    priceBookItemIdByVariantId,
  } = resolution;
  const shop = context.shop;

  if (!shop) {
    throw new Error("Missing active shop context.");
  }

  const variantIndex = buildVariantIndex(products);
  const comboIndex = new Map(combos.map((combo) => [combo.id, combo]));
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

  const resolvedItems = payload.items.map((item) => {
    const quantity = Math.max(safeNumber(item.quantity, 1), 1);
    const unitPrice = Math.max(safeNumber(item.unitPrice), 0);

    if (item.itemType === "combo" || item.comboId) {
      const combo = comboIndex.get(String(item.comboId ?? ""));

      if (!combo) {
        throw new Error(`Không tìm thấy combo ${item.comboId}.`);
      }

      return {
        shop_id: shop.id,
        sales_order_id: "",
        item_type: "combo",
        menu_item_variant_id: null,
        legacy_product_variant_id: null,
        price_book_item_id_snapshot: null,
        combo_id_snapshot: combo.id,
        combo_code_snapshot: combo.code,
        combo_name_snapshot: combo.name,
        combo_default_sale_price_snapshot: combo.defaultSalePrice,
        combo_components_snapshot: combo.components,
        item_name_snapshot: combo.name,
        variant_label_snapshot: "Combo",
        weight_grams_snapshot: null,
        quantity,
        unit_price_snapshot: unitPrice,
        standard_cost_snapshot: Math.max(safeNumber(combo.totalCost), 0),
      };
    }

    if (!item.variantId) {
      throw new Error("Thiếu biến thể cho món lẻ.");
    }

    const entry = variantIndex.get(item.variantId);

    if (!entry) {
      throw new Error(`Không tìm thấy biến thể ${item.variantId}.`);
    }

    const standardCost = Math.max(safeNumber(entry.variant.totalCost), 0);
    const isCanonical = mode === "canonical";
    const priceBookItemId = isCanonical
      ? priceBookItemIdByVariantId.get(item.variantId) ?? null
      : null;

    return {
      shop_id: shop.id,
      sales_order_id: "",
      item_type: "menu_item",
      menu_item_variant_id: isCanonical ? item.variantId : null,
      legacy_product_variant_id: isCanonical ? null : item.variantId,
      price_book_item_id_snapshot: priceBookItemId,
      combo_id_snapshot: null,
      combo_code_snapshot: null,
      combo_name_snapshot: null,
      combo_default_sale_price_snapshot: null,
      combo_components_snapshot: null,
      item_name_snapshot: entry.product.name,
      variant_label_snapshot: entry.variant.label,
      weight_grams_snapshot: entry.variant.weightInGrams,
      quantity,
      unit_price_snapshot: unitPrice,
      standard_cost_snapshot: standardCost,
    };
  });

  const subtotalBeforeDiscount = roundCurrency(
    resolvedItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price_snapshot,
      0,
    ),
  );
  const totalCogs = roundCurrency(
    resolvedItems.reduce(
      (sum, item) => sum + item.quantity * item.standard_cost_snapshot,
      0,
    ),
  );
  const discountAmount = resolveOrderDiscountAmount(
    subtotalBeforeDiscount,
    payload.discountPercent,
    payload.discountAmount,
  );
  const discountPercent =
    Number.isFinite(payload.discountPercent ?? NaN) &&
    (payload.discountPercent ?? 0) > 0
      ? Math.max(safeNumber(payload.discountPercent), 0)
      : 0;
  const orderDiscountType: string | null =
    discountAmount > 0
      ? discountPercent > 0
        ? "percent"
        : "amount"
      : null;
  const orderDiscountValue: number | null =
    discountAmount > 0
      ? discountPercent > 0
        ? discountPercent
        : Math.max(safeNumber(payload.discountAmount), 0)
      : null;
  const shippingFee = Math.max(safeNumber(payload.shippingFee), 0);
  const otherFee = Math.max(safeNumber(payload.otherFee), 0);
  const totalAmount = roundCurrency(
    Math.max(subtotalBeforeDiscount - discountAmount + shippingFee + otherFee, 0),
  );
  const grossProfit = roundCurrency(totalAmount - totalCogs);
  const grossMargin = totalAmount > 0 ? grossProfit / totalAmount : 0;

  const { data: orderRow, error: orderError } = await supabase
    .from("sales_orders")
    .insert({
      shop_id: shop.id,
      order_no: orderNo,
      sales_channel: payload.salesChannel ?? "manual",
      order_type: payload.orderType ?? "order",
      delivery_status: payload.deliveryStatus ?? "pending",
      shipper_name: payload.shipperName?.trim() || null,
      ordered_at: orderedAt,
      customer_id: payload.customerId ?? null,
      customer_name_snapshot: payload.customerName,
      customer_phone_snapshot: payload.customerPhone || null,
      customer_address_snapshot: payload.customerAddress || null,
      employee_id: payload.employeeId ?? context.employee?.id ?? null,
      status: "draft",
      payment_status: "unpaid",
      price_book_id_snapshot: mode === "canonical" ? priceBookId : null,
      subtotal_before_discount: subtotalBeforeDiscount,
      order_discount_type: orderDiscountType,
      order_discount_value: orderDiscountValue,
      order_discount_amount: discountAmount,
      shipping_fee: shippingFee,
      other_fee: otherFee,
      total_amount: totalAmount,
      total_revenue: totalAmount,
      total_cogs: totalCogs,
      gross_profit: grossProfit,
      gross_margin: grossMargin,
      notes: payload.note || null,
    })
    .select("id, order_no")
    .single();

  if (orderError || !orderRow) {
    throw new Error(orderError?.message ?? "Không tạo được đơn hàng.");
  }

  const itemRows = resolvedItems.map((item) => ({
    ...item,
    sales_order_id: orderRow.id,
    line_discount_type: null,
    line_discount_value: null,
    line_discount_amount: 0,
    line_total_before_discount: 0,
    line_total_after_discount: 0,
    line_cost_total: 0,
    line_profit_total: 0,
  }));

  const { error: itemError } = await supabase
    .from("sales_order_items")
    .insert(itemRows);

  if (itemError) {
    throw new Error(itemError.message);
  }

  const paidAmount = Math.max(safeNumber(payload.paidAmount), 0);

  if (paidAmount > 0) {
    const { error: paymentError } = await supabase.from("sales_payments").insert({
      shop_id: shop.id,
      sales_order_id: orderRow.id,
      payment_method_id: null,
      amount: paidAmount,
      note: null,
    });

    if (paymentError) {
      throw new Error(paymentError.message);
    }
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

  const shopId = context.shop.id;
  if (detail.status !== "draft") {
    throw new Error("Chỉ có thể refresh giá cho đơn draft.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const supabaseClient = supabase;
  const orderDiscountType = detail.orderDiscountType;
  const orderDiscountValue = detail.orderDiscountValue;

  async function finalizeRefresh(subtotalBeforeDiscount: number) {
    if (
      orderDiscountType === "percent" &&
      orderDiscountValue != null
    ) {
      const updatedDiscountAmount = resolveOrderDiscountAmount(
        subtotalBeforeDiscount,
        orderDiscountValue,
      );
      const { error: discountError } = await supabaseClient
        .from("sales_orders")
        .update({ order_discount_amount: updatedDiscountAmount })
        .eq("id", orderId)
        .eq("shop_id", shopId);

      if (discountError) {
        throw new Error(discountError.message);
      }
    }

    const { error: refreshError } = await supabaseClient.rpc(
      "refresh_sales_order_totals",
      { p_sales_order_id: orderId },
    );

    if (refreshError) {
      throw new Error(refreshError.message);
    }
  }

  const canonicalMenuLines = detail.items.filter((item) => item.menuItemVariantId != null);
  const canonicalComboLines = detail.items.filter((item) => item.comboIdSnapshot != null);

  if (canonicalMenuLines.length > 0 || canonicalComboLines.length > 0) {
    const canonical = await buildCanonicalCatalog(supabaseClient, shopId);

    if (!canonical) {
      throw new Error("Chưa có price book hợp lệ để refresh giá.");
    }

    const priceBookId = canonical.priceBookId;
    const { data: priceItems } = await supabaseClient
      .from("price_book_items")
      .select("id, menu_item_variant_id, sale_price, standard_cost")
      .eq("shop_id", shopId)
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
    const comboIndex = new Map(canonical.combos.map((combo) => [combo.id, combo]));
    let subtotalBeforeDiscount = 0;

    for (const line of detail.items) {
      if (line.menuItemVariantId) {
        const entry = canonicalIndex.get(line.menuItemVariantId);

        if (!entry) {
          continue;
        }

        const priceBookRow = priceMap.get(line.menuItemVariantId);
        const salePrice = safeNumber(priceBookRow?.sale_price, entry.variant.price);
        const standardCost = safeNumber(priceBookRow?.standard_cost, entry.variant.totalCost);
        subtotalBeforeDiscount += salePrice * line.quantity;

        const { error } = await supabaseClient
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
          .eq("shop_id", shopId);

        if (error) {
          throw new Error(error.message);
        }

        continue;
      }

      if (!line.comboIdSnapshot) {
        continue;
      }

      const combo = comboIndex.get(line.comboIdSnapshot);

      if (!combo) {
        continue;
      }

      subtotalBeforeDiscount += combo.salePrice * line.quantity;

      const { error } = await supabaseClient
        .from("sales_order_items")
        .update({
          price_book_item_id_snapshot: null,
          item_name_snapshot: combo.name,
          variant_label_snapshot: "Combo",
          weight_grams_snapshot: null,
          unit_price_snapshot: combo.salePrice,
          standard_cost_snapshot: combo.totalCost,
          combo_id_snapshot: combo.id,
          combo_code_snapshot: combo.code,
          combo_name_snapshot: combo.name,
          combo_default_sale_price_snapshot: combo.defaultSalePrice,
          combo_components_snapshot: combo.components,
        })
        .eq("id", line.id)
        .eq("sales_order_id", orderId)
        .eq("shop_id", shopId);

      if (error) {
        throw new Error(error.message);
      }
    }

    const { error: orderUpdateError } = await supabaseClient
      .from("sales_orders")
      .update({ price_book_id_snapshot: priceBookId })
      .eq("id", orderId)
      .eq("shop_id", shopId);

    if (orderUpdateError) {
      throw new Error(orderUpdateError.message);
    }

    await finalizeRefresh(subtotalBeforeDiscount);

    return;
  }

  const legacyProducts = await getMenuProducts();
  const legacyIndex = buildVariantIndex(legacyProducts);
  let subtotalBeforeDiscount = 0;

  for (const line of detail.items) {
    if (!line.legacyProductVariantId) {
      continue;
    }

    const entry = legacyIndex.get(line.legacyProductVariantId);
    if (!entry) {
      continue;
    }

    subtotalBeforeDiscount += entry.variant.price * line.quantity;

    const { error } = await supabaseClient
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
        .eq("shop_id", shopId);

    if (error) {
      throw new Error(error.message);
    }
  }

  await finalizeRefresh(subtotalBeforeDiscount);
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

export async function updateSalesOrderDeliveryStatus(
  orderId: string,
  deliveryStatus: DeliveryStatus,
) {
  const context = await getAdminContext();

  if (!context.shop) {
    throw new Error("Missing active shop context.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const { error } = await supabase
    .from("sales_orders")
    .update({ delivery_status: deliveryStatus })
    .eq("id", orderId)
    .eq("shop_id", context.shop.id);

  if (error) {
    throw new Error(error.message);
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
    ? row.sales_order_items
        .map((entry) => {
        const item = entry as Record<string, unknown>;
        const comboComponents = Array.isArray(item.combo_components_snapshot)
          ? item.combo_components_snapshot.map((component) => {
              const rowComponent = component as Record<string, unknown>;

              return {
                productVariantId: safeString(
                  rowComponent.productVariantId ?? rowComponent.product_variant_id,
                ),
                productName: safeString(
                  rowComponent.productName ?? rowComponent.product_name,
                ),
                menuItemVariantId: safeString(rowComponent.menuItemVariantId ?? rowComponent.menu_item_variant_id),
                menuItemName: safeString(rowComponent.menuItemName ?? rowComponent.menu_item_name),
                variantLabel:
                  rowComponent.variantLabel == null && rowComponent.variant_label == null
                    ? null
                    : safeString(rowComponent.variantLabel ?? rowComponent.variant_label),
                weightGrams:
                  rowComponent.weightGrams == null && rowComponent.weight_grams == null
                    ? null
                    : safeNumber(rowComponent.weightGrams ?? rowComponent.weight_grams),
                quantity: safeNumber(rowComponent.quantity, 1),
                unitSalePrice: safeNumber(
                  rowComponent.unitSalePrice ?? rowComponent.unit_sale_price ?? 0,
                ),
                unitCost: safeNumber(rowComponent.unitCost ?? rowComponent.unit_cost ?? 0),
                lineSaleTotal: safeNumber(
                  rowComponent.lineSaleTotal ?? rowComponent.line_sale_total ?? 0,
                ),
                lineCostTotal: safeNumber(
                  rowComponent.lineCostTotal ?? rowComponent.line_cost_total ?? 0,
                ),
                sortOrder:
                  rowComponent.sortOrder == null && rowComponent.sort_order == null
                    ? undefined
                    : safeNumber(rowComponent.sortOrder ?? rowComponent.sort_order, 0),
                displayText: safeString(
                  rowComponent.displayText ?? rowComponent.display_text,
                ),
              };
            })
          : null;

        return {
          id: safeString(item.id),
          salesOrderId: safeString(item.sales_order_id),
          itemType: item.item_type == null ? undefined : (safeString(item.item_type) as "menu_item" | "combo"),
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
          comboIdSnapshot:
            item.combo_id_snapshot == null ? null : safeString(item.combo_id_snapshot),
          comboCodeSnapshot:
            item.combo_code_snapshot == null ? null : safeString(item.combo_code_snapshot),
          comboNameSnapshot:
            item.combo_name_snapshot == null ? null : safeString(item.combo_name_snapshot),
          comboDefaultSalePriceSnapshot:
            item.combo_default_sale_price_snapshot == null
              ? null
              : safeNumber(item.combo_default_sale_price_snapshot),
          comboComponentsSnapshot: comboComponents,
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
    orderType:
      row.order_type == null
        ? undefined
        : (safeString(row.order_type) as OrderType),
    deliveryStatus:
      row.delivery_status == null
        ? undefined
        : (safeString(row.delivery_status) as DeliveryStatus),
    shipperName:
      row.shipper_name == null ? null : safeString(row.shipper_name),
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

import { cache } from "react";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/service";
import {
  MASTER_DATA_ENTITY_CONFIGS,
  MASTER_DATA_ENTITY_LIST,
} from "@/lib/master-data/config";
import {
  buildMasterDataDeletePatch,
  buildMasterDataOption,
  buildMasterDataUpsertPayload,
  normalizeMasterDataRow,
} from "@/lib/master-data/validation";
import type {
  MasterDataEntityConfig,
  MasterDataEntityKey,
  MasterDataFieldOptionsSource,
  MasterDataOptionGroup,
  MasterDataPageData,
  MasterDataRow,
} from "@/lib/master-data/types";

export interface MasterDataDeleteReference {
  label: string;
  href: string;
  note?: string;
}

export interface MasterDataDeleteImpact {
  blocked: boolean;
  message?: string;
  references: MasterDataDeleteReference[];
}

function getEntityConfig(entity: MasterDataEntityKey): MasterDataEntityConfig {
  return MASTER_DATA_ENTITY_CONFIGS[entity];
}

function getUniqueOptionSources(config: MasterDataEntityConfig) {
  const sources = new Set<MasterDataFieldOptionsSource>();

  for (const field of config.fields) {
    if (field.optionsSource) {
      sources.add(field.optionsSource);
    }
  }

  return [...sources];
}

function applyScopeFilter<T extends { eq: (column: string, value: string) => T; is: (column: string, value: null) => T }>(
  query: T,
  config: MasterDataEntityConfig,
  shopId: string,
) {
  if (config.shopScoped === false) {
    return query;
  }

  return query.eq("shop_id", shopId);
}

async function listInventoryStockItemOptions(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
) {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, sku, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row) => {
    const entry = row as Record<string, unknown>;
    const sku = entry.sku == null ? "" : String(entry.sku).trim();
    const name = entry.name == null ? "" : String(entry.name).trim();
    const label = [sku, name].filter(Boolean).join(" · ");

    return {
      value: String(entry.id ?? ""),
      label: label.length > 0 ? label : String(entry.id ?? ""),
    };
  });
}

async function listProductVariantOptions(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sort_order, product_variants(id, label, weight_in_grams, sort_order)")
    .order("sort_order", { ascending: true });

  if (error || !Array.isArray(data)) {
    return [];
  }

  const options = data.flatMap((row) => {
    const product = row as Record<string, unknown>;
    const productName = String(product.name ?? "").trim();
    const variants = Array.isArray(product.product_variants)
      ? (product.product_variants as Record<string, unknown>[])
      : [];

    return variants.map((variant) => {
      const variantName = String(variant.label ?? "").trim();
      const weightValue = variant.weight_in_grams == null ? null : String(variant.weight_in_grams).trim();
      const label = [
        productName,
        variantName,
        weightValue && weightValue.length > 0 ? `${weightValue}g` : "",
      ]
        .filter((part) => part.length > 0)
        .join(" · ");

      return {
        value: String(variant.id ?? ""),
        label: label.length > 0 ? label : String(variant.id ?? ""),
        sortOrder: Number(product.sort_order ?? 0) * 1000 + Number(variant.sort_order ?? 0),
      };
    });
  });

  return options
    .filter((option) => option.value.length > 0)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(({ sortOrder: _sortOrder, ...option }) => option);
}

async function listRowsForEntity(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  config: MasterDataEntityConfig,
  shopId: string,
): Promise<MasterDataRow[]> {
  if (!supabase) {
    return [];
  }

  let query = supabase.from(config.table).select(config.select);
  query = applyScopeFilter(query, config, shopId);

  const { data, error } = await query.order(config.orderBy.column, {
    ascending: config.orderBy.ascending ?? true,
  });

  if (error) {
    return [];
  }

  return (data ?? []).map((row) =>
    normalizeMasterDataRow(row as unknown as Record<string, unknown>),
  );
}

async function listOptionsForEntity(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  config: MasterDataEntityConfig,
  shopId: string,
) {
  if (!supabase) {
    return [];
  }

  if (config.key === "menu_item_variants") {
    const selectVariants = [
      "id, label, menu_items(name)",
      "id, label",
    ];

    for (const select of selectVariants) {
      let query = supabase.from(config.table).select(select);
      query = applyScopeFilter(query, config, shopId);
      query = query.is("deleted_at", null);

      const { data, error } = await query.order(config.orderBy.column, {
        ascending: config.orderBy.ascending ?? true,
      });

      if (error) {
        continue;
      }

      const options = (data ?? []).map((row) => {
        const record = row as unknown as Record<string, unknown>;
        const menuItem =
          record.menu_items &&
          typeof record.menu_items === "object" &&
          !Array.isArray(record.menu_items)
            ? (record.menu_items as Record<string, unknown>)
            : {};
        const menuItemName = String(menuItem.name ?? "").trim();
        const variantLabel = String(record.label ?? "").trim();
        const label = [menuItemName, variantLabel].filter(Boolean).join(" · ");

        return {
          value: String(record.id ?? ""),
          label: label.length > 0 ? label : String(record.id ?? ""),
        };
      });

      if (options.length > 0) {
        return options;
      }
    }

    return [];
  }

  let query = supabase.from(config.table).select(config.select);
  query = applyScopeFilter(query, config, shopId);
  query = query.is("deleted_at", null).eq("is_active", true);

  const { data, error } = await query.order(config.orderBy.column, {
    ascending: config.orderBy.ascending ?? true,
  });

  if (error) {
    return [];
  }

  return (data ?? []).map((row) =>
    buildMasterDataOption(row as unknown as Record<string, unknown>, config.optionLabelPaths),
  );
}

export const getMasterDataLandingConfig = cache(async (): Promise<{
  context: Awaited<ReturnType<typeof getAdminContext>>;
  entities: Array<MasterDataEntityConfig & { recordCount: number }>;
}> => {
  const context = await getAdminContext();
  const supabase = context.shop && isSupabaseConfigured()
    ? await createSupabaseServerClient()
    : null;

  const countEntries = await Promise.all(
    MASTER_DATA_ENTITY_LIST.filter((entity) =>
      context.permissions.includes(entity.permissions.read),
    ).filter((entity) => entity.hiddenFromLanding !== true).map(async (entity) => {
      if (!supabase || !context.shop) {
        return {
          ...entity,
          recordCount: 0,
        };
      }

      let query = supabase
        .from(entity.table)
        .select("id", { count: "exact", head: true });
      query = applyScopeFilter(query, entity, context.shop.id);
      const { count } = await query;

      return {
        ...entity,
        recordCount: count ?? 0,
      };
    }),
  );

  return {
    context,
    entities: countEntries,
  };
});

export const getMasterDataPageData = cache(async (
  entity: MasterDataEntityKey,
): Promise<MasterDataPageData | null> => {
  const config = getEntityConfig(entity);
  const context = await getAdminContext();

  if (!context.shop) {
    return null;
  }

  if (!context.permissions.includes(config.permissions.read)) {
    return null;
  }

  const shopId = context.shop.id;

  if (!isSupabaseConfigured()) {
    return {
      config,
      rows: [],
      optionGroups: [],
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      config,
      rows: [],
      optionGroups: [],
    };
  }

  const [rows, optionResults] = await Promise.all([
    listRowsForEntity(supabase, config, shopId),
    Promise.all(
      getUniqueOptionSources(config).map(async (_sourceRaw) => {
        const source = _sourceRaw;

        if (source === "inventory_stock_items") {
          const options = await listInventoryStockItemOptions(supabase);

          return {
            key: source,
            label: "Tồn kho (mã hàng)",
            options,
          } satisfies MasterDataOptionGroup;
        }

        if (source === "product_variants") {
          const options = await listProductVariantOptions(supabase);

          return {
            key: source,
            label: "Món hàng",
            options,
          } satisfies MasterDataOptionGroup;
        }

        const sourceConfig = getEntityConfig(source);
        const options = await listOptionsForEntity(
          supabase,
          sourceConfig,
          shopId,
        );

        return {
          key: source,
          label: sourceConfig.title,
          options,
        } satisfies MasterDataOptionGroup;
      }),
    ),
  ]);

  return {
    config,
    rows,
    optionGroups: optionResults,
  };
});

export async function saveMasterDataRecord(
  entity: MasterDataEntityKey,
  values: Record<string, unknown>,
  recordId?: string | null,
): Promise<string> {
  const config = getEntityConfig(entity);
  const context = await getAdminContext();

  if (!context.shop) {
    throw new Error("Missing active shop context.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const payload = buildMasterDataUpsertPayload(
    config,
    values,
    context.shop.id,
    recordId,
  );

  const { data, error } = await supabase.from(config.table).upsert(payload, {
    onConflict: "id",
  }).select("id").single();

  if (error) {
    throw new Error(error.message);
  }

  return String(data?.id ?? payload.id ?? "");
}

export async function deleteMasterDataRecord(
  entity: MasterDataEntityKey,
  recordId: string,
) {
  const config = getEntityConfig(entity);
  const context = await getAdminContext();

  if (!context.shop) {
    throw new Error("Missing active shop context.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const patch = buildMasterDataDeletePatch(config);
  let query = supabase.from(config.table).update(patch).eq("id", recordId);
  query = applyScopeFilter(query, config, context.shop.id);

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}

export async function getMasterDataDeleteImpact(
  entity: MasterDataEntityKey,
  recordId: string,
): Promise<MasterDataDeleteImpact> {
  const context = await getAdminContext();

  if (!context.shop) {
    return {
      blocked: true,
      message: "Thiếu shop hiện tại.",
      references: [],
    };
  }

  if (entity === "categories" && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return { blocked: false, references: [] };
    }

    const [countResponse, rowsResponse] = await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", context.shop.id)
        .eq("category_id", recordId),
      supabase
        .from("products")
        .select("id, name, slug")
        .eq("shop_id", context.shop.id)
        .eq("category_id", recordId)
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    const count = countResponse.count ?? 0;
    const rows = Array.isArray(rowsResponse.data) ? rowsResponse.data : [];

    if (count > 0) {
      return {
        blocked: true,
        message: `Không thể xoá danh mục này vì đang được dùng trong ${count} món.`,
        references: rows.map((row) => ({
          label: String(row.name ?? row.slug ?? row.id),
          href: `/admin/menu/${String(row.id)}`,
          note: "Mở món đang tham chiếu",
        })),
      };
    }
  }

  return {
    blocked: false,
    references: [],
  };
}

export function getMasterDataEntityConfig(entity: MasterDataEntityKey) {
  return getEntityConfig(entity);
}

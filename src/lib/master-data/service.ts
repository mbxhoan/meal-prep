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

async function listRowsForEntity(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  config: MasterDataEntityConfig,
  shopId: string,
): Promise<MasterDataRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from(config.table)
    .select(config.select)
    .eq("shop_id", shopId)
    .order(config.orderBy.column, {
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

  const { data, error } = await supabase
    .from(config.table)
    .select(config.select)
    .eq("shop_id", shopId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order(config.orderBy.column, {
      ascending: config.orderBy.ascending ?? true,
    });

  if (error) {
    return [];
  }

  return (data ?? []).map((row) =>
    buildMasterDataOption(
      row as unknown as Record<string, unknown>,
      config.optionLabelPaths,
    ),
  );
}

export const getMasterDataLandingConfig = cache(async (): Promise<{
  context: Awaited<ReturnType<typeof getAdminContext>>;
  entities: MasterDataEntityConfig[];
}> => {
  const context = await getAdminContext();

  return {
    context,
    entities: MASTER_DATA_ENTITY_LIST.filter((entity) =>
      context.permissions.includes(entity.permissions.read),
    ),
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
            label: "Tồn kho (SKU)",
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

  const payload = buildMasterDataUpsertPayload(
    config,
    values,
    context.shop.id,
    recordId,
  );

  const { error } = await supabase.from(config.table).upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(error.message);
  }
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
  const { error } = await supabase
    .from(config.table)
    .update(patch)
    .eq("id", recordId)
    .eq("shop_id", context.shop.id);

  if (error) {
    throw new Error(error.message);
  }
}

export function getMasterDataEntityConfig(entity: MasterDataEntityKey) {
  return getEntityConfig(entity);
}

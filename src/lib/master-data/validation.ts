import type {
  MasterDataEntityConfig,
  MasterDataFieldConfig,
  MasterDataOption,
  MasterDataRow,
} from "@/lib/master-data/types";

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === 1;
}

function toDateValue(value: unknown): string | null {
  const text = toText(value);

  return text.length > 0 ? text : null;
}

export function getNestedValue(
  row: Record<string, unknown>,
  path: string,
): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current == null || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, row);
}

export function formatOptionLabel(
  row: Record<string, unknown>,
  labelPaths: string[],
): string {
  const parts = labelPaths
    .map((path) => {
      const value = getNestedValue(row, path);

      return value == null ? "" : String(value).trim();
    })
    .filter((part) => part.length > 0);

  return parts.join(" · ");
}

export function buildMasterDataOption(
  row: Record<string, unknown>,
  labelPaths: string[],
): MasterDataOption {
  return {
    value: String(row.id ?? ""),
    label: formatOptionLabel(row, labelPaths),
  };
}

export function normalizeMasterDataRow(
  row: Record<string, unknown>,
): MasterDataRow {
  return {
    ...row,
    id: String(row.id ?? ""),
    shop_id: String(row.shop_id ?? ""),
    is_active: row.is_active !== false,
    deleted_at: row.deleted_at == null ? null : String(row.deleted_at),
  };
}

export function buildMasterDataUpsertPayload(
  config: MasterDataEntityConfig,
  values: Record<string, unknown>,
  shopId: string,
  recordId?: string | null,
) {
  const payload: Record<string, unknown> = {
    deleted_at: null,
  };

  if (config.shopScoped !== false) {
    payload.shop_id = shopId;
  }

  if (recordId) {
    payload.id = recordId;
  }

  for (const field of config.fields) {
    const rawValue = values[field.name];
    const hasValue =
      !(rawValue == null || rawValue === "" || rawValue === false);

    if (field.type === "checkbox") {
      payload[field.name] =
        rawValue == null || rawValue === ""
          ? Boolean(field.defaultValue ?? false)
          : toBoolean(rawValue);
      continue;
    }

    if (field.type === "number") {
      if (!hasValue && field.defaultValue !== undefined) {
        payload[field.name] = field.defaultValue;
      } else {
        payload[field.name] = toNumber(rawValue);
      }
      continue;
    }

    if (field.type === "date") {
      payload[field.name] =
        !hasValue && field.defaultValue !== undefined
          ? field.defaultValue
          : toDateValue(rawValue);
      continue;
    }

    const textValue = toText(rawValue);
    payload[field.name] =
      textValue.length > 0
        ? textValue
        : field.defaultValue !== undefined
          ? field.defaultValue
          : null;
  }

  return payload;
}

export function buildMasterDataDeletePatch(
  config: MasterDataEntityConfig,
): Record<string, unknown> {
  return {
    deleted_at: new Date().toISOString(),
    is_active: false,
    ...(config.deletePatch ?? {}),
  };
}

export function getDefaultDraftValue(
  field: MasterDataFieldConfig,
): string | number | boolean | null {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  return field.type === "checkbox" ? false : "";
}

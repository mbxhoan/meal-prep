import {
  INVENTORY_BARCODE_TYPES,
  INVENTORY_TRACKING_MODES,
  type InventoryBarcodeType,
  type InventoryItemTrackingFields,
  type InventoryTrackingMode,
} from "@/lib/inventory/types";

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown): number | null {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function includesValue<T extends readonly string[]>(
  values: T,
  candidate: string,
): candidate is T[number] {
  return values.includes(candidate as T[number]);
}

export function isInventoryTrackingMode(
  value: unknown,
): value is InventoryTrackingMode {
  return (
    typeof value === "string" &&
    includesValue(INVENTORY_TRACKING_MODES, value)
  );
}

export function normalizeInventoryTrackingMode(
  value: unknown,
  fallback: InventoryTrackingMode = "lot",
): InventoryTrackingMode {
  return isInventoryTrackingMode(value) ? value : fallback;
}

export function isInventoryBarcodeType(
  value: unknown,
): value is InventoryBarcodeType {
  return (
    typeof value === "string" &&
    includesValue(INVENTORY_BARCODE_TYPES, value)
  );
}

export function normalizeInventoryBarcodeType(
  value: unknown,
): InventoryBarcodeType | null {
  return isInventoryBarcodeType(value) ? value : null;
}

export function normalizeInventoryItemTrackingFields(
  row: Record<string, unknown>,
): InventoryItemTrackingFields {
  return {
    barcode: toText(row.barcode) || null,
    barcodeType: normalizeInventoryBarcodeType(row.barcode_type),
    trackingMode: normalizeInventoryTrackingMode(row.tracking_mode),
    isExpirable: row.is_expirable !== false,
    isFefoEnabled: row.is_fefo_enabled !== false,
    requiresUnitLabel: row.requires_unit_label === true,
    defaultShelfLifeDays: toNumber(row.default_shelf_life_days),
  };
}

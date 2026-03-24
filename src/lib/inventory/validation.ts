import {
  INVENTORY_BARCODE_TYPES,
  INVENTORY_ISSUE_STATUSES,
  INVENTORY_LOT_STATUSES,
  INVENTORY_MOVEMENT_TYPES,
  INVENTORY_RECEIPT_STATUSES,
  INVENTORY_TRACKING_MODES,
  type InventoryBarcodeType,
  type InventoryFefoCandidateRecord,
  type InventoryFefoSuggestionRecord,
  type InventoryIssueItemRecord,
  type InventoryIssueRecord,
  type InventoryIssueStatus,
  type InventoryItemTrackingFields,
  type InventoryLookupRecord,
  type InventoryLotRecord,
  type InventoryLotStatus,
  type InventoryMovementRecord,
  type InventoryMovementTrackingFields,
  type InventoryMovementType,
  type InventoryReceiptItemRecord,
  type InventoryReceiptRecord,
  type InventoryReceiptStatus,
  type InventoryStockByItemRecord,
  type InventoryStockByLotRecord,
  type InventoryTrackingMode,
} from "@/lib/inventory/types";

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableText(value: unknown): string | null {
  const text = toText(value);

  return text.length > 0 ? text : null;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: unknown): number | null {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function includesValue<T extends readonly string[]>(
  values: T,
  candidate: string,
): candidate is T[number] {
  return values.includes(candidate as T[number]);
}

function toNullableDate(value: unknown): string | null {
  return value == null || value === "" ? null : String(value);
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

export function normalizeInventoryMovementType(
  value: unknown,
): InventoryMovementType | null {
  const candidate = toText(value);

  return includesValue(INVENTORY_MOVEMENT_TYPES, candidate)
    ? candidate
    : null;
}

export function normalizeInventoryReceiptStatus(
  value: unknown,
): InventoryReceiptStatus {
  const candidate = toText(value);

  return includesValue(INVENTORY_RECEIPT_STATUSES, candidate)
    ? candidate
    : "draft";
}

export function normalizeInventoryIssueStatus(
  value: unknown,
): InventoryIssueStatus {
  const candidate = toText(value);

  return includesValue(INVENTORY_ISSUE_STATUSES, candidate)
    ? candidate
    : "draft";
}

export function normalizeInventoryItemTrackingFields(
  row: Record<string, unknown>,
): InventoryItemTrackingFields {
  return {
    barcode: toNullableText(row.barcode),
    barcodeType: normalizeInventoryBarcodeType(row.barcode_type),
    trackingMode: normalizeInventoryTrackingMode(row.tracking_mode),
    isExpirable: row.is_expirable !== false,
    isFefoEnabled: row.is_fefo_enabled !== false,
    requiresUnitLabel: row.requires_unit_label === true,
    defaultShelfLifeDays: toNullableNumber(row.default_shelf_life_days),
  };
}

export function normalizeInventoryMovementTrackingFields(
  row: Record<string, unknown>,
): InventoryMovementTrackingFields {
  return {
    lotId: toNullableText(row.lot_id),
    serialId: toNullableText(row.serial_id),
    referenceType: toNullableText(row.reference_type),
    referenceId: toNullableText(row.reference_id),
    referenceLineId: toNullableText(row.reference_line_id),
  };
}

export function normalizeInventoryLookupRecord(
  row: Record<string, unknown>,
): InventoryLookupRecord {
  return {
    id: String(row.id),
    code: toText(row.code),
    name: toText(row.name),
    isActive: row.is_active !== false,
    isDefault: row.is_default == null ? undefined : row.is_default === true,
  };
}

export function normalizeInventoryLotRecord(
  row: Record<string, unknown>,
): InventoryLotRecord {
  return {
    id: String(row.id),
    shopId: toNullableText(row.shop_id),
    itemId: String(row.item_id ?? row.inventory_item_id ?? ""),
    inventoryItemId: String(row.inventory_item_id ?? row.item_id ?? ""),
    warehouseId: toNullableText(row.warehouse_id),
    supplierId: toNullableText(row.supplier_id),
    lotNo: toText(row.lot_no),
    lotBarcode: toNullableText(row.lot_barcode),
    supplierLotNo: toNullableText(row.supplier_lot_no),
    manufacturedAt: toNullableDate(row.manufactured_at),
    expiredAt: toNullableDate(row.expired_at),
    receivedAt: String(row.received_at ?? new Date().toISOString()),
    status: includesValue(INVENTORY_LOT_STATUSES, toText(row.status))
      ? (toText(row.status) as InventoryLotStatus)
      : "open",
    notes: toNullableText(row.notes),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

export function normalizeInventoryMovementRecord(
  row: Record<string, unknown>,
): InventoryMovementRecord {
  const movementType = normalizeInventoryMovementType(row.movement_type) ?? "adjustment";
  const trackingFields = normalizeInventoryMovementTrackingFields(row);

  return {
    id: String(row.id),
    shopId: toNullableText(row.shop_id),
    itemId: String(row.item_id ?? row.inventory_item_id ?? ""),
    inventoryItemId: String(row.inventory_item_id ?? row.item_id ?? ""),
    warehouseId: toNullableText(row.warehouse_id),
    lotId: trackingFields.lotId,
    serialId: trackingFields.serialId,
    movementType,
    quantityDelta: toNumber(row.quantity_delta),
    unitCost: toNullableNumber(row.unit_cost),
    referenceType: trackingFields.referenceType,
    referenceId: trackingFields.referenceId,
    referenceLineId: trackingFields.referenceLineId,
    notes: toNullableText(row.notes),
    createdBy: toNullableText(row.created_by),
    movementAt: String(row.movement_at ?? row.created_at ?? new Date().toISOString()),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function normalizeInventoryReceiptItemRecord(
  row: Record<string, unknown>,
): InventoryReceiptItemRecord {
  return {
    id: String(row.id),
    shopId: String(row.shop_id ?? ""),
    inventoryReceiptId: String(row.inventory_receipt_id ?? ""),
    itemId: String(row.item_id ?? ""),
    lotId: toNullableText(row.lot_id),
    lotNoSnapshot: toNullableText(row.lot_no_snapshot),
    lotBarcodeSnapshot: toNullableText(row.lot_barcode_snapshot),
    qtyReceived: toNumber(row.qty_received),
    unitCost: toNumber(row.unit_cost),
    lineTotal: toNumber(row.line_total),
    manufacturedAt: toNullableDate(row.manufactured_at),
    expiredAt: toNullableDate(row.expired_at),
    note: toNullableText(row.note),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function normalizeInventoryReceiptRecord(
  row: Record<string, unknown>,
): InventoryReceiptRecord {
  const items = Array.isArray(row.inventory_receipt_items)
    ? row.inventory_receipt_items.map((item) =>
        normalizeInventoryReceiptItemRecord(item as Record<string, unknown>),
      )
    : [];
  const warehouse =
    row.warehouses && typeof row.warehouses === "object" && !Array.isArray(row.warehouses)
      ? (row.warehouses as Record<string, unknown>)
      : {};
  const supplier =
    row.suppliers && typeof row.suppliers === "object" && !Array.isArray(row.suppliers)
      ? (row.suppliers as Record<string, unknown>)
      : {};

  return {
    id: String(row.id),
    shopId: String(row.shop_id ?? ""),
    receiptNo: toText(row.receipt_no),
    receivedAt: String(row.received_at ?? new Date().toISOString()),
    warehouseId: String(row.warehouse_id ?? ""),
    warehouseCode: row.warehouse_code == null ? toNullableText(warehouse.code) : toNullableText(row.warehouse_code),
    warehouseName: row.warehouse_name == null ? toNullableText(warehouse.name) : toNullableText(row.warehouse_name),
    supplierId: toNullableText(row.supplier_id),
    supplierCode: row.supplier_code == null ? toNullableText(supplier.code) : toNullableText(row.supplier_code),
    supplierName: row.supplier_name == null ? toNullableText(supplier.name) : toNullableText(row.supplier_name),
    status: normalizeInventoryReceiptStatus(row.status),
    note: toNullableText(row.note),
    postedAt: toNullableDate(row.posted_at),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    items,
  };
}

export function normalizeInventoryIssueItemRecord(
  row: Record<string, unknown>,
): InventoryIssueItemRecord {
  return {
    id: String(row.id),
    shopId: String(row.shop_id ?? ""),
    inventoryIssueId: String(row.inventory_issue_id ?? ""),
    itemId: String(row.item_id ?? ""),
    lotId: toNullableText(row.lot_id),
    suggestedLotId: toNullableText(row.suggested_lot_id),
    lotNoSnapshot: toNullableText(row.lot_no_snapshot),
    lotBarcodeSnapshot: toNullableText(row.lot_barcode_snapshot),
    qtyIssued: toNumber(row.qty_issued),
    fefoOverridden: row.fefo_overridden === true,
    fefoOverrideReason: toNullableText(row.fefo_override_reason),
    note: toNullableText(row.note),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function normalizeInventoryIssueRecord(
  row: Record<string, unknown>,
): InventoryIssueRecord {
  const items = Array.isArray(row.inventory_issue_items)
    ? row.inventory_issue_items.map((item) =>
        normalizeInventoryIssueItemRecord(item as Record<string, unknown>),
      )
    : [];
  const warehouse =
    row.warehouses && typeof row.warehouses === "object" && !Array.isArray(row.warehouses)
      ? (row.warehouses as Record<string, unknown>)
      : {};

  return {
    id: String(row.id),
    shopId: String(row.shop_id ?? ""),
    issueNo: toText(row.issue_no),
    issuedAt: String(row.issued_at ?? new Date().toISOString()),
    warehouseId: String(row.warehouse_id ?? ""),
    warehouseCode: row.warehouse_code == null ? toNullableText(warehouse.code) : toNullableText(row.warehouse_code),
    warehouseName: row.warehouse_name == null ? toNullableText(warehouse.name) : toNullableText(row.warehouse_name),
    status: normalizeInventoryIssueStatus(row.status),
    reasonCode: toNullableText(row.reason_code),
    sourceType: toNullableText(row.source_type),
    sourceId: toNullableText(row.source_id),
    note: toNullableText(row.note),
    postedAt: toNullableDate(row.posted_at),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    items,
  };
}

export function normalizeInventoryStockByItemRecord(
  row: Record<string, unknown>,
): InventoryStockByItemRecord {
  const onHand = toNumber(row.on_hand);
  const reorderPoint = toNumber(row.reorder_point);
  const stockValue =
    row.stock_value == null ? Math.round(onHand * toNumber(row.average_unit_cost)) : toNumber(row.stock_value);

  return {
    shopId: toNullableText(row.shop_id),
    itemId: String(row.item_id ?? ""),
    itemName: toText(row.item_name),
    sku: toText(row.sku),
    unit: toText(row.unit),
    trackingMode: normalizeInventoryTrackingMode(row.tracking_mode),
    isExpirable: row.is_expirable !== false,
    isFefoEnabled: row.is_fefo_enabled !== false,
    requiresUnitLabel: row.requires_unit_label === true,
    defaultShelfLifeDays: toNullableNumber(row.default_shelf_life_days),
    minimumStockQty: toNumber(row.minimum_stock_qty),
    reorderPoint,
    averageUnitCost: toNumber(row.average_unit_cost),
    lastPurchaseCost: toNumber(row.last_purchase_cost),
    supplierName: toNullableText(row.supplier_name),
    notes: toNullableText(row.notes),
    isActive: row.is_active !== false,
    onHand,
    lotCount: toNumber(row.lot_count),
    lastMovementAt: String(row.last_movement_at ?? row.updated_at ?? new Date().toISOString()),
    stockValue,
    isLowStock: row.is_low_stock == null ? onHand <= reorderPoint : row.is_low_stock === true,
  };
}

export function normalizeInventoryStockByLotRecord(
  row: Record<string, unknown>,
): InventoryStockByLotRecord {
  const onHand = toNumber(row.on_hand);

  return {
    lotId: String(row.lot_id ?? ""),
    shopId: toNullableText(row.shop_id),
    itemId: String(row.item_id ?? ""),
    itemName: toText(row.item_name),
    sku: toText(row.sku),
    unit: toText(row.unit),
    warehouseId: toNullableText(row.warehouse_id),
    warehouseCode: toNullableText(row.warehouse_code),
    warehouseName: toNullableText(row.warehouse_name),
    supplierId: toNullableText(row.supplier_id),
    supplierCode: toNullableText(row.supplier_code),
    supplierName: toNullableText(row.supplier_name),
    lotNo: toText(row.lot_no),
    lotBarcode: toNullableText(row.lot_barcode),
    supplierLotNo: toNullableText(row.supplier_lot_no),
    manufacturedAt: toNullableDate(row.manufactured_at),
    expiredAt: toNullableDate(row.expired_at),
    receivedAt: String(row.received_at ?? new Date().toISOString()),
    status: includesValue(INVENTORY_LOT_STATUSES, toText(row.status))
      ? (toText(row.status) as InventoryLotStatus)
      : "open",
    notes: toNullableText(row.notes),
    trackingMode: normalizeInventoryTrackingMode(row.tracking_mode),
    isExpirable: row.is_expirable !== false,
    isFefoEnabled: row.is_fefo_enabled !== false,
    onHand,
    stockValue: row.stock_value == null ? Math.round(onHand * toNumber(row.average_unit_cost)) : toNumber(row.stock_value),
    lastMovementAt: toNullableDate(row.last_movement_at),
    isExpired: row.is_expired === true,
  };
}

export function normalizeInventoryFefoCandidateRecord(
  row: Record<string, unknown>,
): InventoryFefoCandidateRecord {
  return {
    ...normalizeInventoryStockByLotRecord(row),
    fefoRank: toNumber(row.fefo_rank),
  };
}

export function normalizeInventoryFefoSuggestionRecord(
  row: Record<string, unknown>,
): InventoryFefoSuggestionRecord {
  return {
    lotId: String(row.lot_id ?? ""),
    itemId: String(row.item_id ?? ""),
    lotNo: toText(row.lot_no),
    lotBarcode: toNullableText(row.lot_barcode),
    warehouseId: toNullableText(row.warehouse_id),
    expiredAt: toNullableDate(row.expired_at),
    receivedAt: String(row.received_at ?? new Date().toISOString()),
    onHand: toNumber(row.on_hand),
    suggestedQty: toNumber(row.suggested_qty),
    fefoRank: toNumber(row.fefo_rank),
    isExpired: row.is_expired === true,
  };
}

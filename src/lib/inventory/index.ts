export {
  INVENTORY_BARCODE_TYPES,
  INVENTORY_LOT_STATUSES,
  INVENTORY_SERIAL_STATUSES,
  INVENTORY_TRACKING_MODES,
  type InventoryBarcodeType,
  type InventoryItemTrackingFields,
  type InventoryLotRecord,
  type InventoryLotStatus,
  type InventoryMovementTrackingFields,
  type InventorySerialRecord,
  type InventorySerialStatus,
  type InventoryTrackingMode,
} from "@/lib/inventory/types";
export {
  isInventoryBarcodeType,
  isInventoryTrackingMode,
  normalizeInventoryBarcodeType,
  normalizeInventoryItemTrackingFields,
  normalizeInventoryTrackingMode,
} from "@/lib/inventory/validation";

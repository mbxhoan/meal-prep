export const INVENTORY_TRACKING_MODES = [
  "none",
  "lot",
  "serial",
  "lot_serial",
] as const;

export type InventoryTrackingMode =
  (typeof INVENTORY_TRACKING_MODES)[number];

export const INVENTORY_BARCODE_TYPES = [
  "code128",
  "code39",
  "ean13",
  "ean8",
  "qr",
  "itf14",
  "data_matrix",
] as const;

export type InventoryBarcodeType =
  (typeof INVENTORY_BARCODE_TYPES)[number];

export const INVENTORY_LOT_STATUSES = [
  "open",
  "quarantined",
  "closed",
  "expired",
  "consumed",
  "void",
] as const;

export type InventoryLotStatus =
  (typeof INVENTORY_LOT_STATUSES)[number];

export const INVENTORY_SERIAL_STATUSES = [
  "in_stock",
  "reserved",
  "sold",
  "returned",
  "damaged",
  "void",
] as const;

export type InventorySerialStatus =
  (typeof INVENTORY_SERIAL_STATUSES)[number];

export interface InventoryItemTrackingFields {
  barcode: string | null;
  barcodeType: InventoryBarcodeType | null;
  trackingMode: InventoryTrackingMode;
  isExpirable: boolean;
  isFefoEnabled: boolean;
  requiresUnitLabel: boolean;
  defaultShelfLifeDays: number | null;
}

export interface InventoryMovementTrackingFields {
  lotId: string | null;
  serialId: string | null;
  referenceType: string | null;
  referenceId: string | null;
}

export interface InventoryLotRecord {
  id: string;
  inventoryItemId: string;
  lotNo: string;
  lotBarcode: string | null;
  supplierLotNo: string | null;
  manufacturedAt: string | null;
  expiredAt: string | null;
  receivedAt: string;
  status: InventoryLotStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySerialRecord {
  id: string;
  inventoryItemId: string;
  inventoryLotId: string | null;
  serialNo: string;
  serialBarcode: string | null;
  status: InventorySerialStatus;
  receivedAt: string | null;
  soldAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

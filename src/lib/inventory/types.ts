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

export const INVENTORY_MOVEMENT_TYPES = [
  "purchase",
  "receipt",
  "issue",
  "adjustment",
  "waste",
  "order_consumption",
] as const;

export type InventoryMovementType =
  (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const INVENTORY_RECEIPT_STATUSES = [
  "draft",
  "posted",
  "cancelled",
] as const;

export type InventoryReceiptStatus =
  (typeof INVENTORY_RECEIPT_STATUSES)[number];

export const INVENTORY_ISSUE_STATUSES = [
  "draft",
  "posted",
  "cancelled",
] as const;

export type InventoryIssueStatus =
  (typeof INVENTORY_ISSUE_STATUSES)[number];

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
  referenceLineId: string | null;
}

export interface InventoryLotRecord {
  id: string;
  shopId: string | null;
  itemId: string;
  inventoryItemId: string;
  warehouseId: string | null;
  supplierId: string | null;
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

export interface InventoryMovementRecord {
  id: string;
  shopId: string | null;
  itemId: string;
  inventoryItemId: string;
  warehouseId: string | null;
  lotId: string | null;
  serialId: string | null;
  movementType: InventoryMovementType;
  quantityDelta: number;
  unitCost: number | null;
  referenceType: string | null;
  referenceId: string | null;
  referenceLineId: string | null;
  notes: string | null;
  createdBy: string | null;
  movementAt: string;
  createdAt: string;
}

export interface InventoryReceiptItemRecord {
  id: string;
  shopId: string;
  inventoryReceiptId: string;
  itemId: string;
  lotId: string | null;
  lotNoSnapshot: string | null;
  lotBarcodeSnapshot: string | null;
  qtyReceived: number;
  unitCost: number;
  lineTotal: number;
  manufacturedAt: string | null;
  expiredAt: string | null;
  note: string | null;
  createdAt: string;
}

export interface InventoryReceiptRecord {
  id: string;
  shopId: string;
  receiptNo: string;
  receivedAt: string;
  warehouseId: string;
  warehouseCode: string | null;
  warehouseName: string | null;
  supplierId: string | null;
  supplierCode: string | null;
  supplierName: string | null;
  status: InventoryReceiptStatus;
  note: string | null;
  postedAt: string | null;
  createdAt: string;
  items: InventoryReceiptItemRecord[];
}

export interface InventoryIssueItemRecord {
  id: string;
  shopId: string;
  inventoryIssueId: string;
  itemId: string;
  lotId: string | null;
  suggestedLotId: string | null;
  lotNoSnapshot: string | null;
  lotBarcodeSnapshot: string | null;
  qtyIssued: number;
  fefoOverridden: boolean;
  fefoOverrideReason: string | null;
  note: string | null;
  createdAt: string;
}

export interface InventoryIssueRecord {
  id: string;
  shopId: string;
  issueNo: string;
  issuedAt: string;
  warehouseId: string;
  warehouseCode: string | null;
  warehouseName: string | null;
  status: InventoryIssueStatus;
  reasonCode: string | null;
  sourceType: string | null;
  sourceId: string | null;
  note: string | null;
  postedAt: string | null;
  createdAt: string;
  items: InventoryIssueItemRecord[];
}

export interface InventoryStockByItemRecord {
  shopId: string | null;
  itemId: string;
  itemName: string;
  sku: string;
  unit: string;
  trackingMode: InventoryTrackingMode;
  isExpirable: boolean;
  isFefoEnabled: boolean;
  requiresUnitLabel: boolean;
  defaultShelfLifeDays: number | null;
  minimumStockQty: number;
  reorderPoint: number;
  averageUnitCost: number;
  lastPurchaseCost: number;
  supplierName: string | null;
  notes: string | null;
  isActive: boolean;
  onHand: number;
  lotCount: number;
  lastMovementAt: string;
  stockValue: number;
  isLowStock: boolean;
}

export interface InventoryStockByLotRecord {
  lotId: string;
  shopId: string | null;
  itemId: string;
  itemName: string;
  sku: string;
  unit: string;
  warehouseId: string | null;
  warehouseCode: string | null;
  warehouseName: string | null;
  supplierId: string | null;
  supplierCode: string | null;
  supplierName: string | null;
  lotNo: string;
  lotBarcode: string | null;
  supplierLotNo: string | null;
  manufacturedAt: string | null;
  expiredAt: string | null;
  receivedAt: string;
  status: InventoryLotStatus;
  notes: string | null;
  trackingMode: InventoryTrackingMode;
  isExpirable: boolean;
  isFefoEnabled: boolean;
  onHand: number;
  stockValue: number;
  lastMovementAt: string | null;
  isExpired: boolean;
}

export interface InventoryFefoCandidateRecord extends InventoryStockByLotRecord {
  fefoRank: number;
}

export interface InventoryLookupRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault?: boolean;
}

export interface InventoryCorePermissions {
  canReadStock: boolean;
  canCreateReceipt: boolean;
  canPostReceipt: boolean;
  canCreateIssue: boolean;
  canPostIssue: boolean;
  canOverrideFefo: boolean;
}

export interface InventoryCorePageData {
  shopId: string;
  shopName: string;
  permissions: InventoryCorePermissions;
  stockByItem: InventoryStockByItemRecord[];
  stockByLot: InventoryStockByLotRecord[];
  fefoCandidates: InventoryFefoCandidateRecord[];
  receipts: InventoryReceiptRecord[];
  issues: InventoryIssueRecord[];
  movements: InventoryMovementRecord[];
  warehouses: InventoryLookupRecord[];
  suppliers: InventoryLookupRecord[];
}

export interface InventoryReceiptLineInput {
  itemId: string;
  qtyReceived: number;
  unitCost: number;
  lotId?: string | null;
  lotNoSnapshot?: string | null;
  lotBarcodeSnapshot?: string | null;
  manufacturedAt?: string | null;
  expiredAt?: string | null;
  note?: string | null;
}

export interface InventoryReceiptSavePayload {
  receiptId?: string | null;
  receiptNo: string;
  receivedAt?: string | null;
  warehouseId: string;
  supplierId?: string | null;
  note?: string | null;
  postImmediately?: boolean;
  items: InventoryReceiptLineInput[];
}

export interface InventoryIssueLineInput {
  itemId: string;
  qtyIssued: number;
  lotId?: string | null;
  suggestedLotId?: string | null;
  fefoOverrideReason?: string | null;
  note?: string | null;
}

export interface InventoryIssueSavePayload {
  issueId?: string | null;
  issueNo: string;
  issuedAt?: string | null;
  warehouseId: string;
  reasonCode?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  note?: string | null;
  postImmediately?: boolean;
  items: InventoryIssueLineInput[];
}

export interface InventoryFefoSuggestionInput {
  itemId: string;
  quantity?: number | null;
  warehouseId?: string | null;
  shopId?: string | null;
  allowExpired?: boolean;
}

export interface InventoryFefoSuggestionRecord {
  lotId: string;
  itemId: string;
  lotNo: string;
  lotBarcode: string | null;
  warehouseId: string | null;
  expiredAt: string | null;
  receivedAt: string;
  onHand: number;
  suggestedQty: number;
  fefoRank: number;
  isExpired: boolean;
}

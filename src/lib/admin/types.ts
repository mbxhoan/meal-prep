import type {
  PermissionCode,
  ProfileRoleCode,
  RoleCode,
  ShopContext,
  UserShopRoleRecord,
  EmployeeRecord as RbacEmployeeRecord,
} from "@/lib/rbac";
import type {
  InventoryBarcodeType,
  InventoryItemTrackingFields,
  InventoryLotRecord,
  InventoryMovementTrackingFields,
  InventorySerialRecord,
  InventoryTrackingMode,
} from "@/lib/inventory";

export type AdminMode = "demo" | "live";
export type AdminRole = ProfileRoleCode;
export type SalesChannel =
  | "website"
  | "facebook"
  | "zalo"
  | "store"
  | "grab"
  | "manual";
export type OrderType = "ready_made" | "order";
export type DeliveryStatus = "pending" | "delivered";
export type OrderStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "completed"
  | "cancelled";
export type PaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "refunded"
  | "void";
export type InventoryMovementType =
  | "purchase"
  | "adjustment"
  | "waste"
  | "order_consumption";
export type { InventoryBarcodeType, InventoryTrackingMode };

export interface AdminIdentity {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AdminRole;
  avatarUrl: string | null;
  activeShopId: string | null;
  activeShopName: string | null;
}

export interface AdminContext {
  configured: boolean;
  mode: AdminMode;
  user: AdminIdentity | null;
  employee: EmployeeRecord | null;
  shop: ShopContext | null;
  shops: ShopContext[];
  permissions: PermissionCode[];
  canEdit: boolean;
  canAccessPanel: boolean;
  canManageRoles: boolean;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}

export interface RecipeComponent {
  id: string;
  variantId: string;
  inventoryItemId: string;
  ingredientName: string;
  unit: string;
  quantityPerUnit: number;
  unitCost: number;
  wastagePercent: number;
  lineCost: number;
}

export interface MenuVariant {
  id: string;
  productId: string;
  label: string;
  weightInGrams: number | null;
  price: number;
  compareAtPrice: number | null;
  standardCost: number;
  packagingCost: number;
  laborCost: number;
  overheadCost: number;
  recipeCost: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  recipeComponents: RecipeComponent[];
}

export interface MenuProduct {
  id: string;
  categoryId: string | null;
  categoryName: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  mainImageUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  updatedAt: string;
  images?: MenuProductImage[];
  variants: MenuVariant[];
}

export interface MenuProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  onHand: number;
  reorderPoint: number;
  averageUnitCost: number;
  lastPurchaseCost: number;
  supplierName: string;
  notes: string;
  updatedAt: string;
  isLowStock: boolean;
  barcode?: InventoryItemTrackingFields["barcode"];
  barcodeType?: InventoryItemTrackingFields["barcodeType"];
  trackingMode?: InventoryItemTrackingFields["trackingMode"];
  isExpirable?: InventoryItemTrackingFields["isExpirable"];
  isFefoEnabled?: InventoryItemTrackingFields["isFefoEnabled"];
  requiresUnitLabel?: InventoryItemTrackingFields["requiresUnitLabel"];
  defaultShelfLifeDays?: InventoryItemTrackingFields["defaultShelfLifeDays"];
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  movementType: InventoryMovementType;
  quantityDelta: number;
  unitCost: number | null;
  notes: string;
  createdAt: string;
  lotId?: InventoryMovementTrackingFields["lotId"];
  serialId?: InventoryMovementTrackingFields["serialId"];
  referenceType?: InventoryMovementTrackingFields["referenceType"];
  referenceId?: InventoryMovementTrackingFields["referenceId"];
}

export type EmployeeRecord = RbacEmployeeRecord;
export type InventoryLot = InventoryLotRecord;
export type InventorySerial = InventorySerialRecord;

export interface RoleOption {
  code: RoleCode;
  label: string;
  description: string;
  scope: "global" | "shop";
}

export interface UserRoleAssignmentView {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  profileRole: AdminRole;
  employee: EmployeeRecord | null;
  assignments: UserShopRoleRecord[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  unitCogs: number;
  lineRevenue: number;
  lineCogs: number;
  lineProfit: number;
  itemNameSnapshot?: string;
  variantLabelSnapshot?: string | null;
  weightGramsSnapshot?: number | null;
  unitPriceSnapshot?: number;
  standardCostSnapshot?: number;
  lineDiscountType?: string | null;
  lineDiscountValue?: number | null;
  lineDiscountAmount?: number;
  lineTotalBeforeDiscount?: number;
  lineTotalAfterDiscount?: number;
  lineCostTotal?: number;
  lineProfitTotal?: number;
  legacyProductVariantId?: string | null;
  menuItemVariantId?: string | null;
  priceBookItemIdSnapshot?: string | null;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string | null;
  customerAddress?: string | null;
  employeeId?: string | null;
  salesChannel: SalesChannel;
  orderType?: OrderType;
  deliveryStatus?: DeliveryStatus;
  shipperName?: string | null;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  note: string | null;
  subtotal: number;
  subtotalBeforeDiscount?: number;
  discountAmount: number;
  orderDiscountType?: string | null;
  orderDiscountValue?: number | null;
  orderDiscountAmount?: number;
  shippingFee: number;
  otherFee: number;
  totalAmount?: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMargin: number;
  orderedAt: string;
  sentAt?: string | null;
  confirmedAt?: string | null;
  priceBookIdSnapshot?: string | null;
  priceBookCodeSnapshot?: string | null;
  inventoryAppliedAt: string | null;
  payments?: Array<{
    amount: number;
  }>;
  items: OrderItem[];
}

export interface BestSeller {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface DashboardSnapshot {
  revenue30d: number;
  profit30d: number;
  grossMargin30d: number;
  avgOrderValue: number;
  orderCount30d: number;
  todayRevenue: number;
  todayOrders: number;
  menuCount: number;
  lowStockCount: number;
  openOrders: number;
  recentOrders: OrderRecord[];
  salesTrend: AnalyticsPoint[];
  lowStockItems: InventoryItem[];
  bestSellers: BestSeller[];
}

export interface AnalyticsPoint {
  date: string;
  revenue: number;
  cogs: number;
  profit: number;
  orders: number;
}

export interface ActionState {
  status: "idle" | "success" | "error";
  message: string;
  mode: AdminMode;
}

export interface MenuProductPayload {
  id: string;
  categoryId: string | null;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  mainImageUrl: string;
  images?: Array<{
    id?: string;
    imageUrl: string;
    altText: string;
    sortOrder: number;
    isPrimary: boolean;
  }>;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  variants: Array<{
    id: string;
    label: string;
    weightInGrams: number | null;
    price: number;
    compareAtPrice: number | null;
    standardCost: number;
    packagingCost: number;
    laborCost: number;
    overheadCost: number;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
    recipeComponents: Array<{
      id: string;
      inventoryItemId: string;
      quantityPerUnit: number;
      wastagePercent: number;
    }>;
  }>;
}

export interface OrderPayload {
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  employeeId: string | null;
  salesChannel: SalesChannel;
  orderType?: OrderType;
  deliveryStatus?: DeliveryStatus;
  shipperName?: string;
  discountPercent?: number;
  discountAmount?: number;
  shippingFee: number;
  paidAmount?: number;
  otherFee: number;
  note: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface AssignRolePayload {
  userId: string;
  shopId: string;
  roleCode: RoleCode;
  isPrimary: boolean;
}

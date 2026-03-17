export type AdminMode = "demo" | "live";
export type AdminRole = "admin" | "editor" | "viewer";
export type SalesChannel =
  | "website"
  | "facebook"
  | "zalo"
  | "store"
  | "grab"
  | "manual";
export type OrderStatus =
  | "draft"
  | "confirmed"
  | "completed"
  | "cancelled";
export type InventoryMovementType =
  | "purchase"
  | "adjustment"
  | "waste"
  | "order_consumption";

export interface AdminIdentity {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AdminRole;
  avatarUrl: string | null;
}

export interface AdminContext {
  configured: boolean;
  mode: AdminMode;
  user: AdminIdentity | null;
  canEdit: boolean;
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
  variants: MenuVariant[];
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
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  movementType: InventoryMovementType;
  quantityDelta: number;
  unitCost: number | null;
  notes: string;
  createdAt: string;
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
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  salesChannel: SalesChannel;
  status: OrderStatus;
  note: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  otherFee: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMargin: number;
  orderedAt: string;
  inventoryAppliedAt: string | null;
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
  menuCount: number;
  lowStockCount: number;
  openOrders: number;
  recentOrders: OrderRecord[];
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
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  variants: Array<{
    id: string;
    label: string;
    weightInGrams: number | null;
    price: number;
    compareAtPrice: number | null;
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
  customerName: string;
  customerPhone: string;
  salesChannel: SalesChannel;
  status: OrderStatus;
  discountAmount: number;
  shippingFee: number;
  otherFee: number;
  note: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

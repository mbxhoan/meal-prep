import type { MenuProduct } from "@/lib/admin/types";
import type { DeliveryStatus, OrderType } from "@/lib/admin/types";

export type SalesOrderStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "completed"
  | "cancelled";

export type SalesPaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "refunded"
  | "void";

export interface SalesOrderItemRecord {
  id: string;
  salesOrderId: string;
  itemType?: "menu_item" | "combo";
  menuItemVariantId: string | null;
  legacyProductVariantId: string | null;
  priceBookItemIdSnapshot: string | null;
  itemNameSnapshot: string;
  variantLabelSnapshot: string | null;
  weightGramsSnapshot: number | null;
  quantity: number;
  unitPriceSnapshot: number;
  standardCostSnapshot: number;
  comboIdSnapshot?: string | null;
  comboCodeSnapshot?: string | null;
  comboNameSnapshot?: string | null;
  comboDefaultSalePriceSnapshot?: number | null;
  comboComponentsSnapshot?: Array<{
    productVariantId?: string;
    productName?: string;
    menuItemVariantId: string;
    menuItemName: string;
    variantLabel: string | null;
    weightGrams: number | null;
    quantity: number;
    unitSalePrice: number;
    unitCost: number;
    lineSaleTotal: number;
    lineCostTotal: number;
    displayText: string;
    sortOrder?: number;
  }> | null;
  lineDiscountType: string | null;
  lineDiscountValue: number | null;
  lineDiscountAmount: number;
  lineTotalBeforeDiscount: number;
  lineTotalAfterDiscount: number;
  lineCostTotal: number;
  lineProfitTotal: number;
}

export interface SalesPaymentRecord {
  id: string;
  salesOrderId: string;
  paymentMethodId: string | null;
  amount: number;
  paidAt: string;
  note: string | null;
  createdAt: string;
}

export interface SalesOrderStatusLogRecord {
  id: string;
  salesOrderId: string;
  fromStatus: SalesOrderStatus | null;
  toStatus: SalesOrderStatus;
  action: string;
  note: string | null;
  changedBy: string | null;
  createdAt: string;
}

/** Latest inventory issue linked to this order (sales fulfillment). */
export interface SalesOrderFulfillmentIssueSummary {
  id: string;
  issueNo: string;
  status: string;
  postedAt: string | null;
}

export interface SalesOrderDetailRecord {
  id: string;
  shopId: string;
  orderNo: string;
  salesChannel: string;
  orderType?: OrderType;
  deliveryStatus?: DeliveryStatus;
  shipperName?: string | null;
  orderedAt: string;
  customerId: string | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string | null;
  customerAddressSnapshot: string | null;
  employeeId: string | null;
  employeeNameSnapshot?: string | null;
  status: SalesOrderStatus;
  paymentStatus: SalesPaymentStatus;
  priceBookIdSnapshot: string | null;
  subtotalBeforeDiscount: number;
  orderDiscountType: string | null;
  orderDiscountValue: number | null;
  orderDiscountAmount: number;
  shippingFee: number;
  otherFee: number;
  totalAmount: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMargin: number;
  couponCodeSnapshot: string | null;
  notes: string | null;
  sentAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: SalesOrderItemRecord[];
  payments: SalesPaymentRecord[];
  statusLogs: SalesOrderStatusLogRecord[];
  fulfillmentIssue?: SalesOrderFulfillmentIssueSummary | null;
}

export interface SalesOrderBuilderData {
  mode: "canonical" | "legacy";
  products: MenuProduct[];
  combos: SalesComboOption[];
  priceBookId: string | null;
  priceBookName: string | null;
  customers: SalesOrderCustomerOption[];
  employees: SalesOrderEmployeeOption[];
  defaultEmployeeId: string | null;
}

export interface SalesQuickCustomerState {
  status: "idle" | "success" | "error";
  message: string;
  mode: "demo" | "live";
  customer: SalesOrderCustomerOption | null;
}

export interface SalesQuickEmployeeState {
  status: "idle" | "success" | "error";
  message: string;
  mode: "demo" | "live";
  employee: SalesOrderEmployeeOption | null;
}

export interface SalesOrderCustomerOption {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  note: string | null;
}

export interface SalesOrderEmployeeOption {
  id: string;
  employeeCode: string | null;
  fullName: string;
  phone: string | null;
  jobTitle: string | null;
}

export interface SalesComboComponentOption {
  productVariantId?: string;
  productName?: string;
  menuItemVariantId: string;
  menuItemName: string;
  variantLabel: string | null;
  weightGrams: number | null;
  quantity: number;
  unitSalePrice: number;
  unitCost: number;
  lineSaleTotal: number;
  lineCostTotal: number;
  displayText: string;
  sortOrder?: number;
}

export interface SalesComboOption {
  id: string;
  code: string | null;
  name: string;
  salePrice: number;
  defaultSalePrice: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  notes: string | null;
  isActive: boolean;
  updatedAt: string;
  components: SalesComboComponentOption[];
}

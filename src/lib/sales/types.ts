import type { MenuProduct } from "@/lib/admin/types";

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
  menuItemVariantId: string | null;
  legacyProductVariantId: string | null;
  priceBookItemIdSnapshot: string | null;
  itemNameSnapshot: string;
  variantLabelSnapshot: string | null;
  weightGramsSnapshot: number | null;
  quantity: number;
  unitPriceSnapshot: number;
  standardCostSnapshot: number;
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

export interface SalesOrderDetailRecord {
  id: string;
  shopId: string;
  orderNo: string;
  salesChannel: string;
  orderedAt: string;
  customerId: string | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string | null;
  customerAddressSnapshot: string | null;
  employeeId: string | null;
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
}

export interface SalesOrderBuilderData {
  mode: "canonical" | "legacy";
  products: MenuProduct[];
  priceBookId: string | null;
  priceBookName: string | null;
}

import type {
  DeliveryStatus,
  InventoryMovementType,
  OrderType,
  OrderStatus,
  PaymentStatus,
} from "@/lib/admin/types";

type PillTone =
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "info"
  | "accent";

const toneMap: Record<PillTone, string> = {
  success: "bg-emerald-100 text-emerald-700 ring-emerald-600/15",
  warning: "bg-amber-100 text-amber-700 ring-amber-600/15",
  danger: "bg-rose-100 text-rose-700 ring-rose-600/15",
  muted: "bg-slate-100 text-slate-600 ring-slate-500/10",
  info: "bg-sky-100 text-sky-700 ring-sky-600/15",
  accent: "bg-orange-100 text-orange-700 ring-orange-600/15",
};

export function statusTone(status: OrderStatus): PillTone {
  switch (status) {
    case "completed":
      return "success";
    case "confirmed":
      return "accent";
    case "sent":
      return "info";
    case "preparing":
      return "accent";
    case "ready":
      return "success";
    case "delivered":
      return "muted";
    case "draft":
      return "warning";
    case "cancelled":
      return "danger";
    default:
      return "muted";
  }
}

export function formatOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "draft":
      return "Bản nháp";
    case "sent":
      return "Đã gửi";
    case "confirmed":
      return "Đã xác nhận";
    case "preparing":
      return "Đang chuẩn bị";
    case "ready":
      return "Sẵn sàng";
    case "delivered":
      return "Đã giao";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

export function paymentStatusTone(status: PaymentStatus): PillTone {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "warning";
    case "refunded":
      return "info";
    case "void":
      return "muted";
    case "unpaid":
    default:
      return "danger";
  }
}

export function formatPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Đã thanh toán";
    case "partial":
      return "Thanh toán một phần";
    case "refunded":
      return "Đã hoàn tiền";
    case "void":
      return "Đã hủy";
    case "unpaid":
    default:
      return "Chưa thanh toán";
  }
}

export function deliveryStatusTone(status: DeliveryStatus): PillTone {
  switch (status) {
    case "delivered":
      return "success";
    case "pending":
    default:
      return "warning";
  }
}

export function formatDeliveryStatusLabel(status: DeliveryStatus) {
  switch (status) {
    case "delivered":
      return "Đã giao hàng";
    case "pending":
    default:
      return "Chưa giao hàng";
  }
}

export function orderTypeTone(type: OrderType): PillTone {
  switch (type) {
    case "ready_made":
      return "info";
    case "order":
    default:
      return "accent";
  }
}

export function formatOrderTypeLabel(type: OrderType) {
  switch (type) {
    case "ready_made":
      return "Hàng sẵn";
    case "order":
    default:
      return "Order";
  }
}

export function movementTone(type: InventoryMovementType): PillTone {
  switch (type) {
    case "purchase":
      return "success";
    case "adjustment":
      return "info";
    case "waste":
      return "danger";
    case "order_consumption":
      return "accent";
    default:
      return "muted";
  }
}

export function formatInventoryMovementTypeLabel(type: InventoryMovementType) {
  switch (type) {
    case "purchase":
      return "Nhập kho";
    case "adjustment":
      return "Điều chỉnh";
    case "waste":
      return "Hao hụt";
    case "order_consumption":
      return "Xuất cho đơn";
    default:
      return type;
  }
}

export function StatusPill({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: PillTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}

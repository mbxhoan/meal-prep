import type {
  InventoryMovementType,
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

export function StatusPill({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: PillTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}

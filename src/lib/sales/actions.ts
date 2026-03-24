"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { PermissionDeniedError, requirePermission } from "@/lib/rbac/server";
import type { ActionState, OrderPayload, OrderStatus } from "@/lib/admin/types";
import {
  createSalesOrderRecord,
  recordSalesPayment,
  refreshSalesOrderDraftPrices,
  updateSalesOrderStatus,
} from "@/lib/sales/service";
import { parseJsonField, toNumber, toNullableText } from "@/lib/sales/validation";

const demoSuccess = (message: string): ActionState => ({
  status: "success",
  message,
  mode: "demo",
});

const actionError = (
  message: string,
  mode: ActionState["mode"],
): ActionState => ({
  status: "error",
  message,
  mode,
});

function permissionForStatus(status: OrderStatus) {
  switch (status) {
    case "draft":
      return "sales.order.create";
    case "sent":
      return "sales.order.send";
    case "cancelled":
      return "sales.order.cancel";
    default:
      return "sales.order.confirm";
  }
}

export async function createSalesOrderAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: OrderPayload;

  try {
    payload = parseJsonField<OrderPayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu đơn hàng.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đơn hàng đã được mô phỏng trong demo mode.");
  }

  try {
    await requirePermission(permissionForStatus(payload.status));
    const result = await createSalesOrderRecord(payload);

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/orders/${result.orderId}`);

    redirect(`/admin/orders/${result.orderId}`);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền tạo hoặc gửi đơn này.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không tạo được đơn hàng.",
      "live",
    );
  }
}

export async function refreshSalesOrderPriceAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  type Payload = {
    orderId: string;
  };

  let payload: Payload;

  try {
    payload = parseJsonField<Payload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu refresh giá.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã refresh giá trong demo mode.");
  }

  try {
    await requirePermission("sales.order.refresh_price");
    await refreshSalesOrderDraftPrices(payload.orderId);

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${payload.orderId}`);

    redirect(`/admin/orders/${payload.orderId}`);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền refresh giá.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không refresh được giá.",
      "live",
    );
  }
}

export async function updateSalesOrderStatusAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  type Payload = {
    orderId: string;
    status: OrderStatus;
  };

  let payload: Payload;

  try {
    payload = parseJsonField<Payload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu trạng thái đơn.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã cập nhật trạng thái trong demo mode.");
  }

  try {
    await requirePermission(permissionForStatus(payload.status));
    await updateSalesOrderStatus(payload.orderId, payload.status);

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${payload.orderId}`);

    redirect(`/admin/orders/${payload.orderId}`);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền đổi trạng thái đơn.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không cập nhật được trạng thái.",
      "live",
    );
  }
}

export async function recordSalesPaymentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  type Payload = {
    orderId: string;
    amount: number;
    paymentMethodId: string | null;
    note: string | null;
  };

  let payload: Payload;

  try {
    payload = parseJsonField<Payload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu thanh toán.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã ghi nhận thanh toán trong demo mode.");
  }

  try {
    await requirePermission("sales.payment.record");
    await recordSalesPayment(payload.orderId, {
      amount: toNumber(payload.amount, 0),
      paymentMethodId: toNullableText(payload.paymentMethodId),
      note: toNullableText(payload.note),
    });

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${payload.orderId}`);

    redirect(`/admin/orders/${payload.orderId}`);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền ghi nhận thanh toán.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không ghi nhận được thanh toán.",
      "live",
    );
  }
}

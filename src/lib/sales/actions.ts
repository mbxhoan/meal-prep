"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { PermissionDeniedError, requirePermission } from "@/lib/rbac/server";
import { saveMasterDataRecord } from "@/lib/master-data/service";
import type { ActionState, OrderPayload, OrderStatus } from "@/lib/admin/types";
import type {
  SalesOrderCustomerOption,
  SalesOrderEmployeeOption,
  SalesQuickEmployeeState,
  SalesQuickCustomerState,
} from "@/lib/sales/types";
import {
  createSalesOrderRecord,
  recordSalesPayment,
  refreshSalesOrderDraftPrices,
  updateSalesOrderDeliveryStatus,
  updateSalesOrderStatus,
} from "@/lib/sales/service";
import { parseJsonField, toNumber, toNullableText, toText } from "@/lib/sales/validation";

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

function permissionForDeliveryStatus(deliveryStatus: "pending" | "delivered") {
  return deliveryStatus === "delivered"
    ? "sales.order.confirm"
    : "sales.order.update_draft";
}

const quickCustomerSuccess = (
  message: string,
  customer: SalesOrderCustomerOption,
  mode: SalesQuickCustomerState["mode"],
): SalesQuickCustomerState => ({
  status: "success",
  message,
  mode,
  customer,
});

const quickCustomerError = (
  message: string,
  mode: SalesQuickCustomerState["mode"],
): SalesQuickCustomerState => ({
  status: "error",
  message,
  mode,
  customer: null,
});

function generateQuickCustomerCode(name: string, phone: string | null) {
  const phoneDigits = (phone ?? "").replace(/\D/g, "").slice(-4);
  const nameSeed = toText(name)
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 3)
    .toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const prefix = phoneDigits.length > 0 ? phoneDigits : nameSeed || "NEW";

  return `KH-${prefix}-${stamp}`;
}

function generateQuickEmployeeCode(name: string, phone: string | null) {
  const phoneDigits = (phone ?? "").replace(/\D/g, "").slice(-4);
  const nameSeed = toText(name)
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 3)
    .toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const prefix = phoneDigits.length > 0 ? phoneDigits : nameSeed || "NEW";

  return `NV-${prefix}-${stamp}`;
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
    return demoSuccess("Đơn hàng đã được mô phỏng trong chế độ demo.");
  }

  try {
    await requirePermission("sales.order.create");
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

export async function quickCreateCustomerAction(
  _previousState: SalesQuickCustomerState,
  formData: FormData,
): Promise<SalesQuickCustomerState> {
  const name = toText(formData.get("customerName"));
  const phone = toNullableText(formData.get("customerPhone"));
  const address = toNullableText(formData.get("customerAddress"));
  const note = toNullableText(formData.get("customerQuickNote"));

  if (name.length === 0) {
    return quickCustomerError("Vui lòng nhập tên khách.", "demo");
  }

  const code = generateQuickCustomerCode(name, phone);

  if (!isSupabaseConfigured()) {
    return quickCustomerSuccess(
      "Đã thêm khách mới trong chế độ demo.",
      {
        id: `demo-customer-${Date.now().toString(36)}`,
        code,
        name,
        phone,
        address,
        note,
      },
      "demo",
    );
  }

  try {
    await requirePermission("master.customer.create");
    const customerId = await saveMasterDataRecord(
      "customers",
      {
        code,
        name,
        phone,
        address,
        note,
        is_active: true,
      },
      null,
    );

    revalidatePath("/admin/master-data");
    revalidatePath("/admin/master-data/customers");
    revalidatePath("/admin/orders/new");

    return quickCustomerSuccess(
      "Đã thêm khách mới.",
      {
        id: customerId,
        code,
        name,
        phone,
        address,
        note,
      },
      "live",
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return quickCustomerError("Bạn không có quyền thêm khách hàng.", "live");
    }

    return quickCustomerError(
      error instanceof Error ? error.message : "Không thêm được khách hàng.",
      "live",
    );
  }
}

const quickEmployeeSuccess = (
  message: string,
  employee: SalesOrderEmployeeOption,
  mode: SalesQuickEmployeeState["mode"],
): SalesQuickEmployeeState => ({
  status: "success",
  message,
  mode,
  employee,
});

const quickEmployeeError = (
  message: string,
  mode: SalesQuickEmployeeState["mode"],
): SalesQuickEmployeeState => ({
  status: "error",
  message,
  mode,
  employee: null,
});

export async function quickCreateEmployeeAction(
  _previousState: SalesQuickEmployeeState,
  formData: FormData,
): Promise<SalesQuickEmployeeState> {
  const name = toText(formData.get("employeeName"));
  const phone = toNullableText(formData.get("employeePhone"));
  const jobTitle = toNullableText(formData.get("employeeJobTitle"));

  if (name.length === 0) {
    return quickEmployeeError("Vui lòng nhập tên nhân viên.", "demo");
  }

  const code = generateQuickEmployeeCode(name, phone);

  if (!isSupabaseConfigured()) {
    return quickEmployeeSuccess(
      "Đã thêm nhân viên mới trong chế độ demo.",
      {
        id: `demo-employee-${Date.now().toString(36)}`,
        employeeCode: code,
        fullName: name,
        phone,
        jobTitle,
      },
      "demo",
    );
  }

  try {
    await requirePermission("master.employee.create");
    const employeeId = await saveMasterDataRecord(
      "employees",
      {
        employee_code: code,
        full_name: name,
        phone,
        job_title: jobTitle,
        is_active: true,
      },
      null,
    );

    revalidatePath("/admin/master-data");
    revalidatePath("/admin/master-data/employees");
    revalidatePath("/admin/orders/new");

    return quickEmployeeSuccess(
      "Đã thêm nhân viên mới.",
      {
        id: employeeId,
        employeeCode: code,
        fullName: name,
        phone,
        jobTitle,
      },
      "live",
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return quickEmployeeError("Bạn không có quyền thêm nhân viên.", "live");
    }

    return quickEmployeeError(
      error instanceof Error ? error.message : "Không thêm được nhân viên.",
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
    return actionError("Không đọc được dữ liệu làm mới giá.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã làm mới giá trong chế độ demo.");
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
      return actionError("Bạn không có quyền làm mới giá.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không làm mới được giá.",
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
    return demoSuccess("Đã cập nhật trạng thái trong chế độ demo.");
  }

  try {
    await requirePermission(permissionForStatus(payload.status));
    await updateSalesOrderStatus(payload.orderId, payload.status);

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
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

export async function updateSalesOrderDeliveryStatusAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  type Payload = {
    orderId: string;
    deliveryStatus: "pending" | "delivered";
  };

  let payload: Payload;

  try {
    payload = parseJsonField<Payload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu giao hàng.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã cập nhật trạng thái giao hàng trong chế độ demo.");
  }

  try {
    await requirePermission(permissionForDeliveryStatus(payload.deliveryStatus));
    await updateSalesOrderDeliveryStatus(payload.orderId, payload.deliveryStatus);

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${payload.orderId}`);

    redirect(`/admin/orders/${payload.orderId}`);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền đổi trạng thái giao hàng.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không cập nhật được giao hàng.",
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
    return demoSuccess("Đã ghi nhận thanh toán trong chế độ demo.");
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

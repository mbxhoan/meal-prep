"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/types";
import { PermissionDeniedError, requirePermission } from "@/lib/rbac/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  postInventoryIssue,
  postInventoryReceipt,
  saveInventoryIssueDraft,
  saveInventoryReceiptDraft,
} from "@/lib/inventory/service";
import type {
  InventoryIssueSavePayload,
  InventoryReceiptSavePayload,
} from "@/lib/inventory/types";

const demoSuccess = (message: string): ActionState => ({
  status: "success",
  message,
  mode: "demo",
});

const liveSuccess = (message: string): ActionState => ({
  status: "success",
  message,
  mode: "live",
});

const actionError = (message: string, mode: ActionState["mode"]): ActionState => ({
  status: "error",
  message,
  mode,
});

function parseJsonField<T>(formData: FormData, key: string) {
  const raw = formData.get(key);

  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Missing ${key}`);
  }

  return JSON.parse(raw) as T;
}

export async function saveInventoryReceiptAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: InventoryReceiptSavePayload;

  try {
    payload = parseJsonField<InventoryReceiptSavePayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu phiếu nhập.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã lưu phiếu nhập trong demo mode.");
  }

  try {
    await requirePermission("inventory.receipt.create");

    if (payload.postImmediately) {
      await requirePermission("inventory.receipt.post");
    }

    await saveInventoryReceiptDraft(payload);

    revalidatePath("/admin/inventory");

    return liveSuccess(
      payload.postImmediately
        ? `Đã nhập kho và post phiếu ${payload.receiptNo}.`
        : `Đã lưu nháp phiếu ${payload.receiptNo}.`,
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền thực hiện thao tác này.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không lưu được phiếu nhập.",
      "live",
    );
  }
}

export async function postInventoryReceiptAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  type Payload = { receiptId: string; receiptNo?: string };

  let payload: Payload;

  try {
    payload = parseJsonField<Payload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu post phiếu nhập.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã post phiếu nhập trong demo mode.");
  }

  try {
    await requirePermission("inventory.receipt.post");
    await postInventoryReceipt(payload.receiptId);
    revalidatePath("/admin/inventory");
    return liveSuccess(
      payload.receiptNo
        ? `Đã post phiếu ${payload.receiptNo}.`
        : "Đã post phiếu nhập.",
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền post phiếu nhập.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không post được phiếu nhập.",
      "live",
    );
  }
}

export async function saveInventoryIssueAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: InventoryIssueSavePayload;

  try {
    payload = parseJsonField<InventoryIssueSavePayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu phiếu xuất.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã lưu phiếu xuất trong demo mode.");
  }

  try {
    await requirePermission("inventory.issue.create");

    if (payload.postImmediately) {
      await requirePermission("inventory.issue.post");
    }

    await saveInventoryIssueDraft(payload);
    revalidatePath("/admin/inventory");

    return liveSuccess(
      payload.postImmediately
        ? `Đã xuất kho và post phiếu ${payload.issueNo}.`
        : `Đã lưu nháp phiếu ${payload.issueNo}.`,
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền thực hiện thao tác này.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không lưu được phiếu xuất.",
      "live",
    );
  }
}

export async function postInventoryIssueAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  type Payload = { issueId: string; issueNo?: string };

  let payload: Payload;

  try {
    payload = parseJsonField<Payload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu post phiếu xuất.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã post phiếu xuất trong demo mode.");
  }

  try {
    await requirePermission("inventory.issue.post");
    await postInventoryIssue(payload.issueId);
    revalidatePath("/admin/inventory");
    return liveSuccess(
      payload.issueNo
        ? `Đã post phiếu ${payload.issueNo}.`
        : "Đã post phiếu xuất.",
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền post phiếu xuất.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không post được phiếu xuất.",
      "live",
    );
  }
}

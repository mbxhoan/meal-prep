"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { PermissionDeniedError, requirePermission } from "@/lib/rbac/server";
import type { ActionState } from "@/lib/admin/types";
import {
  getMasterDataEntityConfig,
  saveMasterDataRecord,
  deleteMasterDataRecord,
} from "@/lib/master-data/service";
import type { MasterDataEntityKey } from "@/lib/master-data/types";

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

type MasterDataPayload = {
  entity: MasterDataEntityKey;
  recordId?: string | null;
  values?: Record<string, unknown>;
};

export async function saveMasterDataAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: MasterDataPayload;

  try {
    payload = parseJsonField<MasterDataPayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu master data.", "demo");
  }

  const config = getMasterDataEntityConfig(payload.entity);
  const permission = payload.recordId
    ? config.permissions.update
    : config.permissions.create;

  if (!isSupabaseConfigured()) {
    return demoSuccess(`Đã lưu ${config.title.toLowerCase()} trong demo mode.`);
  }

  try {
    await requirePermission(permission);
    await saveMasterDataRecord(payload.entity, payload.values ?? {}, payload.recordId);
    revalidatePath("/admin/master-data");
    revalidatePath(`/admin/master-data/${payload.entity}`);
    return liveSuccess(`Đã lưu ${config.title.toLowerCase()}.`);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền thực hiện thao tác này.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không lưu được dữ liệu.",
      "live",
    );
  }
}

export async function deleteMasterDataAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: MasterDataPayload;

  try {
    payload = parseJsonField<MasterDataPayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu xoá.", "demo");
  }

  if (!payload.recordId) {
    return actionError("Thiếu recordId.", "demo");
  }

  const config = getMasterDataEntityConfig(payload.entity);

  if (!isSupabaseConfigured()) {
    return demoSuccess(`Đã xoá ${config.title.toLowerCase()} trong demo mode.`);
  }

  try {
    await requirePermission(config.permissions.delete);
    await deleteMasterDataRecord(payload.entity, payload.recordId);
    revalidatePath("/admin/master-data");
    revalidatePath(`/admin/master-data/${payload.entity}`);
    return liveSuccess(`Đã xoá ${config.title.toLowerCase()}.`);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền xoá dữ liệu này.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không xoá được dữ liệu.",
      "live",
    );
  }
}

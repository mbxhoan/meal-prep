"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { PermissionDeniedError, requirePermission } from "@/lib/rbac/server";
import type { ActionReference, ActionState } from "@/lib/admin/types";
import {
  getMasterDataEntityConfig,
  getMasterDataDeleteImpact,
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

const actionErrorWithReferences = (
  message: string,
  mode: ActionState["mode"],
  references: ActionReference[] = [],
): ActionState => ({
  status: "error",
  message,
  mode,
  references,
});

function parseJsonField<T>(formData: FormData, key: string) {
  const raw = formData.get(key);

  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Missing ${key}`);
  }

  return JSON.parse(raw) as T;
}

function revalidateComboPaths(entity: MasterDataEntityKey) {
  revalidatePath("/admin/master-data");
  revalidatePath(`/admin/master-data/${entity}`);
  if (entity === "combos" || entity === "combo_items") {
    revalidatePath("/admin/master-data/combos");
  }
  if (entity === "categories" || entity === "combos" || entity === "combo_items") {
    revalidatePath("/admin/menu");
    revalidatePath("/admin/menu/new");
    revalidatePath("/admin/orders/new");
    revalidatePath("/menu");
  }
}

type MasterDataPayload = {
  entity: MasterDataEntityKey;
  recordId?: string | null;
  values?: Record<string, unknown>;
};

type ComboItemPayload = {
  recordId?: string | null;
  productVariantId: string;
  menuItemVariantId: string;
  quantity: number | string;
  sortOrder: number | string;
  notes: string;
  isActive: boolean;
};

function normalizeComboItemPayloads(rawItems: unknown): ComboItemPayload[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      recordId: item.recordId == null ? null : String(item.recordId),
      productVariantId: String(item.productVariantId ?? "").trim(),
      menuItemVariantId: String(item.menuItemVariantId ?? "").trim(),
      quantity:
        item.quantity == null ? 1 : (item.quantity as string | number),
      sortOrder:
        item.sortOrder == null ? 0 : (item.sortOrder as string | number),
      notes: String(item.notes ?? ""),
      isActive: item.isActive !== false,
    }))
    .filter(
      (item) =>
        item.productVariantId.length > 0 || item.menuItemVariantId.length > 0,
    );
}

async function saveComboItemPayloads(
  comboId: string,
  items: ComboItemPayload[],
) {
  const seenVariants = new Set<string>();

  for (const item of items) {
    const resolvedVariantId =
      item.productVariantId.length > 0
        ? item.productVariantId
        : item.menuItemVariantId;

    if (seenVariants.has(resolvedVariantId)) {
      throw new Error("Một món không thể xuất hiện 2 lần trong cùng combo.");
    }
    seenVariants.add(resolvedVariantId);

    await saveMasterDataRecord(
      "combo_items",
      {
        combo_id: comboId,
        product_variant_id:
          item.productVariantId.length > 0 ? item.productVariantId : null,
        menu_item_variant_id:
          item.productVariantId.length > 0 ? null : item.menuItemVariantId,
        quantity: item.quantity,
        sort_order: item.sortOrder,
        notes: item.notes,
        is_active: item.isActive,
      },
      item.recordId ?? undefined,
    );
  }
}

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
    return demoSuccess(`Đã lưu ${config.title.toLowerCase()} trong chế độ demo.`);
  }

  try {
    await requirePermission(permission);
    const savedRecordId = await saveMasterDataRecord(
      payload.entity,
      payload.values ?? {},
      payload.recordId,
    );

    if (payload.entity === "combos") {
      const comboItems = normalizeComboItemPayloads(
        payload.values?.comboItems ?? payload.values?.combo_items,
      );

      if (comboItems.length > 0) {
        await saveComboItemPayloads(savedRecordId, comboItems);
      }
    }

    revalidateComboPaths(payload.entity);
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

type ComboItemBatchPayload = {
  comboId: string;
  items: ComboItemPayload[];
};

export async function saveComboItemsBatchAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: ComboItemBatchPayload;

  try {
    payload = parseJsonField<ComboItemBatchPayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu combo.", "demo");
  }

  const comboId = String(payload.comboId ?? "").trim();
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!comboId) {
    return actionError("Thiếu combo đang chỉnh.", "demo");
  }

  if (items.length === 0) {
    return actionError("Chưa có dòng nào để thêm.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess(`Đã chuẩn bị ${items.length} dòng chi tiết combo trong chế độ demo.`);
  }

  try {
    const config = getMasterDataEntityConfig("combo_items");
    await requirePermission(config.permissions.create);
    await saveComboItemPayloads(comboId, items);

    revalidateComboPaths("combo_items");
    return liveSuccess(`Đã thêm ${items.length} dòng vào combo.`);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền thêm chi tiết combo.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không lưu được chi tiết combo.",
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
    return demoSuccess(`Đã xoá ${config.title.toLowerCase()} trong chế độ demo.`);
  }

  try {
    await requirePermission(config.permissions.delete);

    const impact = await getMasterDataDeleteImpact(payload.entity, payload.recordId);

    if (impact.blocked) {
      return actionErrorWithReferences(
        impact.message ?? `Không thể xoá ${config.title.toLowerCase()} này.`,
        "live",
        impact.references,
      );
    }

    await deleteMasterDataRecord(payload.entity, payload.recordId);
    revalidatePath("/admin/master-data");
    revalidatePath(`/admin/master-data/${payload.entity}`);
    if (payload.entity === "categories" || payload.entity === "combos" || payload.entity === "combo_items") {
      revalidatePath("/admin/menu");
      revalidatePath("/admin/menu/new");
      revalidatePath("/admin/orders/new");
      revalidatePath("/menu");
    }
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

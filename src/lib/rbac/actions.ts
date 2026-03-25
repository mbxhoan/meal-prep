"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/admin/types";
import type { AssignRolePayload } from "@/lib/rbac/types";
import { PermissionDeniedError, requirePermission } from "@/lib/rbac/server";
import { ROLE_DEFINITIONS } from "@/lib/rbac/constants";

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

export async function assignUserShopRoleAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let payload: AssignRolePayload;

  try {
    payload = parseJsonField<AssignRolePayload>(formData, "payload");
  } catch {
    return actionError("Không đọc được dữ liệu phân quyền.", "demo");
  }

  if (!isSupabaseConfigured()) {
    return demoSuccess("Đã mô phỏng phân quyền trong chế độ demo.");
  }

  try {
    await requirePermission("system.user.assign_role");
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return demoSuccess("Supabase chưa sẵn sàng, đang giữ ở chế độ demo.");
    }

    const { error } = await supabase.rpc("assign_user_shop_role", {
      p_user_id: payload.userId,
      p_shop_id: payload.shopId,
      p_role_code: payload.roleCode,
      p_is_primary: payload.isPrimary,
    });

    if (error) {
      return actionError(error.message, "live");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/settings/roles");

    return liveSuccess(
      `Đã gán role ${ROLE_DEFINITIONS[payload.roleCode].label} cho user.`,
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return actionError("Bạn không có quyền gán role.", "live");
    }

    return actionError(
      error instanceof Error ? error.message : "Không gán được role.",
      "live",
    );
  }
}

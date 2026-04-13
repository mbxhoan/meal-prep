"use client";

import { useActionState, useState } from "react";
import { assignUserShopRoleAction } from "@/lib/rbac/actions";
import {
  PROFILE_ROLE_LABELS,
  ROLE_OPTIONS,
  type RoleCode,
} from "@/lib/rbac/constants";
import type { RoleAssignmentDirectory } from "@/lib/rbac/types";
import type { ActionState } from "@/lib/admin/types";
import { StatusPill } from "@/features/admin/components/StatusPill";
import { StickyFormFooter } from "@/features/admin/components/form-ux";

const initialState: ActionState = {
  status: "idle",
  message: "",
  mode: "live",
};

function formatAssignmentLabel(shopName: string, roleLabel: string) {
  return `${shopName} · ${roleLabel}`;
}

export function RoleAssignmentForm({
  directory,
}: {
  directory: RoleAssignmentDirectory | null;
}) {
  const [state, action, pending] = useActionState(
    assignUserShopRoleAction,
    initialState,
  );
  const [selectedUserId, setSelectedUserId] = useState(
    directory?.users[0]?.id ?? "",
  );
  const [selectedRoleCode, setSelectedRoleCode] = useState<RoleCode>(
    "shop_admin",
  );
  const [selectedShopId, setSelectedShopId] = useState(
    directory?.shops[0]?.id ?? "",
  );
  const [isPrimary, setIsPrimary] = useState(true);
  const selectedRoleLabel =
    ROLE_OPTIONS.find((option) => option.code === selectedRoleCode)?.label ??
    selectedRoleCode;

  const canPickShop = selectedRoleCode !== "system_admin";
  const payload = JSON.stringify({
    userId: selectedUserId,
    shopId: canPickShop ? selectedShopId || null : null,
    roleCode: selectedRoleCode,
    isPrimary,
  });

  if (!directory) {
    return (
      <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Quản lý phân quyền
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          Chưa có Supabase
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Bật Supabase rồi quay lại để gán vai trò.
        </p>
      </div>
    );
  }

  const selectedUser = directory.users.find((user) => user.id === selectedUserId);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Gán phân quyền
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Gán vai trò</h2>
          </div>
          <StatusPill label={selectedRoleLabel} tone="accent" />
        </div>

        <form action={action} className="mt-6 space-y-4 pb-36">
          <input type="hidden" name="payload" value={payload} />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Người dùng
            </span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            >
              {directory.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName ?? user.email ?? user.id}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Vai trò
            </span>
            <select
              value={selectedRoleCode}
              onChange={(event) => setSelectedRoleCode(event.target.value as RoleCode)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Cửa hàng
            </span>
            <select
              value={selectedShopId}
              onChange={(event) => setSelectedShopId(event.target.value)}
              disabled={!canPickShop}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {directory.shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              {canPickShop
                ? "Vai trò shop theo cửa hàng đã chọn."
                : "Quản trị hệ thống không cần chọn shop."}
            </p>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) => setIsPrimary(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#18352d] focus:ring-[#18352d]"
            />
            <span>Đặt làm vai trò chính</span>
          </label>

          {selectedUser ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">
                {selectedUser.fullName ?? selectedUser.email ?? "Người dùng"}
              </p>
              <p className="mt-1">
                {selectedUser.employee ? `NV: ${selectedUser.employee.fullName}` : "Chưa có hồ sơ NV."}
              </p>
              <p className="mt-1">Vai trò: {PROFILE_ROLE_LABELS[selectedUser.profileRole]}</p>
            </div>
          ) : null}

          <StickyFormFooter
            note="Lưu để áp dụng vai trò ngay."
            message={state.status !== "idle" ? state.message : undefined}
            messageTone={state.status === "success" ? "success" : "danger"}
            submitLabel="Gán vai trò"
            pendingLabel="Đang lưu..."
            pending={pending}
            disabled={!selectedUserId}
          />
        </form>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Danh bạ
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Danh bạ user</h2>
        <div className="mt-5 space-y-3">
          {directory.users.map((user) => (
            <div
              key={user.id}
              className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {user.fullName ?? user.email ?? "Người dùng"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {user.email ?? "Chưa có email"} ·{" "}
                    {PROFILE_ROLE_LABELS[user.profileRole]}
                  </p>
                </div>
                <StatusPill
                  label={user.assignments.length > 0 ? "Đã gán" : "Chưa có vai trò"}
                  tone={user.assignments.length > 0 ? "success" : "warning"}
                />
              </div>

              <div className="mt-3 space-y-2">
                {user.assignments.length > 0 ? (
                  user.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white bg-white px-4 py-3 text-sm"
                    >
                      <span className="text-slate-700">
                        {formatAssignmentLabel(
                          assignment.shopName,
                          assignment.roleLabel,
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {assignment.isPrimary ? (
                          <StatusPill label="Chính" tone="accent" />
                        ) : null}
                        <StatusPill
                          label={assignment.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                          tone={assignment.isActive ? "success" : "muted"}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    Chưa có bản ghi gán vai trò nào.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

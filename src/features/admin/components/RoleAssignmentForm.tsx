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
          Role management
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Chưa có Supabase để quản lý phân quyền
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          Bật môi trường Supabase rồi quay lại màn này để gán role cho user theo
          shop.
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
              Role assignment
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Gán role cho user
            </h2>
          </div>
          <StatusPill label={selectedRoleLabel} tone="accent" />
        </div>

        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="payload" value={payload} />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              User
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
              Role
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
              Shop
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
                ? "Shop role sẽ được gán theo shop đã chọn."
                : "system_admin là quyền global, nên shop sẽ được bỏ qua."}
            </p>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) => setIsPrimary(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#18352d] focus:ring-[#18352d]"
            />
            <span>Đặt làm role chính</span>
          </label>

          {selectedUser ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">
                {selectedUser.fullName ?? selectedUser.email ?? "User"}
              </p>
              <p className="mt-1">
                {selectedUser.employee
                  ? `Employee: ${selectedUser.employee.fullName}`
                  : "Chưa có employee profile."}
              </p>
              <p className="mt-1">
                Role hiện tại: {PROFILE_ROLE_LABELS[selectedUser.profileRole]}
              </p>
            </div>
          ) : null}

          {state.message ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                state.status === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending || !selectedUserId}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Đang lưu..." : "Gán role"}
          </button>
        </form>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Directory
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          User và assignment hiện tại
        </h2>
        <div className="mt-5 space-y-3">
          {directory.users.map((user) => (
            <div
              key={user.id}
              className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {user.fullName ?? user.email ?? user.id}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {user.email ?? "No email"} ·{" "}
                    {PROFILE_ROLE_LABELS[user.profileRole]}
                  </p>
                </div>
                <StatusPill
                  label={user.assignments.length > 0 ? "Assigned" : "No role"}
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
                          <StatusPill label="Primary" tone="accent" />
                        ) : null}
                        <StatusPill
                          label={assignment.isActive ? "Active" : "Inactive"}
                          tone={assignment.isActive ? "success" : "muted"}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    Chưa có user_shop_role nào.
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

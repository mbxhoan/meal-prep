import { cache } from "react";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  PROFILE_ROLE_CODES,
  RBAC_PERMISSION_CODES,
  ROLE_OPTIONS,
  ROLE_PRIORITY,
  type PermissionCode,
  type ProfileRoleCode,
  type RoleCode,
} from "@/lib/rbac/constants";
import type {
  EmployeeRecord,
  PermissionDefinitionRecord,
  RbacAccessContext,
  RoleAssignmentDirectory,
  RoleDefinitionRecord,
  ShopContext,
  UserShopRoleRecord,
} from "@/lib/rbac/types";

class PermissionDeniedError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

function safeString(value: unknown, fallback = "") {
  return value == null ? fallback : String(value);
}

function safeBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function toProfileRoleCode(value: unknown): ProfileRoleCode {
  const candidate = safeString(value, "viewer") as ProfileRoleCode;

  return PROFILE_ROLE_CODES.includes(candidate)
    ? candidate
    : "viewer";
}

function toRoleCode(value: unknown): RoleCode {
  const candidate = safeString(value, "employee") as RoleCode;

  return (ROLE_OPTIONS.find((option) => option.code === candidate)?.code ??
    "employee") as RoleCode;
}

function normalizeShop(row: Record<string, unknown>): ShopContext {
  return {
    id: safeString(row.id),
    code: safeString(row.code),
    slug: safeString(row.slug),
    name: safeString(row.name),
    address: row.address == null ? null : safeString(row.address),
    phone: row.phone == null ? null : safeString(row.phone),
    timezone: safeString(row.timezone, "Asia/Ho_Chi_Minh"),
    currencyCode: safeString(row.currency_code, "VND"),
    isDefault: safeBoolean(row.is_default),
    isActive: safeBoolean(row.is_active, true),
  };
}

function normalizeEmployee(row: Record<string, unknown>): EmployeeRecord {
  return {
    id: safeString(row.id),
    userId: safeString(row.user_id),
    primaryShopId:
      row.primary_shop_id == null ? null : safeString(row.primary_shop_id),
    employeeCode:
      row.employee_code == null ? null : safeString(row.employee_code),
    fullName: safeString(row.full_name),
    email: row.email == null ? null : safeString(row.email),
    phone: row.phone == null ? null : safeString(row.phone),
    jobTitle: row.job_title == null ? null : safeString(row.job_title),
    isActive: safeBoolean(row.is_active, true),
    notes: row.notes == null ? null : safeString(row.notes),
    updatedAt: safeString(row.updated_at, new Date().toISOString()),
  };
}

function normalizeRoleAssignment(row: Record<string, unknown>): UserShopRoleRecord {
  const role =
    row.roles && typeof row.roles === "object" && !Array.isArray(row.roles)
      ? (row.roles as Record<string, unknown>)
      : {};
  const shop =
    row.shops && typeof row.shops === "object" && !Array.isArray(row.shops)
      ? (row.shops as Record<string, unknown>)
      : {};

  return {
    id: safeString(row.id),
    userId: safeString(row.user_id),
    shopId: row.shop_id == null ? null : safeString(row.shop_id),
    roleId: safeString(row.role_id),
    roleCode: toRoleCode(role.code),
    roleLabel: safeString(role.name, "Role"),
    roleScope:
      role.scope === "global" || role.scope === "shop"
        ? role.scope
        : "shop",
    shopName:
      row.shop_id == null ? "Tất cả shop" : safeString(shop.name, "Shop"),
    shopCode: row.shop_id == null ? "GLOBAL" : safeString(shop.code, "SHOP"),
    isPrimary: safeBoolean(row.is_primary),
    isActive: safeBoolean(row.is_active, true),
    assignedAt: safeString(row.assigned_at, new Date().toISOString()),
    assignedByUserId:
      row.assigned_by == null ? null : safeString(row.assigned_by),
  };
}

function normalizeRoleDefinition(row: Record<string, unknown>): RoleDefinitionRecord {
  return {
    id: safeString(row.id),
    code: toRoleCode(row.code),
    label: safeString(row.name, "Role"),
    scope: row.scope === "global" ? "global" : "shop",
    description: row.description == null ? null : safeString(row.description),
    isSystem: safeBoolean(row.is_system),
    permissionCodes: [],
  };
}

function normalizePermissionDefinition(
  row: Record<string, unknown>,
): PermissionDefinitionRecord {
  return {
    id: safeString(row.id),
    code: safeString(row.code, "master.menu.read") as PermissionCode,
    label: safeString(row.name, "Permission"),
    module: safeString(row.module, "general"),
    description: row.description == null ? null : safeString(row.description),
  };
}

function resolvePrimaryRole(
  assignments: UserShopRoleRecord[],
  profileRole: ProfileRoleCode,
): ProfileRoleCode {
  if (profileRole === "system_admin") {
    return profileRole;
  }

  for (const roleCode of ROLE_PRIORITY) {
    if (assignments.some((assignment) => assignment.roleCode === roleCode)) {
      return roleCode;
    }
  }

  return profileRole;
}

function resolveActiveShop(
  assignments: UserShopRoleRecord[],
  shops: ShopContext[],
  employee: EmployeeRecord | null,
): ShopContext | null {
  const primaryAssignment =
    assignments.find((assignment) => assignment.isPrimary && assignment.isActive) ??
    assignments.find((assignment) => assignment.isActive);

  if (primaryAssignment) {
    return (
      shops.find((shop) => shop.id === primaryAssignment.shopId) ??
      null
    );
  }

  if (employee?.primaryShopId) {
    return shops.find((shop) => shop.id === employee.primaryShopId) ?? null;
  }

  return shops.find((shop) => shop.isDefault) ?? shops[0] ?? null;
}

function buildPermissions(
  activeShop: ShopContext | null,
  assignments: UserShopRoleRecord[],
  profileRole: ProfileRoleCode,
  permissions: PermissionDefinitionRecord[],
  rolePermissionRows: Array<{ role_id: string; permission_id: string }>,
): PermissionCode[] {
  const systemAdmin =
    profileRole === "system_admin" ||
    assignments.some((assignment) => assignment.roleCode === "system_admin");

  if (systemAdmin) {
    return [...RBAC_PERMISSION_CODES];
  }

  const activeAssignment =
    activeShop == null
      ? assignments.find((assignment) => assignment.isPrimary)
      : assignments.find(
          (assignment) => assignment.shopId === activeShop.id && assignment.isActive,
        ) ?? assignments.find((assignment) => assignment.isActive);

  if (!activeAssignment) {
    return [];
  }

  const permissionMap = new Map<PermissionCode, PermissionCode>();
  const permissionById = new Map(
    permissions.map((permission) => [permission.id, permission.code]),
  );
  const roleIds = new Set([activeAssignment.roleId]);

  for (const row of rolePermissionRows) {
    if (!roleIds.has(row.role_id)) {
      continue;
    }

    const code = permissionById.get(row.permission_id);
    if (code) {
      permissionMap.set(code, code);
    }
  }

  return [...permissionMap.keys()];
}

export const getRbacAccessContext = cache(async (): Promise<RbacAccessContext | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [
    profileResponse,
    employeeResponse,
    assignmentsResponse,
    permissionsResponse,
    rolePermissionsResponse,
    shopsResponse,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("employees")
      .select(
        "id, user_id, primary_shop_id, employee_code, full_name, email, phone, job_title, is_active, notes, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_shop_roles")
      .select(
        "id, user_id, shop_id, role_id, is_primary, is_active, assigned_at, assigned_by, roles(code, name, scope, is_system), shops(id, code, slug, name, address, phone, timezone, currency_code, is_default, is_active)",
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("assigned_at", { ascending: true }),
    supabase
      .from("permissions")
      .select("id, code, name, module, description")
      .order("module", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase.from("role_permissions").select("role_id, permission_id"),
    supabase
      .from("shops")
      .select("id, code, slug, name, address, phone, timezone, currency_code, is_default, is_active")
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  if (
    profileResponse.error ||
    employeeResponse.error ||
    assignmentsResponse.error ||
    permissionsResponse.error ||
    rolePermissionsResponse.error ||
    shopsResponse.error
  ) {
    return null;
  }

  const profileRole = toProfileRoleCode(
    (profileResponse.data as Record<string, unknown> | null)?.role,
  );
  const assignments = (assignmentsResponse.data ?? []).map((row) =>
    normalizeRoleAssignment(row as Record<string, unknown>),
  );
  const employee = employeeResponse.data
    ? normalizeEmployee(employeeResponse.data as Record<string, unknown>)
    : null;
  const accessibleShops = (shopsResponse.data ?? []).map((row) =>
    normalizeShop(row as Record<string, unknown>),
  );
  const activeShop = resolveActiveShop(assignments, accessibleShops, employee);
  const permissions = buildPermissions(
    activeShop,
    assignments,
    profileRole,
    (permissionsResponse.data ?? []).map((row) =>
      normalizePermissionDefinition(row as Record<string, unknown>),
    ),
    (rolePermissionsResponse.data ?? []).map((row) => ({
      role_id: safeString(row.role_id),
      permission_id: safeString(row.permission_id),
    })),
  );

  return {
    userId: user.id,
    email:
      (profileResponse.data as Record<string, unknown> | null)?.email == null
        ? user.email ?? null
        : safeString((profileResponse.data as Record<string, unknown>).email),
    fullName:
      (profileResponse.data as Record<string, unknown> | null)?.full_name == null
        ? null
        : safeString((profileResponse.data as Record<string, unknown>).full_name),
    avatarUrl:
      (profileResponse.data as Record<string, unknown> | null)?.avatar_url == null
        ? null
        : safeString((profileResponse.data as Record<string, unknown>).avatar_url),
    profileRole: toProfileRoleCode(
      (profileResponse.data as Record<string, unknown> | null)?.role,
    ),
    primaryRole: resolvePrimaryRole(
      assignments,
      profileRole,
    ),
    permissions,
    activeShop,
    shops: accessibleShops,
    assignments,
    employee,
    canAccessPanel: profileRole === "system_admin" || assignments.length > 0,
    canManageRoles: permissions.includes("system.user.assign_role"),
  };
});

export async function getRbacDirectory(): Promise<RoleAssignmentDirectory | null> {
  const context = await getRbacAccessContext();

  if (!context) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [profilesResponse, employeesResponse, allAssignmentsResponse, rolesResponse, permissionsResponse, rolePermissionsResponse] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role")
        .order("updated_at", { ascending: false }),
      supabase
        .from("employees")
        .select(
          "id, user_id, primary_shop_id, employee_code, full_name, email, phone, job_title, is_active, notes, updated_at",
        )
        .order("updated_at", { ascending: false }),
      supabase
        .from("user_shop_roles")
        .select(
          "id, user_id, shop_id, role_id, is_primary, is_active, assigned_at, assigned_by, roles(code, name, scope, is_system), shops(id, code, slug, name, address, phone, timezone, currency_code, is_default, is_active)",
        )
        .order("assigned_at", { ascending: false }),
      supabase
        .from("roles")
        .select("id, code, name, scope, description, is_system, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("permissions")
        .select("id, code, name, module, description")
        .order("module", { ascending: true })
        .order("sort_order", { ascending: true }),
      supabase.from("role_permissions").select("role_id, permission_id"),
    ]);

  if (
    profilesResponse.error ||
    employeesResponse.error ||
    allAssignmentsResponse.error ||
    rolesResponse.error ||
    permissionsResponse.error ||
    rolePermissionsResponse.error
  ) {
    return null;
  }

  const shops = context.shops;
  const roles = (rolesResponse.data ?? []).map((row) =>
    normalizeRoleDefinition(row as Record<string, unknown>),
  );
  const permissions = (permissionsResponse.data ?? []).map((row) =>
    normalizePermissionDefinition(row as Record<string, unknown>),
  );
  const rolePermissionRows = (rolePermissionsResponse.data ?? []).map((row) => ({
    role_id: safeString(row.role_id),
    permission_id: safeString(row.permission_id),
  }));
  const permissionById = new Map(
    permissions.map((permission) => [permission.id, permission.code]),
  );
  const permissionsByRoleId = new Map<string, PermissionCode[]>();

  for (const rolePermission of rolePermissionRows) {
    const permissionCode = permissionById.get(rolePermission.permission_id);
    if (!permissionCode) {
      continue;
    }

    const current = permissionsByRoleId.get(rolePermission.role_id) ?? [];
    current.push(permissionCode);
    permissionsByRoleId.set(rolePermission.role_id, current);
  }

  const rolesWithPermissions = roles.map((role) => ({
    ...role,
    permissionCodes: permissionsByRoleId.get(role.id) ?? [],
  }));

  const assignments = (allAssignmentsResponse.data ?? []).map((row) =>
    normalizeRoleAssignment(row as Record<string, unknown>),
  );
  const employees = new Map(
    (employeesResponse.data ?? []).map((row) => {
      const employee = normalizeEmployee(row as Record<string, unknown>);
      return [employee.userId, employee] as const;
    }),
  );

  const users = (profilesResponse.data ?? []).map((row) => {
    const profile = row as Record<string, unknown>;
    const userId = safeString(profile.id);

    return {
      id: userId,
      email: profile.email == null ? null : safeString(profile.email),
      fullName: profile.full_name == null ? null : safeString(profile.full_name),
      avatarUrl:
        profile.avatar_url == null ? null : safeString(profile.avatar_url),
      profileRole: toProfileRoleCode(profile.role),
      employee: employees.get(userId) ?? null,
      assignments: assignments.filter((assignment) => assignment.userId === userId),
    };
  });

  return {
    shops,
    roles: rolesWithPermissions,
    permissions: permissions.map((permission) => ({
      ...permission,
      label: permission.label,
    })),
    users,
  };
}

export function hasPermission(
  context: RbacAccessContext | null,
  permissionCode: PermissionCode,
) {
  return Boolean(context?.permissions.includes(permissionCode));
}

export async function requirePermission(permissionCode: PermissionCode) {
  const context = await getRbacAccessContext();

  if (!context) {
    throw new PermissionDeniedError();
  }

  if (!context.permissions.includes(permissionCode)) {
    throw new PermissionDeniedError();
  }

  return context;
}

export async function requireAdminAccess() {
  const context = await getRbacAccessContext();

  if (!context || !context.canAccessPanel) {
    throw new PermissionDeniedError();
  }

  return context;
}

export { PermissionDeniedError };

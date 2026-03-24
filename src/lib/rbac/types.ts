import type { PermissionCode, RoleCode, ProfileRoleCode } from "@/lib/rbac/constants";

export interface ShopContext {
  id: string;
  code: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
  timezone: string;
  currencyCode: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface RoleDefinitionRecord {
  id: string;
  code: RoleCode;
  label: string;
  scope: "global" | "shop";
  description: string | null;
  isSystem: boolean;
  permissionCodes: PermissionCode[];
}

export interface PermissionDefinitionRecord {
  id: string;
  code: PermissionCode;
  label: string;
  module: string;
  description: string | null;
}

export interface UserShopRoleRecord {
  id: string;
  userId: string;
  shopId: string | null;
  roleId: string;
  roleCode: RoleCode;
  roleLabel: string;
  roleScope: "global" | "shop";
  shopName: string;
  shopCode: string;
  isPrimary: boolean;
  isActive: boolean;
  assignedAt: string;
  assignedByUserId: string | null;
}

export interface EmployeeRecord {
  id: string;
  userId: string;
  primaryShopId: string | null;
  employeeCode: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  isActive: boolean;
  notes: string | null;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  shopId: string | null;
  actorUserId: string | null;
  actorRoleSnapshot: string | null;
  action: string;
  entityName: string;
  entityId: string | null;
  entityCode: string | null;
  message: string | null;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface RbacAccessContext {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  profileRole: ProfileRoleCode;
  primaryRole: ProfileRoleCode;
  permissions: PermissionCode[];
  activeShop: ShopContext | null;
  shops: ShopContext[];
  assignments: UserShopRoleRecord[];
  employee: EmployeeRecord | null;
  canAccessPanel: boolean;
  canManageRoles: boolean;
}

export interface RoleAssignmentDirectory {
  shops: ShopContext[];
  roles: RoleDefinitionRecord[];
  permissions: PermissionDefinitionRecord[];
  users: Array<{
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    profileRole: ProfileRoleCode;
    employee: EmployeeRecord | null;
    assignments: UserShopRoleRecord[];
  }>;
}

export interface AssignRolePayload {
  userId: string;
  shopId: string | null;
  roleCode: RoleCode;
  isPrimary: boolean;
}

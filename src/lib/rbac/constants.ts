export const RBAC_ROLE_CODES = [
  "system_admin",
  "shop_admin",
  "employee",
] as const;

export type RoleCode = (typeof RBAC_ROLE_CODES)[number];

export const PROFILE_ROLE_CODES = [
  "system_admin",
  "shop_admin",
  "employee",
  "viewer",
] as const;

export type ProfileRoleCode = (typeof PROFILE_ROLE_CODES)[number];

export const RBAC_PERMISSION_CODES = [
  "system.shop.read",
  "system.shop.create",
  "system.shop.update",
  "system.shop.disable",
  "system.user.assign_role",
  "system.audit.read_all",
  "master.customer.read",
  "master.customer.create",
  "master.customer.update",
  "master.customer.delete",
  "master.employee.read",
  "master.employee.create",
  "master.employee.update",
  "master.item.read",
  "master.item.create",
  "master.item.update",
  "master.item.delete",
  "master.menu.read",
  "master.menu.create",
  "master.menu.update",
  "master.price_book.read",
  "master.price_book.create",
  "master.price_book.update",
  "master.price_book.activate",
  "master.warehouse.read",
  "master.warehouse.create",
  "master.warehouse.update",
  "master.supplier.read",
  "master.supplier.create",
  "master.supplier.update",
  "sales.order.read",
  "sales.order.create",
  "sales.order.update_draft",
  "sales.order.send",
  "sales.order.confirm",
  "sales.order.cancel",
  "sales.order.refresh_price",
  "sales.order.override_price",
  "sales.discount.apply",
  "sales.discount.override",
  "sales.bill.read",
  "sales.bill.export",
  "sales.payment.read",
  "sales.payment.record",
  "sales.payment.refund",
  "inventory.receipt.read",
  "inventory.receipt.create",
  "inventory.receipt.post",
  "inventory.issue.read",
  "inventory.issue.create",
  "inventory.issue.post",
  "inventory.adjustment.read",
  "inventory.adjustment.create",
  "inventory.adjustment.post",
  "inventory.stock.read",
  "inventory.stock.read_cost",
  "inventory.fefo.override",
  "inventory.expired.override",
  "inventory.negative_stock.override",
  "report.sales.read",
  "report.sales.export",
  "report.inventory.read",
  "report.inventory.export",
  "report.audit.read",
] as const;

export type PermissionCode = (typeof RBAC_PERMISSION_CODES)[number];

export const ROLE_DEFINITIONS: Record<
  RoleCode,
  {
    label: string;
    scope: "global" | "shop";
    description: string;
    permissionCodes: readonly PermissionCode[];
  }
> = {
  system_admin: {
    label: "System admin",
    scope: "global",
    description: "Toàn quyền trên toàn hệ thống và toàn bộ shop.",
    permissionCodes: RBAC_PERMISSION_CODES,
  },
  shop_admin: {
    label: "Shop admin",
    scope: "shop",
    description: "Quản trị nghiệp vụ trong phạm vi shop được gán.",
    permissionCodes: RBAC_PERMISSION_CODES.filter(
      (code) => !code.startsWith("system."),
    ) as PermissionCode[],
  },
  employee: {
    label: "Employee",
    scope: "shop",
    description: "Nhân sự tác nghiệp theo quyền được cấp.",
    permissionCodes: [
      "master.customer.read",
      "master.employee.read",
      "master.item.read",
      "master.menu.read",
      "master.price_book.read",
      "master.warehouse.read",
      "master.supplier.read",
      "sales.order.read",
      "sales.order.create",
      "sales.order.update_draft",
      "sales.order.send",
      "sales.bill.read",
      "sales.payment.read",
      "sales.payment.record",
      "inventory.receipt.read",
      "inventory.receipt.create",
      "inventory.issue.read",
      "inventory.issue.create",
      "inventory.adjustment.read",
      "inventory.adjustment.create",
      "inventory.stock.read",
      "report.sales.read",
      "report.inventory.read",
    ],
  },
};

export const ROLE_PRIORITY: ProfileRoleCode[] = [
  "system_admin",
  "shop_admin",
  "employee",
  "viewer",
];

export const ROLE_OPTIONS = RBAC_ROLE_CODES.map((code) => ({
  code,
  label: ROLE_DEFINITIONS[code].label,
  description: ROLE_DEFINITIONS[code].description,
}));

export const PROFILE_ROLE_LABELS: Record<ProfileRoleCode, string> = {
  system_admin: ROLE_DEFINITIONS.system_admin.label,
  shop_admin: ROLE_DEFINITIONS.shop_admin.label,
  employee: ROLE_DEFINITIONS.employee.label,
  viewer: "Viewer",
};

export const PERMISSION_GROUPS = [
  {
    code: "system",
    label: "System",
    permissions: RBAC_PERMISSION_CODES.filter((permission) =>
      permission.startsWith("system."),
    ),
  },
  {
    code: "master",
    label: "Master data",
    permissions: RBAC_PERMISSION_CODES.filter((permission) =>
      permission.startsWith("master."),
    ),
  },
  {
    code: "sales",
    label: "Sales",
    permissions: RBAC_PERMISSION_CODES.filter((permission) =>
      permission.startsWith("sales."),
    ),
  },
  {
    code: "inventory",
    label: "Inventory",
    permissions: RBAC_PERMISSION_CODES.filter((permission) =>
      permission.startsWith("inventory."),
    ),
  },
  {
    code: "report",
    label: "Reports",
    permissions: RBAC_PERMISSION_CODES.filter((permission) =>
      permission.startsWith("report."),
    ),
  },
] as const;

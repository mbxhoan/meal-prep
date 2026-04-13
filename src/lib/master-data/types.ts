import type { PermissionCode } from "@/lib/rbac";

export const MASTER_DATA_ENTITY_KEYS = [
  "customers",
  "employees",
  "suppliers",
  "warehouses",
  "item_groups",
  "item_types",
  "units",
  "items",
  "menu_items",
  "menu_item_variants",
  "combos",
  "combo_items",
  "price_books",
  "price_book_items",
] as const;

export type MasterDataEntityKey =
  (typeof MASTER_DATA_ENTITY_KEYS)[number];

/** Options loaded from tables that are not MasterDataEntityKey pages (e.g. danh sách mã hàng tồn kho). */
export type MasterDataAuxOptionsSourceKey = "inventory_stock_items";

export type MasterDataFieldOptionsSource =
  | MasterDataEntityKey
  | MasterDataAuxOptionsSourceKey;

export type MasterDataFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "date"
  | "image";

export interface MasterDataOption {
  value: string;
  label: string;
}

export interface MasterDataFieldConfig {
  name: string;
  label: string;
  type: MasterDataFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  optionsSource?: MasterDataFieldOptionsSource;
  options?: MasterDataOption[];
  defaultValue?: string | number | boolean | null;
  step?: string;
  min?: number;
  max?: number;
}

export type MasterDataColumnType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "money"
  | "percent"
  | "image";

export interface MasterDataColumnConfig {
  key: string;
  label: string;
  type?: MasterDataColumnType;
}

export interface MasterDataPermissions {
  read: PermissionCode;
  create: PermissionCode;
  update: PermissionCode;
  delete: PermissionCode;
}

export interface MasterDataEntityConfig {
  key: MasterDataEntityKey;
  title: string;
  description: string;
  table: string;
  permissions: MasterDataPermissions;
  select: string;
  orderBy: {
    column: string;
    ascending?: boolean;
  };
  fields: MasterDataFieldConfig[];
  columns: MasterDataColumnConfig[];
  searchFields: string[];
  optionLabelPaths: string[];
  deletePatch?: Record<string, unknown>;
}

export type MasterDataRow = Record<string, unknown> & {
  id: string;
  shop_id: string;
  is_active: boolean;
  deleted_at: string | null;
};

export interface MasterDataOptionGroup {
  key: MasterDataFieldOptionsSource;
  label: string;
  options: MasterDataOption[];
}

export interface MasterDataPageData {
  config: MasterDataEntityConfig;
  rows: MasterDataRow[];
  optionGroups: MasterDataOptionGroup[];
}

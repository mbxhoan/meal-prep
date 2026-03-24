import type { PermissionCode } from "@/lib/rbac";

export const MASTER_DATA_ENTITY_KEYS = [
  "customers",
  "suppliers",
  "warehouses",
  "item_groups",
  "item_types",
  "units",
  "items",
  "menu_items",
  "menu_item_variants",
  "price_books",
  "price_book_items",
] as const;

export type MasterDataEntityKey =
  (typeof MASTER_DATA_ENTITY_KEYS)[number];

export type MasterDataFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "date";

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
  optionsSource?: MasterDataEntityKey;
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
  | "percent";

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
  key: MasterDataEntityKey;
  label: string;
  options: MasterDataOption[];
}

export interface MasterDataPageData {
  config: MasterDataEntityConfig;
  rows: MasterDataRow[];
  optionGroups: MasterDataOptionGroup[];
}

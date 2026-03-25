import {
  INVENTORY_BARCODE_TYPES,
  INVENTORY_TRACKING_MODES,
} from "@/lib/inventory";
import {
  MASTER_DATA_ENTITY_KEYS,
  type MasterDataEntityConfig,
  type MasterDataEntityKey,
} from "@/lib/master-data/types";

function lookupConfig(
  key: MasterDataEntityKey,
  config: Omit<MasterDataEntityConfig, "key">,
): MasterDataEntityConfig {
  return {
    key,
    ...config,
  };
}

export const INVENTORY_BARCODE_TYPE_OPTIONS = INVENTORY_BARCODE_TYPES.map(
  (value) => ({
    value,
    label:
      {
        code128: "Mã 128",
        code39: "Mã 39",
        ean13: "EAN-13",
        ean8: "EAN-8",
        qr: "Mã QR",
        itf14: "ITF-14",
        data_matrix: "Ma trận dữ liệu",
      }[value] ?? value,
  }),
);

export const INVENTORY_TRACKING_MODE_OPTIONS = INVENTORY_TRACKING_MODES.map(
  (value) => ({
    value,
    label:
      {
        none: "Không theo dõi",
        lot: "Theo lô",
        serial: "Theo serial",
        lot_serial: "Theo lô + serial",
      }[value] ?? value,
  }),
);

export const MASTER_DATA_ENTITY_CONFIGS: Record<
  MasterDataEntityKey,
  MasterDataEntityConfig
> = {
  customers: lookupConfig("customers", {
    title: "Khách hàng",
    description: "Quản lý khách hàng, số điện thoại và địa chỉ giao hàng.",
    table: "customers",
    permissions: {
      read: "master.customer.read",
      create: "master.customer.create",
      update: "master.customer.update",
      delete: "master.customer.delete",
    },
    select:
      "id, shop_id, code, name, phone, email, address, note, is_active, deleted_at, created_at, updated_at",
    orderBy: { column: "updated_at", ascending: false },
    fields: [
      { name: "code", label: "Mã khách hàng", type: "text", required: true },
      { name: "name", label: "Tên khách hàng", type: "text", required: true },
      { name: "phone", label: "Số điện thoại", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "address", label: "Địa chỉ", type: "textarea" },
      { name: "note", label: "Ghi chú", type: "textarea" },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên" },
      { key: "phone", label: "Điện thoại" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: ["code", "name", "phone", "email", "address", "note"],
    optionLabelPaths: ["code", "name"],
  }),
  suppliers: lookupConfig("suppliers", {
    title: "Nhà cung cấp",
    description: "Danh sách nhà cung cấp nguyên liệu, bao bì và hàng hoá.",
    table: "suppliers",
    permissions: {
      read: "master.supplier.read",
      create: "master.supplier.create",
      update: "master.supplier.update",
      delete: "master.supplier.delete",
    },
    select:
      "id, shop_id, code, name, phone, email, address, note, is_active, deleted_at, created_at, updated_at",
    orderBy: { column: "updated_at", ascending: false },
    fields: [
      { name: "code", label: "Mã nhà cung cấp", type: "text", required: true },
      { name: "name", label: "Tên nhà cung cấp", type: "text", required: true },
      { name: "phone", label: "Số điện thoại", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "address", label: "Địa chỉ", type: "textarea" },
      { name: "note", label: "Ghi chú", type: "textarea" },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên" },
      { key: "phone", label: "Điện thoại" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: ["code", "name", "phone", "email", "address", "note"],
    optionLabelPaths: ["code", "name"],
  }),
  warehouses: lookupConfig("warehouses", {
    title: "Kho",
    description: "Quản lý kho xuất nhập và kho mặc định của shop.",
    table: "warehouses",
    permissions: {
      read: "master.warehouse.read",
      create: "master.warehouse.create",
      update: "master.warehouse.update",
      delete: "master.warehouse.delete",
    },
    select:
      "id, shop_id, code, name, address, is_default, is_active, note, deleted_at, created_at, updated_at",
    orderBy: { column: "updated_at", ascending: false },
    fields: [
      { name: "code", label: "Mã kho", type: "text", required: true },
      { name: "name", label: "Tên kho", type: "text", required: true },
      { name: "address", label: "Địa chỉ", type: "textarea" },
      {
        name: "is_default",
        label: "Kho mặc định",
        type: "checkbox",
        defaultValue: false,
      },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên" },
      { key: "is_default", label: "Mặc định", type: "boolean" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: ["code", "name", "address", "note"],
    optionLabelPaths: ["code", "name"],
    deletePatch: { is_active: false },
  }),
  item_groups: lookupConfig("item_groups", {
    title: "Nhóm hàng",
    description: "Phân nhóm hàng hóa theo nghiệp vụ và báo cáo.",
    table: "item_groups",
    permissions: {
      read: "master.lookup.read",
      create: "master.lookup.create",
      update: "master.lookup.update",
      delete: "master.lookup.delete",
    },
    select:
      "id, shop_id, code, name, description, sort_order, is_active, deleted_at, created_at, updated_at",
    orderBy: { column: "sort_order", ascending: true },
    fields: [
      { name: "code", label: "Mã nhóm", type: "text", required: true },
      { name: "name", label: "Tên nhóm", type: "text", required: true },
      { name: "description", label: "Mô tả", type: "textarea" },
      {
        name: "sort_order",
        label: "Thứ tự",
        type: "number",
        step: "1",
        min: 0,
        defaultValue: 0,
      },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên" },
      { key: "sort_order", label: "Thứ tự", type: "number" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: ["code", "name", "description"],
    optionLabelPaths: ["code", "name"],
  }),
  item_types: lookupConfig("item_types", {
    title: "Loại hàng",
    description: "Phân loại raw material, seasoning, packaging, finished good.",
    table: "item_types",
    permissions: {
      read: "master.lookup.read",
      create: "master.lookup.create",
      update: "master.lookup.update",
      delete: "master.lookup.delete",
    },
    select:
      "id, shop_id, code, name, description, sort_order, is_active, deleted_at, created_at, updated_at",
    orderBy: { column: "sort_order", ascending: true },
    fields: [
      { name: "code", label: "Mã loại", type: "text", required: true },
      { name: "name", label: "Tên loại", type: "text", required: true },
      { name: "description", label: "Mô tả", type: "textarea" },
      {
        name: "sort_order",
        label: "Thứ tự",
        type: "number",
        step: "1",
        min: 0,
        defaultValue: 0,
      },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên" },
      { key: "sort_order", label: "Thứ tự", type: "number" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: ["code", "name", "description"],
    optionLabelPaths: ["code", "name"],
  }),
  units: lookupConfig("units", {
    title: "Đơn vị tính",
    description: "Đơn vị chuẩn cho hàng hóa và công thức định lượng.",
    table: "units",
    permissions: {
      read: "master.lookup.read",
      create: "master.lookup.create",
      update: "master.lookup.update",
      delete: "master.lookup.delete",
    },
    select:
      "id, shop_id, code, name, symbol, description, is_base_unit, is_active, deleted_at, created_at, updated_at",
    orderBy: { column: "code", ascending: true },
    fields: [
      { name: "code", label: "Mã đơn vị", type: "text", required: true },
      { name: "name", label: "Tên đơn vị", type: "text", required: true },
      { name: "symbol", label: "Ký hiệu", type: "text" },
      { name: "description", label: "Mô tả", type: "textarea" },
      {
        name: "is_base_unit",
        label: "Đơn vị gốc",
        type: "checkbox",
        defaultValue: false,
      },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên" },
      { key: "symbol", label: "Ký hiệu" },
      { key: "is_base_unit", label: "Đơn vị gốc", type: "boolean" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: ["code", "name", "symbol", "description"],
    optionLabelPaths: ["code", "name"],
  }),
  items: lookupConfig("items", {
    title: "Hàng hóa",
    description: "Mã hàng tồn kho, chế độ theo dõi, mã vạch và cờ FEFO.",
    table: "items",
    permissions: {
      read: "master.item.read",
      create: "master.item.create",
      update: "master.item.update",
      delete: "master.item.delete",
    },
    select:
      "id, shop_id, sku, name, barcode, barcode_type, tracking_mode, item_group_id, item_groups(code, name), item_type_id, item_types(code, name), base_unit_id, units(code, name), is_expirable, is_fefo_enabled, requires_unit_label, default_shelf_life_days, minimum_stock_qty, is_active, notes, deleted_at, created_at, updated_at",
    orderBy: { column: "updated_at", ascending: false },
    fields: [
      { name: "sku", label: "Mã hàng", type: "text", required: true },
      { name: "name", label: "Tên hàng hóa", type: "text", required: true },
      { name: "barcode", label: "Mã vạch", type: "text" },
      {
        name: "barcode_type",
        label: "Loại mã vạch",
        type: "select",
        options: INVENTORY_BARCODE_TYPE_OPTIONS,
      },
      {
        name: "tracking_mode",
        label: "Chế độ theo dõi",
        type: "select",
        required: true,
        options: INVENTORY_TRACKING_MODE_OPTIONS,
        defaultValue: "lot",
      },
      {
        name: "item_group_id",
        label: "Nhóm hàng",
        type: "select",
        optionsSource: "item_groups",
        required: true,
      },
      {
        name: "item_type_id",
        label: "Loại hàng",
        type: "select",
        optionsSource: "item_types",
        required: true,
      },
      {
        name: "base_unit_id",
        label: "Đơn vị tính",
        type: "select",
        optionsSource: "units",
        required: true,
      },
      {
        name: "is_expirable",
        label: "Có HSD",
        type: "checkbox",
        defaultValue: true,
      },
      {
        name: "is_fefo_enabled",
        label: "Bật FEFO",
        type: "checkbox",
        defaultValue: true,
      },
      {
        name: "requires_unit_label",
        label: "Cần tem đơn vị",
        type: "checkbox",
        defaultValue: false,
      },
      {
        name: "default_shelf_life_days",
        label: "HSD mặc định (ngày)",
        type: "number",
        step: "1",
        min: 0,
      },
      {
        name: "minimum_stock_qty",
        label: "Tồn tối thiểu",
        type: "number",
        step: "0.01",
        min: 0,
        defaultValue: 0,
      },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
      { name: "notes", label: "Ghi chú", type: "textarea" },
    ],
    columns: [
      { key: "sku", label: "Mã hàng" },
      { key: "name", label: "Tên" },
      { key: "item_groups.name", label: "Nhóm" },
      { key: "item_types.name", label: "Loại" },
      { key: "units.code", label: "Đơn vị" },
      { key: "tracking_mode", label: "Theo dõi", type: "text" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: ["sku", "name", "barcode", "notes", "item_groups.name", "item_types.name"],
    optionLabelPaths: ["sku", "name"],
  }),
  menu_items: lookupConfig("menu_items", {
    title: "Món bán",
    description: "Món bán cho khách, tách riêng khỏi mã hàng tồn kho.",
    table: "menu_items",
    permissions: {
      read: "master.menu.read",
      create: "master.menu.create",
      update: "master.menu.update",
      delete: "master.menu.delete",
    },
    select:
      "id, shop_id, code, name, notes, sort_order, is_active, deleted_at, created_at, updated_at",
    orderBy: { column: "sort_order", ascending: true },
    fields: [
      { name: "code", label: "Mã món", type: "text", required: true },
      { name: "name", label: "Tên món", type: "text", required: true },
      {
        name: "sort_order",
        label: "Thứ tự",
        type: "number",
        step: "1",
        min: 0,
        defaultValue: 0,
      },
      { name: "notes", label: "Ghi chú", type: "textarea" },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên" },
      { key: "sort_order", label: "Thứ tự", type: "number" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: ["code", "name", "notes"],
    optionLabelPaths: ["code", "name"],
  }),
  menu_item_variants: lookupConfig("menu_item_variants", {
    title: "Biến thể món",
    description:
      "Ghép món bán với biến thể; liên kết mã hàng kho để khi xác nhận đơn hệ thống tự tạo phiếu xuất nháp theo FEFO.",
    table: "menu_item_variants",
    permissions: {
      read: "master.menu.read",
      create: "master.menu.create",
      update: "master.menu.update",
      delete: "master.menu.delete",
    },
    select:
      "id, shop_id, menu_item_id, menu_items(code, name), label, weight_grams, linked_inventory_item_id, items(sku, name), fulfillment_inventory_item_id, fulfillment_stock:inventory_items!fulfillment_inventory_item_id(sku, name), sort_order, is_active, notes, deleted_at, created_at, updated_at",
    orderBy: { column: "sort_order", ascending: true },
    fields: [
      {
        name: "menu_item_id",
        label: "Món bán",
        type: "select",
        optionsSource: "menu_items",
        required: true,
      },
      { name: "label", label: "Nhãn biến thể", type: "text", required: true },
      {
        name: "weight_grams",
        label: "Khối lượng (g)",
        type: "number",
        step: "1",
        min: 0,
      },
      {
        name: "linked_inventory_item_id",
        label: "Nguyên liệu gốc",
        type: "select",
        optionsSource: "items",
      },
      {
        name: "fulfillment_inventory_item_id",
        label: "Mã xuất kho (FEFO)",
        type: "select",
        optionsSource: "inventory_stock_items",
      },
      {
        name: "sort_order",
        label: "Thứ tự",
        type: "number",
        step: "1",
        min: 0,
        defaultValue: 0,
      },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
      { name: "notes", label: "Ghi chú", type: "textarea" },
    ],
    columns: [
      { key: "menu_items.name", label: "Món" },
      { key: "label", label: "Biến thể" },
      { key: "weight_grams", label: "Gram", type: "number" },
      { key: "items.name", label: "Nguyên liệu gốc" },
      { key: "fulfillment_stock.sku", label: "Mã xuất" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: [
      "label",
      "notes",
      "menu_items.name",
      "items.name",
      "fulfillment_stock.sku",
      "fulfillment_stock.name",
      "weight_grams",
    ],
    optionLabelPaths: ["menu_items.name", "label"],
  }),
  price_books: lookupConfig("price_books", {
    title: "Bảng giá",
    description: "Bảng giá có hiệu lực theo thời gian và trạng thái.",
    table: "price_books",
    permissions: {
      read: "master.price_book.read",
      create: "master.price_book.create",
      update: "master.price_book.update",
      delete: "master.price_book.delete",
    },
    select:
      "id, shop_id, code, name, effective_from, effective_to, status, notes, is_active, deleted_at, created_at, updated_at",
    orderBy: { column: "updated_at", ascending: false },
    fields: [
      { name: "code", label: "Mã bảng giá", type: "text", required: true },
      { name: "name", label: "Tên bảng giá", type: "text", required: true },
      { name: "effective_from", label: "Hiệu lực từ", type: "date" },
      { name: "effective_to", label: "Hiệu lực đến", type: "date" },
      {
        name: "status",
        label: "Trạng thái",
        type: "select",
        required: true,
        options: [
          { value: "draft", label: "Bản nháp" },
          { value: "active", label: "Đang áp dụng" },
          { value: "archived", label: "Lưu trữ" },
        ],
        defaultValue: "draft",
      },
      { name: "notes", label: "Ghi chú", type: "textarea" },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên" },
      { key: "status", label: "Trạng thái" },
      { key: "effective_from", label: "Từ ngày", type: "date" },
      { key: "effective_to", label: "Đến ngày", type: "date" },
      { key: "is_active", label: "Hoạt động", type: "boolean" },
    ],
    searchFields: ["code", "name", "notes", "status"],
    optionLabelPaths: ["code", "name"],
    deletePatch: { status: "archived", is_active: false },
  }),
  price_book_items: lookupConfig("price_book_items", {
    title: "Dòng bảng giá",
    description: "Liên kết bảng giá với từng biến thể món bán.",
    table: "price_book_items",
    permissions: {
      read: "master.price_book.read",
      create: "master.price_book.create",
      update: "master.price_book.update",
      delete: "master.price_book.delete",
    },
    select:
      "id, shop_id, price_book_id, price_books(code, name), menu_item_variant_id, menu_item_variants(label, menu_items(code, name)), sale_price, standard_cost, target_margin_percent, notes, is_active, deleted_at, created_at, updated_at",
    orderBy: { column: "updated_at", ascending: false },
    fields: [
      {
        name: "price_book_id",
        label: "Bảng giá",
        type: "select",
        optionsSource: "price_books",
        required: true,
      },
      {
        name: "menu_item_variant_id",
        label: "Biến thể món",
        type: "select",
        optionsSource: "menu_item_variants",
        required: true,
      },
      {
        name: "sale_price",
        label: "Giá bán",
        type: "number",
        step: "0.01",
        min: 0,
        required: true,
        defaultValue: 0,
      },
      {
        name: "standard_cost",
        label: "Giá vốn chuẩn",
        type: "number",
        step: "0.01",
        min: 0,
        defaultValue: 0,
      },
      {
        name: "target_margin_percent",
        label: "Biên lợi nhuận mục tiêu (%)",
        type: "number",
        step: "0.01",
        min: 0,
        defaultValue: 0,
      },
      { name: "notes", label: "Ghi chú", type: "textarea" },
      {
        name: "is_active",
        label: "Đang hoạt động",
        type: "checkbox",
        defaultValue: true,
      },
    ],
    columns: [
      { key: "price_books.name", label: "Bảng giá" },
      { key: "menu_item_variants.label", label: "Biến thể" },
      { key: "sale_price", label: "Giá bán", type: "money" },
      { key: "standard_cost", label: "Giá vốn", type: "money" },
      { key: "target_margin_percent", label: "Biên lợi nhuận", type: "percent" },
      { key: "is_active", label: "Trạng thái", type: "boolean" },
    ],
    searchFields: [
      "price_books.code",
      "price_books.name",
      "menu_item_variants.label",
      "menu_item_variants.menu_items.name",
      "notes",
    ],
    optionLabelPaths: ["price_books.name", "menu_item_variants.label"],
  }),
};

export const MASTER_DATA_ENTITY_LIST = MASTER_DATA_ENTITY_KEYS.map(
  (key) => MASTER_DATA_ENTITY_CONFIGS[key],
);

export function isMasterDataEntityKey(
  value: string,
): value is MasterDataEntityKey {
  return MASTER_DATA_ENTITY_KEYS.includes(value as MasterDataEntityKey);
}

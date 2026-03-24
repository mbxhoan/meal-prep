-- SCHEMA_BLUEPRINT.sql
-- Blueprint định hướng, không phải migration hoàn chỉnh production-ready.
-- Codex phải tách thành nhiều migration nhỏ theo phase.

create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  address text,
  phone text,
  timezone text default 'Asia/Ho_Chi_Minh',
  currency_code text default 'VND',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  unique (role_id, permission_id)
);

create table if not exists public.user_shop_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  shop_id uuid not null references public.shops(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, shop_id, role_id)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid,
  code text,
  name text not null,
  phone text,
  address text,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text,
  name text not null,
  phone text,
  address text,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text,
  name text not null,
  phone text,
  address text,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  address text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.item_groups (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  sort_order int default 0,
  is_active boolean not null default true,
  unique (shop_id, code)
);

create table if not exists public.item_types (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  unique (shop_id, code)
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  unique (shop_id, code)
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  sku text not null,
  barcode text,
  barcode_type text,
  tracking_mode text not null default 'lot',
  item_group_id uuid references public.item_groups(id),
  item_type_id uuid references public.item_types(id),
  base_unit_id uuid references public.units(id),
  is_expirable boolean not null default true,
  is_fefo_enabled boolean not null default true,
  requires_unit_label boolean not null default false,
  default_shelf_life_days int,
  minimum_stock_qty numeric(18,3) not null default 0,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, sku),
  unique (shop_id, barcode)
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  code text not null,
  notes text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.menu_item_variants (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  label text not null,
  weight_grams numeric(18,3),
  linked_inventory_item_id uuid references public.items(id),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, menu_item_id, label)
);

create table if not exists public.price_books (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  effective_from date,
  effective_to date,
  status text not null default 'draft',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.price_book_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  price_book_id uuid not null references public.price_books(id) on delete cascade,
  menu_item_variant_id uuid not null references public.menu_item_variants(id) on delete restrict,
  sale_price numeric(18,2) not null default 0,
  standard_cost numeric(18,2) not null default 0,
  target_margin_percent numeric(9,4) not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (price_book_id, menu_item_variant_id)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  discount_type text not null,
  discount_value numeric(18,2) not null,
  min_order_amount numeric(18,2) default 0,
  valid_from timestamptz,
  valid_to timestamptz,
  max_usage int,
  active boolean not null default true,
  unique (shop_id, code)
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  active boolean not null default true,
  unique (shop_id, code)
);

create table if not exists public.shop_configs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null unique references public.shops(id) on delete cascade,
  near_expiry_days int not null default 3,
  expiring_soon_days int not null default 7,
  default_price_book_id uuid references public.price_books(id),
  allow_negative_stock boolean not null default false,
  allow_expired_issue boolean not null default false,
  allow_fefo_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_no text not null,
  ordered_at timestamptz not null default now(),
  customer_id uuid references public.customers(id),
  customer_name_snapshot text,
  customer_phone_snapshot text,
  customer_address_snapshot text,
  employee_id uuid references public.employees(id),
  status text not null default 'draft',
  payment_status text not null default 'unpaid',
  subtotal_before_discount numeric(18,2) not null default 0,
  order_discount_type text,
  order_discount_value numeric(18,2),
  order_discount_amount numeric(18,2) not null default 0,
  shipping_fee numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  coupon_code_snapshot text,
  notes text,
  sent_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, order_no)
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  menu_item_variant_id uuid references public.menu_item_variants(id),
  item_name_snapshot text not null,
  variant_label_snapshot text,
  weight_grams_snapshot numeric(18,3),
  quantity numeric(18,3) not null default 0,
  unit_price_snapshot numeric(18,2) not null default 0,
  standard_cost_snapshot numeric(18,2) not null default 0,
  line_discount_type text,
  line_discount_value numeric(18,2),
  line_discount_amount numeric(18,2) not null default 0,
  line_total_before_discount numeric(18,2) not null default 0,
  line_total_after_discount numeric(18,2) not null default 0,
  line_cost_total numeric(18,2) not null default 0,
  line_profit_total numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  payment_method_id uuid references public.payment_methods(id),
  amount numeric(18,2) not null default 0,
  paid_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  supplier_id uuid references public.suppliers(id),
  lot_no text not null,
  lot_barcode text,
  manufactured_at timestamptz,
  expired_at timestamptz,
  received_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (shop_id, item_id, warehouse_id, lot_no)
);

create table if not exists public.inventory_receipts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  receipt_no text not null,
  received_at timestamptz not null default now(),
  warehouse_id uuid not null references public.warehouses(id),
  supplier_id uuid references public.suppliers(id),
  status text not null default 'draft',
  note text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shop_id, receipt_no)
);

create table if not exists public.inventory_receipt_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  inventory_receipt_id uuid not null references public.inventory_receipts(id) on delete cascade,
  item_id uuid not null references public.items(id),
  lot_id uuid references public.inventory_lots(id),
  lot_no_snapshot text,
  qty_received numeric(18,3) not null default 0,
  unit_cost numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  manufactured_at timestamptz,
  expired_at timestamptz,
  note text
);

create table if not exists public.inventory_issues (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  issue_no text not null,
  issued_at timestamptz not null default now(),
  warehouse_id uuid not null references public.warehouses(id),
  status text not null default 'draft',
  reason_code text,
  source_type text,
  source_id uuid,
  note text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shop_id, issue_no)
);

create table if not exists public.inventory_issue_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  inventory_issue_id uuid not null references public.inventory_issues(id) on delete cascade,
  item_id uuid not null references public.items(id),
  lot_id uuid references public.inventory_lots(id),
  qty_issued numeric(18,3) not null default 0,
  suggested_lot_id uuid references public.inventory_lots(id),
  fefo_overridden boolean not null default false,
  fefo_override_reason text,
  note text
);

create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  adjustment_no text not null,
  adjusted_at timestamptz not null default now(),
  warehouse_id uuid not null references public.warehouses(id),
  reason_code text,
  note text,
  status text not null default 'draft',
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shop_id, adjustment_no)
);

create table if not exists public.inventory_adjustment_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  inventory_adjustment_id uuid not null references public.inventory_adjustments(id) on delete cascade,
  item_id uuid not null references public.items(id),
  lot_id uuid references public.inventory_lots(id),
  qty_delta numeric(18,3) not null,
  unit_cost_snapshot numeric(18,2),
  note text
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id),
  item_id uuid not null references public.items(id),
  lot_id uuid references public.inventory_lots(id),
  movement_type text not null,
  qty_in numeric(18,3) not null default 0,
  qty_out numeric(18,3) not null default 0,
  unit_cost_snapshot numeric(18,2),
  reference_type text,
  reference_id uuid,
  reference_line_id uuid,
  movement_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_allocations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sales_order_item_id uuid references public.sales_order_items(id) on delete cascade,
  item_id uuid not null references public.items(id),
  suggested_lot_id uuid references public.inventory_lots(id),
  allocated_lot_id uuid references public.inventory_lots(id),
  qty_allocated numeric(18,3) not null default 0,
  status text not null default 'draft',
  fefo_overridden boolean not null default false,
  override_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id),
  actor_user_id uuid,
  action text not null,
  entity_name text not null,
  entity_id uuid,
  entity_code text,
  message text,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

-- TODO for Codex:
-- 1. add foreign keys / check constraints / indexes phase by phase
-- 2. add updated_at triggers
-- 3. add RLS policies
-- 4. add views:
--    v_stock_on_hand_by_lot
--    v_stock_on_hand_by_item
--    v_fefo_candidates
-- 5. add RPC:
--    create_sales_order_from_price_book
--    refresh_order_prices
--    suggest_fefo_lots
--    post_inventory_receipt
--    post_inventory_issue

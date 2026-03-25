-- Seed import compatibility foundation for business schema.
-- This migration is non-breaking: it only adds import metadata, helper
-- functions, and a compatibility view for stock movements.

do $$
begin
  if to_regclass('public.customers') is null
    or to_regclass('public.inventory_items') is null
    or to_regclass('public.sales_orders') is null
    or to_regclass('public.sales_order_items') is null
    or to_regclass('public.sales_payments') is null
    or to_regclass('public.sales_order_status_logs') is null
    or to_regclass('public.inventory_receipts') is null
    or to_regclass('public.inventory_receipt_items') is null
    or to_regclass('public.inventory_issues') is null
    or to_regclass('public.inventory_issue_items') is null
    or to_regclass('public.inventory_lots') is null
    or to_regclass('public.inventory_movements') is null then
    raise exception
      'Missing business schema before seed import compatibility migration.';
  end if;
end
$$;

create or replace function public.seed_import_normalize_text(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(regexp_replace(lower(trim(coalesce(p_value, ''))), '\s+', ' ', 'g'), '');
$$;

create or replace function public.seed_import_uuid(p_key text)
returns uuid
language sql
immutable
set search_path = public
as $$
  select (
    substr(md5(coalesce(p_key, '')), 1, 8) || '-' ||
    substr(md5(coalesce(p_key, '')), 9, 4) || '-' ||
    substr(md5(coalesce(p_key, '')), 13, 4) || '-' ||
    substr(md5(coalesce(p_key, '')), 17, 4) || '-' ||
    substr(md5(coalesce(p_key, '')), 21, 12)
  )::uuid;
$$;

alter table public.customers
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.inventory_items
  add column if not exists shop_id uuid references public.shops(id) on delete cascade,
  add column if not exists item_code text,
  add column if not exists group_name text,
  add column if not exists item_type text,
  add column if not exists default_shelf_life_raw text,
  add column if not exists recipe_link text,
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

do $$
declare
  v_default_shop_id uuid;
begin
  select id
  into v_default_shop_id
  from public.shops
  order by is_default desc, created_at asc
  limit 1;

  if v_default_shop_id is null then
    return;
  end if;

  update public.inventory_items
  set shop_id = v_default_shop_id
  where shop_id is null;
end
$$;

alter table public.sales_orders
  add column if not exists handled_by_name_snapshot text,
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.sales_order_items
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.sales_payments
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.sales_order_status_logs
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.inventory_receipts
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.inventory_receipt_items
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.inventory_issues
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.inventory_issue_items
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.inventory_lots
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

alter table public.inventory_movements
  add column if not exists import_source text,
  add column if not exists import_source_id uuid,
  add column if not exists import_source_row integer,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

create unique index if not exists uq_customers_import_seed
  on public.customers (shop_id, import_source, import_source_id);

create unique index if not exists uq_inventory_items_import_seed
  on public.inventory_items (shop_id, import_source, import_source_id);

create unique index if not exists uq_sales_orders_import_seed
  on public.sales_orders (shop_id, import_source, import_source_id);

create unique index if not exists uq_sales_order_items_import_seed
  on public.sales_order_items (shop_id, import_source, import_source_id);

create unique index if not exists uq_sales_payments_import_seed
  on public.sales_payments (shop_id, import_source, import_source_id);

create unique index if not exists uq_sales_order_status_logs_import_seed
  on public.sales_order_status_logs (shop_id, import_source, import_source_id);

create unique index if not exists uq_inventory_receipts_import_seed
  on public.inventory_receipts (shop_id, import_source, import_source_id);

create unique index if not exists uq_inventory_receipt_items_import_seed
  on public.inventory_receipt_items (shop_id, import_source, import_source_id);

create unique index if not exists uq_inventory_issues_import_seed
  on public.inventory_issues (shop_id, import_source, import_source_id);

create unique index if not exists uq_inventory_issue_items_import_seed
  on public.inventory_issue_items (shop_id, import_source, import_source_id);

create unique index if not exists uq_inventory_lots_import_seed
  on public.inventory_lots (shop_id, import_source, import_source_id);

create unique index if not exists uq_inventory_movements_import_seed
  on public.inventory_movements (shop_id, import_source, import_source_id);

create or replace view public.stock_movements as
select *
from public.inventory_movements;

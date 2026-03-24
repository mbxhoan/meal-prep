-- Phase 1 master data foundation for MealFit Ops
-- CRUD master data + RLS + audit triggers + permission seed.

do $$
begin
  if to_regclass('public.shops') is null
    or to_regclass('public.roles') is null
    or to_regclass('public.permissions') is null
    or to_regclass('public.user_shop_roles') is null
    or to_regclass('public.audit_logs') is null
    or to_regprocedure('public.has_permission(text)') is null
    or to_regprocedure('public.user_can_access_shop(uuid)') is null
    or to_regprocedure('public.log_audit_event(uuid,text,text,uuid,text,text,jsonb,jsonb,jsonb,inet,text)') is null then
    raise exception
      'Missing Phase 0 foundation. Apply 20260324000100_phase0_rbac_auth_shop_audit.sql before this migration.';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Permission seed
-- -----------------------------------------------------------------------------
insert into public.permissions (
  code,
  name,
  module,
  sort_order,
  is_active
)
values
  ('master.lookup.read', 'Read lookups', 'master', 8, true),
  ('master.lookup.create', 'Create lookups', 'master', 9, true),
  ('master.lookup.update', 'Update lookups', 'master', 10, true),
  ('master.lookup.delete', 'Delete lookups', 'master', 11, true),
  ('master.menu.delete', 'Delete menu', 'master', 27, true),
  ('master.price_book.delete', 'Delete price books', 'master', 34, true),
  ('master.warehouse.delete', 'Delete warehouses', 'master', 37, true),
  ('master.supplier.delete', 'Delete suppliers', 'master', 40, true)
on conflict (code) do update
set name = excluded.name,
    module = excluded.module,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles roles
join public.permissions permissions on true
where roles.code = 'system_admin'
  and permissions.code in (
    'master.lookup.read',
    'master.lookup.create',
    'master.lookup.update',
    'master.lookup.delete',
    'master.menu.delete',
    'master.price_book.delete',
    'master.warehouse.delete',
    'master.supplier.delete'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles roles
join public.permissions permissions on true
where roles.code = 'shop_admin'
  and permissions.code in (
    'master.lookup.read',
    'master.lookup.create',
    'master.lookup.update',
    'master.lookup.delete',
    'master.menu.delete',
    'master.price_book.delete',
    'master.warehouse.delete',
    'master.supplier.delete'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles roles
join public.permissions permissions on true
where roles.code = 'employee'
  and permissions.code = 'master.lookup.read'
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Audit helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_master_data_audit_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = coalesce(new.created_by, auth.uid());
    new.updated_by = coalesce(new.updated_by, auth.uid());
    new.created_at = coalesce(new.created_at, now());
    new.updated_at = coalesce(new.updated_at, now());
  else
    new.updated_by = auth.uid();
    new.updated_at = now();
  end if;

  return new;
end;
$$;

create or replace function public.audit_master_data_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_after jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_action text;
  v_shop_id uuid := nullif(coalesce(v_after ->> 'shop_id', v_before ->> 'shop_id'), '')::uuid;
  v_entity_id uuid := nullif(coalesce(v_after ->> 'id', v_before ->> 'id'), '')::uuid;
  v_entity_code text := nullif(
    coalesce(
      v_after ->> 'code',
      v_after ->> 'sku',
      v_after ->> 'label',
      v_after ->> 'name',
      v_after ->> 'menu_item_variant_id',
      v_after ->> 'price_book_id',
      v_before ->> 'code',
      v_before ->> 'sku',
      v_before ->> 'label',
      v_before ->> 'name',
      v_before ->> 'menu_item_variant_id',
      v_before ->> 'price_book_id'
    ),
    ''
  );
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
  elsif tg_op = 'UPDATE' and old.deleted_at is null and new.deleted_at is not null then
    v_action := 'delete';
  else
    v_action := 'update';
  end if;

  perform public.log_audit_event(
    p_shop_id := v_shop_id,
    p_action := v_action,
    p_entity_name := tg_table_name,
    p_entity_id := v_entity_id,
    p_entity_code := v_entity_code,
    p_message := format('%s %s', tg_table_name, v_action),
    p_before_json := v_before,
    p_after_json := v_after,
    p_metadata_json := jsonb_build_object(
      'table', tg_table_name,
      'operation', tg_op
    )
  );

  return coalesce(new, old);
end;
$$;

-- -----------------------------------------------------------------------------
-- Master tables
-- -----------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  phone text,
  email text,
  address text,
  note text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  phone text,
  email text,
  address text,
  note text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
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
  note text,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code)
);

create unique index if not exists uq_warehouses_default_active
  on public.warehouses (shop_id)
  where is_default = true and deleted_at is null;

create table if not exists public.item_groups (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.item_types (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  symbol text,
  description text,
  is_base_unit boolean not null default false,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code)
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sku text not null,
  name text not null,
  barcode text,
  barcode_type text,
  tracking_mode text not null default 'lot',
  item_group_id uuid not null references public.item_groups(id) on delete restrict,
  item_type_id uuid not null references public.item_types(id) on delete restrict,
  base_unit_id uuid not null references public.units(id) on delete restrict,
  is_expirable boolean not null default true,
  is_fefo_enabled boolean not null default true,
  requires_unit_label boolean not null default false,
  default_shelf_life_days integer,
  minimum_stock_qty numeric(18,3) not null default 0,
  is_active boolean not null default true,
  notes text,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, sku),
  check (barcode_type is null or barcode_type in (
    'code128',
    'code39',
    'ean13',
    'ean8',
    'qr',
    'itf14',
    'data_matrix'
  )),
  check (tracking_mode in ('none', 'lot', 'serial', 'lot_serial')),
  check (default_shelf_life_days is null or default_shelf_life_days >= 0),
  check (minimum_stock_qty >= 0)
);

create unique index if not exists uq_items_barcode
  on public.items (shop_id, barcode)
  where barcode is not null;

create index if not exists idx_items_tracking_mode
  on public.items (shop_id, tracking_mode);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  notes text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
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
  linked_inventory_item_id uuid references public.items(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  notes text,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
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
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code),
  check (status in ('draft', 'active', 'archived')),
  check (
    effective_to is null
    or effective_from is null
    or effective_to >= effective_from
  )
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
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (price_book_id, menu_item_variant_id),
  check (sale_price >= 0),
  check (standard_cost >= 0),
  check (target_margin_percent >= 0 and target_margin_percent <= 100)
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select *
    from (
      values
        ('customers', 'updated_at desc'),
        ('suppliers', 'updated_at desc'),
        ('warehouses', 'updated_at desc'),
        ('item_groups', 'sort_order, updated_at desc'),
        ('item_types', 'sort_order, updated_at desc'),
        ('units', 'updated_at desc'),
        ('items', 'updated_at desc'),
        ('menu_items', 'sort_order, updated_at desc'),
        ('menu_item_variants', 'sort_order, updated_at desc'),
        ('price_books', 'updated_at desc'),
        ('price_book_items', 'updated_at desc')
    ) as t(table_name, ordering)
  loop
    execute format(
      'create index if not exists %I on public.%I (shop_id, %s)',
      'idx_' || r.table_name || '_shop_order',
      r.table_name,
      r.ordering
    );
  end loop;
end
$$;

create index if not exists idx_price_books_status
  on public.price_books (shop_id, status);

create index if not exists idx_menu_item_variants_menu
  on public.menu_item_variants (menu_item_id);

create index if not exists idx_price_book_items_price_book
  on public.price_book_items (price_book_id);

create index if not exists idx_price_book_items_variant
  on public.price_book_items (menu_item_variant_id);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select *
    from (
      values
        ('customers'),
        ('suppliers'),
        ('warehouses'),
        ('item_groups'),
        ('item_types'),
        ('units'),
        ('items'),
        ('menu_items'),
        ('menu_item_variants'),
        ('price_books'),
        ('price_book_items')
    ) as t(table_name)
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'trg_' || r.table_name || '_touch',
      r.table_name
    );
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.set_master_data_audit_columns()',
      'trg_' || r.table_name || '_touch',
      r.table_name
    );

    execute format(
      'drop trigger if exists %I on public.%I',
      'trg_' || r.table_name || '_audit',
      r.table_name
    );
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_master_data_change()',
      'trg_' || r.table_name || '_audit',
      r.table_name
    );
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- RLS and grants
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select *
    from (
      values
        ('customers', 'master.customer.read', 'master.customer.create', 'master.customer.update', 'master.customer.delete'),
        ('suppliers', 'master.supplier.read', 'master.supplier.create', 'master.supplier.update', 'master.supplier.delete'),
        ('warehouses', 'master.warehouse.read', 'master.warehouse.create', 'master.warehouse.update', 'master.warehouse.delete'),
        ('item_groups', 'master.lookup.read', 'master.lookup.create', 'master.lookup.update', 'master.lookup.delete'),
        ('item_types', 'master.lookup.read', 'master.lookup.create', 'master.lookup.update', 'master.lookup.delete'),
        ('units', 'master.lookup.read', 'master.lookup.create', 'master.lookup.update', 'master.lookup.delete'),
        ('items', 'master.item.read', 'master.item.create', 'master.item.update', 'master.item.delete'),
        ('menu_items', 'master.menu.read', 'master.menu.create', 'master.menu.update', 'master.menu.delete'),
        ('menu_item_variants', 'master.menu.read', 'master.menu.create', 'master.menu.update', 'master.menu.delete'),
        ('price_books', 'master.price_book.read', 'master.price_book.create', 'master.price_book.update', 'master.price_book.delete'),
        ('price_book_items', 'master.price_book.read', 'master.price_book.create', 'master.price_book.update', 'master.price_book.delete')
    ) as t(table_name, read_perm, create_perm, update_perm, delete_perm)
  loop
    execute format('alter table public.%I enable row level security', r.table_name);

    execute format('drop policy if exists %I on public.%I', 'read_' || r.table_name, r.table_name);
    execute format(
      'create policy %I on public.%I for select using (public.user_can_access_shop(shop_id) and public.has_permission(%L))',
      'read_' || r.table_name,
      r.table_name,
      r.read_perm
    );

    execute format('drop policy if exists %I on public.%I', 'insert_' || r.table_name, r.table_name);
    execute format(
      'create policy %I on public.%I for insert with check (public.user_can_access_shop(shop_id) and public.has_permission(%L))',
      'insert_' || r.table_name,
      r.table_name,
      r.create_perm
    );

    execute format('drop policy if exists %I on public.%I', 'update_' || r.table_name, r.table_name);
    execute format(
      'create policy %I on public.%I for update using (public.user_can_access_shop(shop_id) and (public.has_permission(%L) or public.has_permission(%L))) with check (public.user_can_access_shop(shop_id) and (public.has_permission(%L) or public.has_permission(%L)))',
      'update_' || r.table_name,
      r.table_name,
      r.update_perm,
      r.delete_perm,
      r.update_perm,
      r.delete_perm
    );

    execute format('drop policy if exists %I on public.%I', 'delete_' || r.table_name, r.table_name);
    execute format(
      'create policy %I on public.%I for delete using (public.user_can_access_shop(shop_id) and public.has_permission(%L))',
      'delete_' || r.table_name,
      r.table_name,
      r.delete_perm
    );
  end loop;
end
$$;

grant select, insert, update, delete on
  public.customers,
  public.suppliers,
  public.warehouses,
  public.item_groups,
  public.item_types,
  public.units,
  public.items,
  public.menu_items,
  public.menu_item_variants,
  public.price_books,
  public.price_book_items
to authenticated;

-- Phase 0 foundation for MealFit Ops
-- Canonical RBAC + auth/shop context + audit base.

create extension if not exists pgcrypto;
create sequence if not exists public.roles_id_seq as bigint;
create sequence if not exists public.permissions_id_seq as bigint;

do $$
begin
  if to_regtype('public.app_scope_type') is null then
    create type public.app_scope_type as enum ('system', 'company', 'event', 'self');
  end if;
end
$$;

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception
      'Missing base storefront schema. Apply 20260316230000_storefront_base.sql before this migration.';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Normalize legacy profile roles to canonical codes
-- -----------------------------------------------------------------------------
update public.profiles
set role = case
  when role = 'admin' then 'system_admin'
  when role = 'editor' then 'employee'
  when role = 'shop_owner' then 'shop_admin'
  when role = 'staff' then 'employee'
  else role
end
where role in ('admin', 'editor', 'shop_owner', 'staff');

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('system_admin', 'shop_admin', 'employee', 'viewer'));

-- Keep legacy storefront policies working with canonical roles.
create or replace function public.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profiles
    where profiles.id = auth.uid()
      and profiles.role = 'system_admin'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profiles
    where profiles.id = auth.uid()
      and profiles.role in ('system_admin', 'shop_admin')
  );
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profiles
    where profiles.id = auth.uid()
      and profiles.role in ('system_admin', 'shop_admin', 'employee')
  );
$$;

-- -----------------------------------------------------------------------------
-- Global tables
-- -----------------------------------------------------------------------------
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  name text not null,
  address text,
  phone text,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  currency_code text not null default 'VND',
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_shops_default
  on public.shops (is_default)
  where is_default = true;

drop trigger if exists trg_shops_updated_at on public.shops;
create trigger trg_shops_updated_at
before update on public.shops
for each row
execute function public.set_updated_at();

create table if not exists public.roles (
  id bigint primary key default nextval('public.roles_id_seq'::regclass),
  key text unique,
  code text unique,
  name text not null,
  default_scope app_scope_type not null default 'company',
  scope text not null check (scope in ('global', 'shop')),
  description text,
  is_system_role boolean not null default false,
  is_system boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.roles
  add column if not exists key text,
  add column if not exists code text,
  add column if not exists default_scope app_scope_type not null default 'company',
  add column if not exists scope text,
  add column if not exists is_system_role boolean not null default false,
  add column if not exists is_system boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.roles
  alter column key drop not null;

update public.roles
set
  key = coalesce(key, code),
  code = coalesce(code, key),
  scope = coalesce(
    scope,
    case
      when coalesce(code, key) = 'system_admin' then 'global'
      else 'shop'
    end
  ),
  is_system_role = coalesce(is_system_role, is_system),
  is_system = coalesce(is_system, is_system_role),
  sort_order = coalesce(sort_order, 0),
  metadata = coalesce(metadata, '{}'::jsonb)
where key is null or code is null or scope is null or is_system is null or is_system_role is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'roles'
      and column_name = 'id'
      and is_identity = 'NO'
  ) then
    alter table public.roles
      alter column id set default nextval('public.roles_id_seq'::regclass);

    perform setval(
      'public.roles_id_seq',
      greatest(coalesce((select max(id) from public.roles), 0), 1),
      true
    );
  end if;
end
$$;

create unique index if not exists uq_roles_code on public.roles (code);

drop trigger if exists trg_roles_updated_at on public.roles;
create trigger trg_roles_updated_at
before update on public.roles
for each row
execute function public.set_updated_at();

create table if not exists public.permissions (
  id bigint primary key default nextval('public.permissions_id_seq'::regclass),
  key text unique,
  code text unique,
  name text not null,
  resource text,
  action text,
  module text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.permissions
  add column if not exists key text,
  add column if not exists code text,
  add column if not exists name text,
  add column if not exists resource text,
  add column if not exists action text,
  add column if not exists module text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true;

alter table if exists public.permissions
  alter column key drop not null;

alter table if exists public.permissions
  alter column resource drop not null,
  alter column action drop not null;

update public.permissions
set
  key = coalesce(key, code),
  code = coalesce(code, key, case when resource is not null and action is not null then resource || '.' || action end),
  name = coalesce(name, initcap(replace(coalesce(code, key, resource || '_' || action, 'permission'), '_', ' '))),
  module = coalesce(module, resource, split_part(coalesce(code, key, ''), '.', 1), 'system'),
  sort_order = coalesce(sort_order, 0),
  is_active = coalesce(is_active, true)
where key is null or code is null or name is null or module is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'permissions'
      and column_name = 'id'
      and is_identity = 'NO'
  ) then
    alter table public.permissions
      alter column id set default nextval('public.permissions_id_seq'::regclass);

    perform setval(
      'public.permissions_id_seq',
      greatest(coalesce((select max(id) from public.permissions), 0), 1),
      true
    );
  end if;
end
$$;

create unique index if not exists uq_permissions_code on public.permissions (code);

drop trigger if exists trg_permissions_updated_at on public.permissions;
create trigger trg_permissions_updated_at
before update on public.permissions
for each row
execute function public.set_updated_at();

create table if not exists public.role_permissions (
  role_id bigint not null references public.roles(id) on delete cascade,
  permission_id bigint not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.user_shop_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  role_id bigint not null references public.roles(id) on delete restrict,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_user_shop_roles_user_global
  on public.user_shop_roles (user_id)
  where shop_id is null;

create unique index if not exists uq_user_shop_roles_user_shop
  on public.user_shop_roles (user_id, shop_id)
  where shop_id is not null;

create index if not exists idx_user_shop_roles_user_active
  on public.user_shop_roles (user_id, is_active, is_primary);

create index if not exists idx_user_shop_roles_shop_active
  on public.user_shop_roles (shop_id, is_active);

drop trigger if exists trg_user_shop_roles_updated_at on public.user_shop_roles;
create trigger trg_user_shop_roles_updated_at
before update on public.user_shop_roles
for each row
execute function public.set_updated_at();

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  primary_shop_id uuid references public.shops(id) on delete set null,
  employee_code text,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  is_active boolean not null default true,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_employees_employee_code
  on public.employees (employee_code)
  where employee_code is not null;

drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
before update on public.employees
for each row
execute function public.set_updated_at();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role_snapshot text,
  action text not null,
  entity_name text not null,
  entity_id uuid,
  entity_code text,
  message text,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_shop_created
  on public.audit_logs (shop_id, created_at desc);

create index if not exists idx_audit_logs_actor_created
  on public.audit_logs (actor_user_id, created_at desc);

create index if not exists idx_audit_logs_entity_created
  on public.audit_logs (entity_name, entity_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Seed canonical roles and permissions
-- -----------------------------------------------------------------------------
insert into public.roles (
  code,
  name,
  scope,
  description,
  is_system,
  sort_order,
  is_active
)
values
  (
    'system_admin',
    'System admin',
    'global',
    'Toàn quyền trên toàn hệ thống và toàn bộ shop.',
    true,
    1,
    true
  ),
  (
    'shop_admin',
    'Shop admin',
    'shop',
    'Quản trị nghiệp vụ trong phạm vi shop được gán.',
    false,
    2,
    true
  ),
  (
    'employee',
    'Employee',
    'shop',
    'Nhân sự tác nghiệp theo quyền được cấp.',
    false,
    3,
    true
  )
on conflict (code) do update
set name = excluded.name,
    scope = excluded.scope,
    description = excluded.description,
    is_system = excluded.is_system,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();

update public.roles
set key = coalesce(key, code)
where key is null;

insert into public.permissions (code, name, module, sort_order, is_active)
values
  ('system.shop.read', 'Read shops', 'system', 1, true),
  ('system.shop.create', 'Create shop', 'system', 2, true),
  ('system.shop.update', 'Update shop', 'system', 3, true),
  ('system.shop.disable', 'Disable shop', 'system', 4, true),
  ('system.user.assign_role', 'Assign user role', 'system', 5, true),
  ('system.audit.read_all', 'Read audit log', 'system', 6, true),
  ('master.customer.read', 'Read customers', 'master', 10, true),
  ('master.customer.create', 'Create customers', 'master', 11, true),
  ('master.customer.update', 'Update customers', 'master', 12, true),
  ('master.customer.delete', 'Delete customers', 'master', 13, true),
  ('master.employee.read', 'Read employees', 'master', 14, true),
  ('master.employee.create', 'Create employees', 'master', 15, true),
  ('master.employee.update', 'Update employees', 'master', 16, true),
  ('master.item.read', 'Read items', 'master', 20, true),
  ('master.item.create', 'Create items', 'master', 21, true),
  ('master.item.update', 'Update items', 'master', 22, true),
  ('master.item.delete', 'Delete items', 'master', 23, true),
  ('master.menu.read', 'Read menu', 'master', 24, true),
  ('master.menu.create', 'Create menu', 'master', 25, true),
  ('master.menu.update', 'Update menu', 'master', 26, true),
  ('master.price_book.read', 'Read price books', 'master', 30, true),
  ('master.price_book.create', 'Create price books', 'master', 31, true),
  ('master.price_book.update', 'Update price books', 'master', 32, true),
  ('master.price_book.activate', 'Activate price book', 'master', 33, true),
  ('master.warehouse.read', 'Read warehouses', 'master', 34, true),
  ('master.warehouse.create', 'Create warehouses', 'master', 35, true),
  ('master.warehouse.update', 'Update warehouses', 'master', 36, true),
  ('master.supplier.read', 'Read suppliers', 'master', 37, true),
  ('master.supplier.create', 'Create suppliers', 'master', 38, true),
  ('master.supplier.update', 'Update suppliers', 'master', 39, true),
  ('sales.order.read', 'Read orders', 'sales', 50, true),
  ('sales.order.create', 'Create orders', 'sales', 51, true),
  ('sales.order.update_draft', 'Update draft order', 'sales', 52, true),
  ('sales.order.send', 'Send order', 'sales', 53, true),
  ('sales.order.confirm', 'Confirm order', 'sales', 54, true),
  ('sales.order.cancel', 'Cancel order', 'sales', 55, true),
  ('sales.order.refresh_price', 'Refresh order price', 'sales', 56, true),
  ('sales.order.override_price', 'Override order price', 'sales', 57, true),
  ('sales.discount.apply', 'Apply discount', 'sales', 58, true),
  ('sales.discount.override', 'Override discount', 'sales', 59, true),
  ('sales.bill.read', 'Read bills', 'sales', 60, true),
  ('sales.bill.export', 'Export bills', 'sales', 61, true),
  ('sales.payment.read', 'Read payments', 'sales', 62, true),
  ('sales.payment.record', 'Record payment', 'sales', 63, true),
  ('sales.payment.refund', 'Refund payment', 'sales', 64, true),
  ('inventory.receipt.read', 'Read receipts', 'inventory', 70, true),
  ('inventory.receipt.create', 'Create receipts', 'inventory', 71, true),
  ('inventory.receipt.post', 'Post receipt', 'inventory', 72, true),
  ('inventory.issue.read', 'Read issues', 'inventory', 73, true),
  ('inventory.issue.create', 'Create issues', 'inventory', 74, true),
  ('inventory.issue.post', 'Post issue', 'inventory', 75, true),
  ('inventory.adjustment.read', 'Read adjustments', 'inventory', 76, true),
  ('inventory.adjustment.create', 'Create adjustments', 'inventory', 77, true),
  ('inventory.adjustment.post', 'Post adjustments', 'inventory', 78, true),
  ('inventory.stock.read', 'Read stock', 'inventory', 79, true),
  ('inventory.stock.read_cost', 'Read stock cost', 'inventory', 80, true),
  ('inventory.fefo.override', 'Override FEFO', 'inventory', 81, true),
  ('inventory.expired.override', 'Override expired stock', 'inventory', 82, true),
  ('inventory.negative_stock.override', 'Override negative stock', 'inventory', 83, true),
  ('report.sales.read', 'Read sales report', 'report', 90, true),
  ('report.sales.export', 'Export sales report', 'report', 91, true),
  ('report.inventory.read', 'Read inventory report', 'report', 92, true),
  ('report.inventory.export', 'Export inventory report', 'report', 93, true),
  ('report.audit.read', 'Read audit report', 'report', 94, true)
on conflict (code) do update
set name = excluded.name,
    module = excluded.module,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();

update public.permissions
set key = coalesce(key, code)
where key is null;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles roles
join public.permissions permissions on true
where roles.code = 'system_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles roles
join public.permissions permissions on true
where roles.code = 'shop_admin'
  and permissions.code not like 'system.%'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles roles
join public.permissions permissions on true
where roles.code = 'employee'
  and permissions.code in (
    'master.customer.read',
    'master.employee.read',
    'master.item.read',
    'master.menu.read',
    'master.price_book.read',
    'master.warehouse.read',
    'master.supplier.read',
    'sales.order.read',
    'sales.order.create',
    'sales.order.update_draft',
    'sales.order.send',
    'sales.bill.read',
    'sales.payment.read',
    'sales.payment.record',
    'inventory.receipt.read',
    'inventory.receipt.create',
    'inventory.issue.read',
    'inventory.issue.create',
    'inventory.adjustment.read',
    'inventory.adjustment.create',
    'inventory.stock.read',
    'report.sales.read',
    'report.inventory.read'
  )
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------
create or replace function public.get_user_primary_role_code(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select 'system_admin'
      from public.user_shop_roles user_shop_roles
      join public.roles roles
        on roles.id = user_shop_roles.role_id
       and roles.is_active = true
      where user_shop_roles.user_id = p_user_id
        and user_shop_roles.is_active = true
        and roles.code = 'system_admin'
      limit 1
    ),
    (
      select roles.code
      from public.user_shop_roles user_shop_roles
      join public.roles roles
        on roles.id = user_shop_roles.role_id
       and roles.is_active = true
      where user_shop_roles.user_id = p_user_id
        and user_shop_roles.is_active = true
      order by user_shop_roles.is_primary desc, user_shop_roles.assigned_at asc
      limit 1
    ),
    (
      select profiles.role
      from public.profiles profiles
      where profiles.id = p_user_id
      limit 1
    ),
    'viewer'
  );
$$;

create or replace function public.get_user_primary_role_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public.get_user_primary_role_code(auth.uid());
$$;

create or replace function public.get_user_primary_shop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select user_shop_roles.shop_id
      from public.user_shop_roles user_shop_roles
      where user_shop_roles.user_id = auth.uid()
        and user_shop_roles.is_active = true
      order by user_shop_roles.is_primary desc, user_shop_roles.assigned_at asc
      limit 1
    ),
    (
      select employees.primary_shop_id
      from public.employees employees
      where employees.user_id = auth.uid()
      limit 1
    ),
    (
      select shops.id
      from public.shops shops
      where shops.is_default = true
        and shops.is_active = true
      order by shops.created_at asc
      limit 1
    )
  );
$$;

create or replace function public.user_can_access_shop(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_shop_id is not null
    and (
      public.is_system_admin()
      or exists (
        select 1
        from public.user_shop_roles user_shop_roles
        join public.roles roles
          on roles.id = user_shop_roles.role_id
         and roles.is_active = true
        where user_shop_roles.user_id = auth.uid()
          and user_shop_roles.is_active = true
          and (user_shop_roles.shop_id = p_shop_id or roles.code = 'system_admin')
      )
    );
$$;

create or replace function public.has_permission(p_permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_system_admin()
    or exists (
      select 1
      from public.user_shop_roles user_shop_roles
      join public.roles roles
        on roles.id = user_shop_roles.role_id
       and roles.is_active = true
      join public.role_permissions role_permissions
        on role_permissions.role_id = roles.id
      join public.permissions permissions
        on permissions.id = role_permissions.permission_id
       and permissions.is_active = true
      where user_shop_roles.user_id = auth.uid()
        and user_shop_roles.is_active = true
        and permissions.code = p_permission_code
    );
$$;

create or replace function public.log_audit_event(
  p_shop_id uuid,
  p_action text,
  p_entity_name text,
  p_entity_id uuid default null,
  p_entity_code text default null,
  p_message text default null,
  p_before_json jsonb default null,
  p_after_json jsonb default null,
  p_metadata_json jsonb default '{}'::jsonb,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns public.audit_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit public.audit_logs;
begin
  insert into public.audit_logs (
    shop_id,
    actor_user_id,
    actor_role_snapshot,
    action,
    entity_name,
    entity_id,
    entity_code,
    message,
    before_json,
    after_json,
    metadata_json,
    ip_address,
    user_agent
  )
  values (
    p_shop_id,
    auth.uid(),
    public.get_user_primary_role_code(),
    p_action,
    p_entity_name,
    p_entity_id,
    p_entity_code,
    p_message,
    p_before_json,
    p_after_json,
    coalesce(p_metadata_json, '{}'::jsonb),
    p_ip_address,
    p_user_agent
  )
  returning * into v_audit;

  return v_audit;
end;
$$;

create or replace function public.assign_user_shop_role(
  p_user_id uuid,
  p_shop_id uuid,
  p_role_code text,
  p_is_primary boolean default true
)
returns public.user_shop_roles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_role public.roles%rowtype;
  v_effective_shop_id uuid := p_shop_id;
  v_existing public.user_shop_roles;
  v_has_existing boolean;
  v_assignment public.user_shop_roles;
  v_profile_role text;
  v_employee_shop_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.has_permission('system.user.assign_role') then
    raise exception 'Permission denied';
  end if;

  select *
  into v_role
  from public.roles
  where code = p_role_code
    and is_active = true
  limit 1;

  if not found then
    raise exception 'Role not found';
  end if;

  if v_role.code = 'system_admin' then
    v_effective_shop_id := null;
  elsif v_role.scope = 'shop' and v_effective_shop_id is null then
    raise exception 'Shop is required for shop-scoped roles';
  end if;

  select *
  into v_existing
  from public.user_shop_roles
  where user_id = p_user_id
    and (
      (shop_id is null and v_effective_shop_id is null)
    or shop_id = v_effective_shop_id
  )
  limit 1;
  v_has_existing := v_existing.id is not null;

  if p_is_primary or v_role.code = 'system_admin' then
    update public.user_shop_roles
    set is_primary = false,
        updated_at = now()
    where user_id = p_user_id
      and is_active = true
      and id is distinct from coalesce(v_existing.id, '00000000-0000-0000-0000-000000000000'::uuid);
  end if;

  if v_has_existing then
    update public.user_shop_roles
    set role_id = v_role.id,
        shop_id = v_effective_shop_id,
        is_primary = coalesce(p_is_primary, false) or v_role.code = 'system_admin',
        is_active = true,
        assigned_by = v_actor_id,
        assigned_at = now(),
        revoked_by = null,
        revoked_at = null,
        updated_at = now()
    where id = v_existing.id
    returning * into v_assignment;
  else
    insert into public.user_shop_roles (
      user_id,
      shop_id,
      role_id,
      is_primary,
      is_active,
      assigned_by,
      assigned_at
    )
    values (
      p_user_id,
      v_effective_shop_id,
      v_role.id,
      coalesce(p_is_primary, false) or v_role.code = 'system_admin',
      true,
      v_actor_id,
      now()
    )
    returning * into v_assignment;
  end if;

  v_employee_shop_id := coalesce(
    v_effective_shop_id,
    (
      select user_shop_roles.shop_id
      from public.user_shop_roles user_shop_roles
      where user_shop_roles.user_id = p_user_id
        and user_shop_roles.is_active = true
      order by user_shop_roles.is_primary desc, user_shop_roles.assigned_at asc
      limit 1
    ),
    (
      select employees.primary_shop_id
      from public.employees employees
      where employees.user_id = p_user_id
      limit 1
    ),
    (
      select shops.id
      from public.shops shops
      where shops.is_default = true
        and shops.is_active = true
      order by shops.created_at asc
      limit 1
    )
  );

  insert into public.employees (
    user_id,
    primary_shop_id,
    full_name,
    email,
    is_active,
    notes
  )
  select
    p_user_id,
    v_employee_shop_id,
    coalesce(
      (select profiles.full_name from public.profiles profiles where profiles.id = p_user_id limit 1),
      (select split_part(users.email, '@', 1) from auth.users users where users.id = p_user_id limit 1),
      'Employee'
    ),
    coalesce(
      (select profiles.email from public.profiles profiles where profiles.id = p_user_id limit 1),
      (select users.email from auth.users users where users.id = p_user_id limit 1)
    ),
    true,
    'Synced from role assignment'
  on conflict (user_id) do update
  set primary_shop_id = excluded.primary_shop_id,
      full_name = excluded.full_name,
      email = excluded.email,
      is_active = excluded.is_active,
      notes = excluded.notes,
      updated_at = now();

  v_profile_role := public.get_user_primary_role_code(p_user_id);

  update public.profiles
  set role = v_profile_role,
      updated_at = now()
  where id = p_user_id;

  perform public.log_audit_event(
    v_effective_shop_id,
    'role_assign',
    'user_shop_role',
    v_assignment.id,
    v_role.code,
    format('Assigned %s to %s', v_role.code, p_user_id::text),
    case
      when v_existing.id is null then null
      else to_jsonb(v_existing)
    end,
    to_jsonb(v_assignment),
    jsonb_build_object('is_primary', v_assignment.is_primary)
  );

  return v_assignment;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS policies
-- -----------------------------------------------------------------------------
alter table public.shops enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_shop_roles enable row level security;
alter table public.employees enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Authenticated can read roles" on public.roles;
create policy "Authenticated can read roles"
on public.roles
for select
to authenticated
using (is_active = true);

drop policy if exists "Authenticated can read permissions" on public.permissions;
create policy "Authenticated can read permissions"
on public.permissions
for select
to authenticated
using (is_active = true);

drop policy if exists "Authenticated can read role permissions" on public.role_permissions;
create policy "Authenticated can read role permissions"
on public.role_permissions
for select
to authenticated
using (true);

drop policy if exists "Users can read accessible shops" on public.shops;
create policy "Users can read accessible shops"
on public.shops
for select
using (public.user_can_access_shop(id) or public.has_permission('system.shop.read'));

drop policy if exists "System admins can manage shops" on public.shops;
create policy "System admins can manage shops"
on public.shops
for all
using (
  public.has_permission('system.shop.create')
  or public.has_permission('system.shop.update')
  or public.has_permission('system.shop.disable')
)
with check (
  public.has_permission('system.shop.create')
  or public.has_permission('system.shop.update')
  or public.has_permission('system.shop.disable')
);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (id = auth.uid() or public.has_permission('system.user.assign_role'));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (id = auth.uid() or public.has_permission('system.user.assign_role'))
with check (id = auth.uid() or public.has_permission('system.user.assign_role'));

drop policy if exists "Users can read user shop roles" on public.user_shop_roles;
create policy "Users can read user shop roles"
on public.user_shop_roles
for select
using (user_id = auth.uid() or public.has_permission('system.user.assign_role'));

drop policy if exists "Employees can read their own record" on public.employees;
create policy "Employees can read their own record"
on public.employees
for select
using (
  user_id = auth.uid()
  or public.has_permission('system.user.assign_role')
  or public.user_can_access_shop(primary_shop_id)
);

drop policy if exists "Audit logs can be read by system admins" on public.audit_logs;
create policy "Audit logs can be read by system admins"
on public.audit_logs
for select
using (public.has_permission('system.audit.read_all'));

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
grant select on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant select on public.shops to authenticated;
grant select on public.user_shop_roles to authenticated;
grant select on public.employees to authenticated;
grant select on public.audit_logs to authenticated;

grant execute on function public.get_user_primary_role_code() to authenticated;
grant execute on function public.get_user_primary_role_code(uuid) to authenticated;
grant execute on function public.get_user_primary_shop_id() to authenticated;
grant execute on function public.user_can_access_shop(uuid) to authenticated;
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.log_audit_event(uuid, text, text, uuid, text, text, jsonb, jsonb, jsonb, inet, text) to authenticated;
grant execute on function public.assign_user_shop_role(uuid, uuid, text, boolean) to authenticated;

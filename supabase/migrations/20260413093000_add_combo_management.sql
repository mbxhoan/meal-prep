-- Combo management: combo master + combo items + order item snapshot columns.

do $$
begin
  if to_regclass('public.shops') is null
    or to_regclass('public.menu_items') is null
    or to_regclass('public.menu_item_variants') is null
    or to_regclass('public.price_books') is null
    or to_regclass('public.price_book_items') is null
    or to_regclass('public.sales_orders') is null
    or to_regclass('public.sales_order_items') is null
    or to_regprocedure('public.has_permission(text)') is null
    or to_regprocedure('public.user_can_access_shop(uuid)') is null
    or to_regprocedure('public.set_master_data_audit_columns()') is null
    or to_regprocedure('public.audit_master_data_change()') is null
    or to_regprocedure('public.set_sales_audit_columns()') is null
    or to_regprocedure('public.audit_sales_change()') is null then
    raise exception
      'Missing base schema or audit helpers. Apply Phase 0–2 migrations before combo management.';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Combo tables
-- -----------------------------------------------------------------------------
create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  name text not null,
  sale_price numeric(18,2) not null default 0,
  default_sale_price numeric(18,2) not null default 0,
  total_cost numeric(18,2) not null default 0,
  gross_profit numeric(18,2) not null default 0,
  gross_margin numeric(18,4) not null default 0,
  notes text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, code),
  check (sale_price >= 0),
  check (default_sale_price >= 0),
  check (total_cost >= 0)
);

create table if not exists public.combo_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  combo_id uuid not null references public.combos(id) on delete cascade,
  menu_item_variant_id uuid not null references public.menu_item_variants(id) on delete restrict,
  quantity numeric(18,3) not null default 1,
  unit_sale_price_snapshot numeric(18,2) not null default 0,
  unit_cost_snapshot numeric(18,2) not null default 0,
  line_sale_total numeric(18,2) not null default 0,
  line_cost_total numeric(18,2) not null default 0,
  display_text text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  notes text,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quantity > 0),
  check (unit_sale_price_snapshot >= 0),
  check (unit_cost_snapshot >= 0),
  check (line_sale_total >= 0),
  check (line_cost_total >= 0)
);

create unique index if not exists uq_combos_shop_code
  on public.combos (shop_id, code);

create index if not exists idx_combos_shop_updated
  on public.combos (shop_id, updated_at desc);

create index if not exists idx_combo_items_combo
  on public.combo_items (shop_id, combo_id, sort_order);

create index if not exists idx_combo_items_variant
  on public.combo_items (menu_item_variant_id);

-- -----------------------------------------------------------------------------
-- Sales order snapshot columns for combo lines
-- -----------------------------------------------------------------------------
alter table public.sales_order_items
  add column if not exists item_type text;

alter table public.sales_order_items
  add column if not exists combo_id_snapshot uuid references public.combos(id) on delete set null;

alter table public.sales_order_items
  add column if not exists combo_code_snapshot text;

alter table public.sales_order_items
  add column if not exists combo_name_snapshot text;

alter table public.sales_order_items
  add column if not exists combo_default_sale_price_snapshot numeric(18,2);

alter table public.sales_order_items
  add column if not exists combo_components_snapshot jsonb;

update public.sales_order_items
set item_type = coalesce(item_type, 'menu_item')
where item_type is null;

alter table public.sales_order_items
  alter column item_type set default 'menu_item';

alter table public.sales_order_items
  alter column item_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_sales_order_items_item_type'
  ) then
    alter table public.sales_order_items
      add constraint chk_sales_order_items_item_type
      check (item_type in ('menu_item', 'combo'));
  end if;
end
$$;

create index if not exists idx_sales_order_items_combo_snapshot
  on public.sales_order_items (combo_id_snapshot)
  where combo_id_snapshot is not null;

-- -----------------------------------------------------------------------------
-- Combo snapshot helpers
-- -----------------------------------------------------------------------------
create or replace function public.calculate_combo_item_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price_book_id uuid;
  v_menu_item_name text;
  v_variant_label text;
  v_weight_grams numeric(18,3);
  v_unit_sale_price numeric(18,2);
  v_unit_cost numeric(18,2);
begin
  if new.menu_item_variant_id is null then
    return new;
  end if;

  select id
  into v_price_book_id
  from public.price_books
  where shop_id = new.shop_id
    and deleted_at is null
    and is_active = true
    and status = 'active'
    and (effective_from is null or effective_from <= current_date)
    and (effective_to is null or effective_to >= current_date)
  order by coalesce(effective_from, date '1900-01-01') desc, updated_at desc
  limit 1;

  select
    mi.name,
    miv.label,
    miv.weight_grams,
    coalesce(pbi.sale_price, 0),
    coalesce(pbi.standard_cost, 0)
  into
    v_menu_item_name,
    v_variant_label,
    v_weight_grams,
    v_unit_sale_price,
    v_unit_cost
  from public.menu_item_variants miv
  join public.menu_items mi on mi.id = miv.menu_item_id
  left join public.price_book_items pbi
    on pbi.menu_item_variant_id = miv.id
   and pbi.price_book_id = v_price_book_id
   and pbi.deleted_at is null
   and pbi.is_active = true
  where miv.id = new.menu_item_variant_id
    and miv.shop_id = new.shop_id
  limit 1;

  new.unit_sale_price_snapshot := coalesce(new.unit_sale_price_snapshot, v_unit_sale_price, 0);
  new.unit_cost_snapshot := coalesce(new.unit_cost_snapshot, v_unit_cost, 0);
  new.line_sale_total := round(coalesce(new.quantity, 0) * coalesce(new.unit_sale_price_snapshot, 0), 2);
  new.line_cost_total := round(coalesce(new.quantity, 0) * coalesce(new.unit_cost_snapshot, 0), 2);

  if coalesce(new.display_text, '') = '' then
    new.display_text := trim(both ' ' from concat_ws(
      ' ',
      coalesce(v_menu_item_name, 'Món'),
      v_variant_label,
      case
        when v_weight_grams is null then null
        else v_weight_grams::text || 'g'
      end,
      'x' || coalesce(new.quantity, 0)::text
    ));
  end if;

  return new;
end;
$$;

create or replace function public.recompute_combo_summary(p_combo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_default_sale_price numeric(18,2);
  v_total_cost numeric(18,2);
  v_sale_price numeric(18,2);
begin
  select
    coalesce(sum(line_sale_total), 0),
    coalesce(sum(line_cost_total), 0)
  into v_default_sale_price, v_total_cost
  from public.combo_items
  where combo_id = p_combo_id
    and deleted_at is null
    and is_active = true;

  select sale_price
  into v_sale_price
  from public.combos
  where id = p_combo_id;

  if coalesce(v_sale_price, 0) <= 0 then
    v_sale_price := v_default_sale_price;
  end if;

  update public.combos
  set default_sale_price = v_default_sale_price,
      total_cost = v_total_cost,
      sale_price = v_sale_price,
      gross_profit = round(coalesce(v_sale_price, 0) - v_total_cost, 2),
      gross_margin = case
        when coalesce(v_sale_price, 0) > 0
        then round((coalesce(v_sale_price, 0) - v_total_cost) / v_sale_price, 4)
        else 0
      end
  where id = p_combo_id;
end;
$$;

create or replace function public.calculate_combo_financials()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.default_sale_price := coalesce(new.default_sale_price, 0);
  new.total_cost := coalesce(new.total_cost, 0);

  if coalesce(new.sale_price, 0) <= 0 then
    new.sale_price := new.default_sale_price;
  end if;

  new.gross_profit := round(coalesce(new.sale_price, 0) - coalesce(new.total_cost, 0), 2);
  new.gross_margin := case
    when coalesce(new.sale_price, 0) > 0
    then round((coalesce(new.sale_price, 0) - coalesce(new.total_cost, 0)) / new.sale_price, 4)
    else 0
  end;

  return new;
end;
$$;

create or replace function public.sync_combo_summary_from_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_combo_summary(coalesce(new.combo_id, old.combo_id));
  return coalesce(new, old);
end;
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
drop trigger if exists trg_combos_touch on public.combos;
create trigger trg_combos_touch
before insert or update on public.combos
for each row
execute function public.set_master_data_audit_columns();

drop trigger if exists trg_combos_financials on public.combos;
create trigger trg_combos_financials
before insert or update on public.combos
for each row
execute function public.calculate_combo_financials();

drop trigger if exists trg_combos_audit on public.combos;
create trigger trg_combos_audit
after insert or update or delete on public.combos
for each row
execute function public.audit_master_data_change();

drop trigger if exists trg_combo_items_touch on public.combo_items;
create trigger trg_combo_items_touch
before insert or update on public.combo_items
for each row
execute function public.set_master_data_audit_columns();

drop trigger if exists trg_combo_items_snapshot on public.combo_items;
create trigger trg_combo_items_snapshot
before insert or update on public.combo_items
for each row
execute function public.calculate_combo_item_snapshot();

drop trigger if exists trg_combo_items_sync on public.combo_items;
create trigger trg_combo_items_sync
after insert or update or delete on public.combo_items
for each row
execute function public.sync_combo_summary_from_items();

drop trigger if exists trg_combo_items_audit on public.combo_items;
create trigger trg_combo_items_audit
after insert or update or delete on public.combo_items
for each row
execute function public.audit_master_data_change();

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
        ('combos', 'master.menu.read', 'master.menu.create', 'master.menu.update', 'master.menu.delete'),
        ('combo_items', 'master.menu.read', 'master.menu.create', 'master.menu.update', 'master.menu.delete')
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
  public.combos,
  public.combo_items
to authenticated;

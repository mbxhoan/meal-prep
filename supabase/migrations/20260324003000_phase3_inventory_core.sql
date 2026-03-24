-- Phase 3 inventory core for MealFit
-- Lot receipts / issues / movement ledger / FEFO suggestions.

do $$
begin
  if to_regclass('public.inventory_items') is null
    or to_regclass('public.inventory_lots') is null
    or to_regclass('public.inventory_movements') is null
    or to_regclass('public.warehouses') is null
    or to_regclass('public.suppliers') is null
    or to_regprocedure('public.has_permission(text)') is null
    or to_regprocedure('public.user_can_access_shop(uuid)') is null
    or to_regprocedure('public.log_audit_event(uuid,text,text,uuid,text,text,jsonb,jsonb,jsonb,inet,text)') is null then
    raise exception
      'Missing inventory foundation. Apply Phase 0/1 and tracking foundation before this migration.';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Extend inventory lots and movement ledger
-- -----------------------------------------------------------------------------
alter table public.inventory_lots
  add column if not exists shop_id uuid references public.shops(id) on delete cascade,
  add column if not exists item_id uuid references public.inventory_items(id) on delete restrict,
  add column if not exists warehouse_id uuid references public.warehouses(id) on delete set null,
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;

update public.inventory_lots
set item_id = coalesce(item_id, inventory_item_id)
where item_id is null;

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

  update public.inventory_lots
  set shop_id = v_default_shop_id
  where shop_id is null;
end
$$;

create index if not exists idx_inventory_lots_shop_item
  on public.inventory_lots (shop_id, item_id, warehouse_id);

create index if not exists idx_inventory_lots_item_expired
  on public.inventory_lots (item_id, expired_at, received_at);

create index if not exists idx_inventory_lots_barcode
  on public.inventory_lots (lot_barcode)
  where lot_barcode is not null;

create or replace function public.sync_inventory_lot_keys()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.item_id = coalesce(new.item_id, new.inventory_item_id);
  new.inventory_item_id = coalesce(new.inventory_item_id, new.item_id);
  new.received_at = coalesce(new.received_at, now());
  return new;
end;
$$;

drop trigger if exists trg_inventory_lots_sync_keys on public.inventory_lots;
create trigger trg_inventory_lots_sync_keys
before insert or update on public.inventory_lots
for each row
execute function public.sync_inventory_lot_keys();

create or replace function public.audit_inventory_lot_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_after jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_action text := case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end;
  v_shop_id uuid := nullif(coalesce(v_after ->> 'shop_id', v_before ->> 'shop_id'), '')::uuid;
  v_entity_id uuid := nullif(coalesce(v_after ->> 'id', v_before ->> 'id'), '')::uuid;
  v_entity_code text := nullif(
    coalesce(
      v_after ->> 'lot_no',
      v_after ->> 'lot_barcode',
      v_before ->> 'lot_no',
      v_before ->> 'lot_barcode'
    ),
    ''
  );
begin
  perform public.log_audit_event(
    p_shop_id := v_shop_id,
    p_action := v_action,
    p_entity_name := tg_table_name,
    p_entity_id := v_entity_id,
    p_entity_code := v_entity_code,
    p_message := format('%s %s', tg_table_name, v_action),
    p_before_json := v_before,
    p_after_json := v_after,
    p_metadata_json := jsonb_build_object('table', tg_table_name),
    p_ip_address := null,
    p_user_agent := null
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_inventory_lots_audit on public.inventory_lots;
create trigger trg_inventory_lots_audit
after insert or update or delete on public.inventory_lots
for each row
execute function public.audit_inventory_lot_change();

alter table public.inventory_movements
  add column if not exists shop_id uuid references public.shops(id) on delete cascade,
  add column if not exists item_id uuid references public.inventory_items(id) on delete restrict,
  add column if not exists warehouse_id uuid references public.warehouses(id) on delete set null,
  add column if not exists lot_id uuid references public.inventory_lots(id) on delete set null,
  add column if not exists reference_line_id uuid,
  add column if not exists movement_at timestamptz not null default now();

update public.inventory_movements
set item_id = coalesce(item_id, inventory_item_id)
where item_id is null;

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

  update public.inventory_movements
  set shop_id = v_default_shop_id
  where shop_id is null;
end
$$;

alter table public.inventory_items
  add column if not exists minimum_stock_qty numeric(14,2) not null default 0;

alter table public.inventory_movements
  drop constraint if exists inventory_movements_movement_type_check;

alter table public.inventory_movements
  add constraint inventory_movements_movement_type_check
  check (movement_type in ('purchase', 'receipt', 'issue', 'adjustment', 'waste', 'order_consumption'));

create index if not exists idx_inventory_movements_shop_item_moved
  on public.inventory_movements (shop_id, item_id, movement_at desc);

create index if not exists idx_inventory_movements_lot_moved
  on public.inventory_movements (lot_id, movement_at desc);

create index if not exists idx_inventory_movements_reference
  on public.inventory_movements (reference_type, reference_id, reference_line_id);

create or replace function public.sync_inventory_movement_keys()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.item_id = coalesce(new.item_id, new.inventory_item_id);
  new.inventory_item_id = coalesce(new.inventory_item_id, new.item_id);
  new.movement_at = coalesce(new.movement_at, now());
  return new;
end;
$$;

drop trigger if exists trg_inventory_movements_sync_keys on public.inventory_movements;
create trigger trg_inventory_movements_sync_keys
before insert or update on public.inventory_movements
for each row
execute function public.sync_inventory_movement_keys();

create or replace function public.audit_inventory_movement_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_after jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_action text := case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end;
  v_shop_id uuid := nullif(coalesce(v_after ->> 'shop_id', v_before ->> 'shop_id'), '')::uuid;
  v_entity_id uuid := nullif(coalesce(v_after ->> 'id', v_before ->> 'id'), '')::uuid;
  v_entity_code text := nullif(
    coalesce(
      v_after ->> 'movement_type',
      v_after ->> 'reference_type',
      v_before ->> 'movement_type',
      v_before ->> 'reference_type'
    ),
    ''
  );
begin
  perform public.log_audit_event(
    p_shop_id := v_shop_id,
    p_action := v_action,
    p_entity_name := tg_table_name,
    p_entity_id := v_entity_id,
    p_entity_code := v_entity_code,
    p_message := format('%s %s', tg_table_name, v_action),
    p_before_json := v_before,
    p_after_json := v_after,
    p_metadata_json := jsonb_build_object('table', tg_table_name),
    p_ip_address := null,
    p_user_agent := null
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_inventory_movements_audit on public.inventory_movements;
create trigger trg_inventory_movements_audit
after insert or update or delete on public.inventory_movements
for each row
execute function public.audit_inventory_movement_change();

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

  insert into public.inventory_movements (
    shop_id,
    item_id,
    inventory_item_id,
    movement_type,
    quantity_delta,
    unit_cost,
    reference_type,
    reference_id,
    notes,
    created_by,
    movement_at
  )
  select
    v_default_shop_id,
    ii.id,
    ii.id,
    'adjustment',
    coalesce(ii.current_quantity, 0),
    coalesce(ii.average_unit_cost, 0),
    'opening_balance',
    ii.id,
    'Opening balance migrated from legacy inventory_items.current_quantity',
    null,
    coalesce(ii.created_at, now())
  from public.inventory_items ii
  where coalesce(ii.current_quantity, 0) <> 0
    and not exists (
      select 1
      from public.inventory_movements m
      where coalesce(m.item_id, m.inventory_item_id) = ii.id
    );
end
$$;

create or replace function public.apply_inventory_movement_effect()
returns trigger
language plpgsql
as $$
declare
  v_current_quantity numeric(14,2);
  v_average_cost numeric(14,2);
  v_new_quantity numeric(14,2);
begin
  if coalesce(new.reference_type, '') = 'opening_balance' then
    return new;
  end if;

  select current_quantity, average_unit_cost
  into v_current_quantity, v_average_cost
  from public.inventory_items
  where id = new.inventory_item_id
  for update;

  if not found then
    raise exception 'inventory item % not found', new.inventory_item_id;
  end if;

  v_new_quantity := v_current_quantity + coalesce(new.quantity_delta, 0);

  if v_new_quantity < 0 then
    raise exception 'insufficient inventory for item %', new.inventory_item_id;
  end if;

  update public.inventory_items
  set current_quantity = v_new_quantity,
      average_unit_cost = case
        when new.movement_type in ('purchase', 'receipt')
          and new.quantity_delta > 0
          and coalesce(new.unit_cost, 0) > 0
          and v_new_quantity > 0
        then round(
          ((v_current_quantity * v_average_cost) + (new.quantity_delta * new.unit_cost))
          / v_new_quantity,
          2
        )
        else average_unit_cost
      end,
      last_purchase_cost = case
        when new.movement_type in ('purchase', 'receipt') and coalesce(new.unit_cost, 0) > 0
        then new.unit_cost
        else last_purchase_cost
      end
  where id = new.inventory_item_id;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Receipt / issue headers and lines
-- -----------------------------------------------------------------------------
create table if not exists public.inventory_receipts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  receipt_no text not null,
  received_at timestamptz not null default now(),
  warehouse_id uuid not null references public.warehouses(id),
  supplier_id uuid references public.suppliers(id),
  status text not null default 'draft' check (status in ('draft', 'posted', 'cancelled')),
  note text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shop_id, receipt_no)
);

create table if not exists public.inventory_receipt_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  inventory_receipt_id uuid not null references public.inventory_receipts(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  lot_id uuid references public.inventory_lots(id) on delete set null,
  lot_no_snapshot text,
  lot_barcode_snapshot text,
  qty_received numeric(18,3) not null default 0 check (qty_received > 0),
  unit_cost numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  manufactured_at timestamptz,
  expired_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_issues (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  issue_no text not null,
  issued_at timestamptz not null default now(),
  warehouse_id uuid not null references public.warehouses(id),
  status text not null default 'draft' check (status in ('draft', 'posted', 'cancelled')),
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
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  lot_id uuid references public.inventory_lots(id) on delete set null,
  suggested_lot_id uuid references public.inventory_lots(id) on delete set null,
  lot_no_snapshot text,
  lot_barcode_snapshot text,
  qty_issued numeric(18,3) not null default 0 check (qty_issued > 0),
  fefo_overridden boolean not null default false,
  fefo_override_reason text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_receipts_shop_received
  on public.inventory_receipts (shop_id, received_at desc);

create index if not exists idx_inventory_receipt_items_receipt
  on public.inventory_receipt_items (inventory_receipt_id, created_at asc);

create index if not exists idx_inventory_issues_shop_issued
  on public.inventory_issues (shop_id, issued_at desc);

create index if not exists idx_inventory_issue_items_issue
  on public.inventory_issue_items (inventory_issue_id, created_at asc);

create or replace function public.sync_inventory_receipt_item_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.line_total = round(coalesce(new.qty_received, 0) * coalesce(new.unit_cost, 0), 2);
  return new;
end;
$$;

drop trigger if exists trg_inventory_receipt_items_total on public.inventory_receipt_items;
create trigger trg_inventory_receipt_items_total
before insert or update on public.inventory_receipt_items
for each row
execute function public.sync_inventory_receipt_item_total();

create or replace function public.audit_inventory_core_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_after jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_action text := case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end;
  v_shop_id uuid := nullif(coalesce(v_after ->> 'shop_id', v_before ->> 'shop_id'), '')::uuid;
  v_entity_id uuid := nullif(coalesce(v_after ->> 'id', v_before ->> 'id'), '')::uuid;
  v_entity_code text := nullif(
    coalesce(
      v_after ->> 'receipt_no',
      v_after ->> 'issue_no',
      v_after ->> 'lot_no_snapshot',
      v_after ->> 'lot_no',
      v_after ->> 'movement_type',
      v_before ->> 'receipt_no',
      v_before ->> 'issue_no',
      v_before ->> 'lot_no_snapshot',
      v_before ->> 'lot_no',
      v_before ->> 'movement_type'
    ),
    ''
  );
begin
  perform public.log_audit_event(
    p_shop_id := v_shop_id,
    p_action := v_action,
    p_entity_name := tg_table_name,
    p_entity_id := v_entity_id,
    p_entity_code := v_entity_code,
    p_message := format('%s %s', tg_table_name, v_action),
    p_before_json := v_before,
    p_after_json := v_after,
    p_metadata_json := jsonb_build_object('table', tg_table_name),
    p_ip_address := null,
    p_user_agent := null
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_inventory_receipts_audit on public.inventory_receipts;
create trigger trg_inventory_receipts_audit
after insert or update or delete on public.inventory_receipts
for each row
execute function public.audit_inventory_core_change();

drop trigger if exists trg_inventory_receipt_items_audit on public.inventory_receipt_items;
create trigger trg_inventory_receipt_items_audit
after insert or update or delete on public.inventory_receipt_items
for each row
execute function public.audit_inventory_core_change();

drop trigger if exists trg_inventory_issues_audit on public.inventory_issues;
create trigger trg_inventory_issues_audit
after insert or update or delete on public.inventory_issues
for each row
execute function public.audit_inventory_core_change();

drop trigger if exists trg_inventory_issue_items_audit on public.inventory_issue_items;
create trigger trg_inventory_issue_items_audit
after insert or update or delete on public.inventory_issue_items
for each row
execute function public.audit_inventory_core_change();

drop trigger if exists trg_inventory_movements_audit on public.inventory_movements;
create trigger trg_inventory_movements_audit
after insert or update or delete on public.inventory_movements
for each row
execute function public.audit_inventory_movement_change();

-- -----------------------------------------------------------------------------
-- FEFO helpers
-- -----------------------------------------------------------------------------
create or replace view public.v_inventory_stock_by_item as
with default_shop as (
  select id
  from public.shops
  order by is_default desc, created_at asc
  limit 1
),
movement_totals as (
  select
    shop_id,
    coalesce(item_id, inventory_item_id) as item_id,
    sum(coalesce(quantity_delta, 0)) as on_hand,
    max(movement_at) as last_movement_at
  from public.inventory_movements
  group by shop_id, coalesce(item_id, inventory_item_id)
),
lot_totals as (
  select
    l.shop_id,
    coalesce(item_id, inventory_item_id) as item_id,
    count(*) filter (where coalesce(sum_delta.on_hand, 0) > 0) as lot_count
  from public.inventory_lots l
  left join lateral (
    select coalesce(sum(quantity_delta), 0) as on_hand
    from public.inventory_movements m
    where m.lot_id = l.id
  ) sum_delta on true
  group by l.shop_id, coalesce(item_id, inventory_item_id)
)
select
  coalesce(movement_totals.shop_id, lot_totals.shop_id, default_shop.id) as shop_id,
  ii.id as item_id,
  ii.name as item_name,
  ii.sku,
  ii.unit,
  ii.tracking_mode,
  ii.is_expirable,
  ii.is_fefo_enabled,
  ii.requires_unit_label,
  ii.default_shelf_life_days,
  coalesce(nullif(ii.minimum_stock_qty, 0), ii.reorder_point, 0) as minimum_stock_qty,
  coalesce(nullif(ii.minimum_stock_qty, 0), ii.reorder_point, 0) as reorder_point,
  ii.average_unit_cost,
  ii.last_purchase_cost,
  ii.supplier_name,
  ii.notes,
  ii.is_active,
  coalesce(movement_totals.on_hand, 0) as on_hand,
  coalesce(lot_totals.lot_count, 0) as lot_count,
  coalesce(movement_totals.last_movement_at, ii.updated_at) as last_movement_at,
  round(coalesce(movement_totals.on_hand, 0) * coalesce(ii.average_unit_cost, 0), 2) as stock_value,
  case
    when coalesce(movement_totals.on_hand, 0) <= coalesce(nullif(ii.minimum_stock_qty, 0), ii.reorder_point, 0) then true
    else false
  end as is_low_stock
from public.inventory_items ii
cross join default_shop
left join movement_totals
  on movement_totals.item_id = ii.id
left join lot_totals
  on lot_totals.item_id = ii.id
 and lot_totals.shop_id = movement_totals.shop_id;

create or replace view public.v_inventory_stock_by_lot as
with lot_totals as (
  select
    l.id as lot_id,
    coalesce(l.item_id, l.inventory_item_id) as item_id,
    l.shop_id,
    l.warehouse_id,
    l.supplier_id,
    l.lot_no,
    l.lot_barcode,
    l.supplier_lot_no,
    l.manufactured_at,
    l.expired_at,
    l.received_at,
    l.status,
    l.notes,
    coalesce(sum(m.quantity_delta), 0) as on_hand,
    max(m.movement_at) as last_movement_at
  from public.inventory_lots l
  left join public.inventory_movements m
    on m.lot_id = l.id
  group by
    l.id,
    coalesce(l.item_id, l.inventory_item_id),
    l.shop_id,
    l.warehouse_id,
    l.supplier_id,
    l.lot_no,
    l.lot_barcode,
    l.supplier_lot_no,
    l.manufactured_at,
    l.expired_at,
    l.received_at,
    l.status,
    l.notes
)
select
  lot_totals.lot_id,
  lot_totals.item_id,
  ii.name as item_name,
  ii.sku,
  ii.unit,
  lot_totals.shop_id,
  lot_totals.warehouse_id,
  warehouses.code as warehouse_code,
  warehouses.name as warehouse_name,
  lot_totals.supplier_id,
  suppliers.code as supplier_code,
  suppliers.name as supplier_name,
  lot_totals.lot_no,
  lot_totals.lot_barcode,
  lot_totals.supplier_lot_no,
  lot_totals.manufactured_at,
  lot_totals.expired_at,
  lot_totals.received_at,
  lot_totals.status,
  lot_totals.notes,
  ii.tracking_mode,
  ii.is_expirable,
  ii.is_fefo_enabled,
  coalesce(lot_totals.on_hand, 0) as on_hand,
  round(coalesce(lot_totals.on_hand, 0) * coalesce(ii.average_unit_cost, 0), 2) as stock_value,
  lot_totals.last_movement_at,
  case
    when lot_totals.expired_at is not null and lot_totals.expired_at < now() then true
    else false
  end as is_expired
from lot_totals
join public.inventory_items ii on ii.id = lot_totals.item_id
left join public.warehouses warehouses on warehouses.id = lot_totals.warehouse_id
left join public.suppliers suppliers on suppliers.id = lot_totals.supplier_id;

create or replace view public.v_fefo_candidates as
select
  stock_by_lot.*,
  row_number() over (
    partition by stock_by_lot.shop_id, stock_by_lot.item_id
    order by stock_by_lot.expired_at nulls last, stock_by_lot.received_at asc, stock_by_lot.lot_id asc
  ) as fefo_rank
from public.v_inventory_stock_by_lot stock_by_lot
where stock_by_lot.on_hand > 0
  and stock_by_lot.is_expired = false
  and stock_by_lot.is_expirable = true
  and stock_by_lot.is_fefo_enabled = true;

create or replace function public.suggest_fefo_lots(
  p_item_id uuid,
  p_quantity numeric default null,
  p_warehouse_id uuid default null,
  p_shop_id uuid default null,
  p_allow_expired boolean default false
)
returns table (
  lot_id uuid,
  item_id uuid,
  lot_no text,
  lot_barcode text,
  warehouse_id uuid,
  expired_at timestamptz,
  received_at timestamptz,
  on_hand numeric(18,3),
  suggested_qty numeric(18,3),
  fefo_rank integer,
  is_expired boolean
)
language sql
stable
security definer
set search_path = public
as $$
with eligible as (
  select *
  from public.v_fefo_candidates
  where item_id = p_item_id
    and (p_shop_id is null or shop_id = p_shop_id or shop_id is null)
    and (p_warehouse_id is null or warehouse_id = p_warehouse_id)
    and (p_allow_expired or is_expired = false)
  order by expired_at nulls last, received_at asc, lot_id asc
)
select
  eligible.lot_id,
  eligible.item_id,
  eligible.lot_no,
  eligible.lot_barcode,
  eligible.warehouse_id,
  eligible.expired_at,
  eligible.received_at,
  eligible.on_hand,
  case
    when p_quantity is null then eligible.on_hand
    else greatest(
      least(
        eligible.on_hand,
        p_quantity - coalesce(
          sum(eligible.on_hand) over (
            order by eligible.expired_at nulls last, eligible.received_at asc, eligible.lot_id asc
            rows between unbounded preceding and 1 preceding
          ),
          0
        )
      ),
      0
    )
  end as suggested_qty,
  eligible.fefo_rank,
  eligible.is_expired
from eligible;
$$;

-- -----------------------------------------------------------------------------
-- Posting helpers
-- -----------------------------------------------------------------------------
create or replace function public.post_inventory_receipt(p_receipt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt public.inventory_receipts%rowtype;
  v_line public.inventory_receipt_items%rowtype;
  v_lot_id uuid;
  v_item public.inventory_items%rowtype;
  v_expired_at timestamptz;
  v_received_at timestamptz;
begin
  select *
  into v_receipt
  from public.inventory_receipts
  where id = p_receipt_id
  for update;

  if not found then
    raise exception 'Inventory receipt % not found', p_receipt_id;
  end if;

  if v_receipt.status = 'posted' then
    return;
  end if;

  v_received_at := coalesce(v_receipt.received_at, now());

  for v_line in
    select *
    from public.inventory_receipt_items
    where inventory_receipt_id = p_receipt_id
    order by created_at asc
  loop
    select *
    into v_item
    from public.inventory_items
    where id = v_line.item_id
    limit 1;

    if not found then
      raise exception 'Inventory item % not found', v_line.item_id;
    end if;

    v_expired_at := coalesce(
      v_line.expired_at,
      case
        when v_item.default_shelf_life_days is not null then
          coalesce(v_line.manufactured_at, v_received_at)
          + make_interval(days => v_item.default_shelf_life_days)
        else null
      end
    );

    if v_line.lot_id is null then
      insert into public.inventory_lots (
        shop_id,
        item_id,
        inventory_item_id,
        warehouse_id,
        supplier_id,
        lot_no,
        lot_barcode,
        manufactured_at,
        expired_at,
        received_at,
        status,
        notes
      )
      values (
        v_receipt.shop_id,
        v_line.item_id,
        v_line.item_id,
        v_receipt.warehouse_id,
        v_receipt.supplier_id,
        coalesce(v_line.lot_no_snapshot, format('%s-%s', v_receipt.receipt_no, left(replace(v_line.id::text, '-', ''), 8))),
        v_line.lot_barcode_snapshot,
        v_line.manufactured_at,
        v_expired_at,
        v_received_at,
        'open',
        v_line.note
      )
      returning id into v_lot_id;
    else
      v_lot_id := v_line.lot_id;

      update public.inventory_lots
      set shop_id = coalesce(shop_id, v_receipt.shop_id),
          item_id = coalesce(item_id, v_line.item_id),
          inventory_item_id = coalesce(inventory_item_id, v_line.item_id),
          warehouse_id = coalesce(warehouse_id, v_receipt.warehouse_id),
          supplier_id = coalesce(supplier_id, v_receipt.supplier_id),
          lot_no = coalesce(lot_no, v_line.lot_no_snapshot),
          lot_barcode = coalesce(lot_barcode, v_line.lot_barcode_snapshot),
          manufactured_at = coalesce(manufactured_at, v_line.manufactured_at),
          expired_at = coalesce(expired_at, v_expired_at),
          received_at = coalesce(received_at, v_received_at),
          status = case when status = 'void' then status else 'open' end,
          notes = coalesce(notes, v_line.note)
      where id = v_lot_id;
    end if;

    insert into public.inventory_movements (
      shop_id,
      warehouse_id,
      item_id,
      inventory_item_id,
      lot_id,
      movement_type,
      quantity_delta,
      unit_cost,
      reference_type,
      reference_id,
      reference_line_id,
      notes,
      created_by,
      movement_at
    )
    values (
      v_receipt.shop_id,
      v_receipt.warehouse_id,
      v_line.item_id,
      v_line.item_id,
      v_lot_id,
      'receipt',
      coalesce(v_line.qty_received, 0),
      v_line.unit_cost,
      'inventory_receipt',
      v_receipt.id,
      v_line.id,
      v_line.note,
      auth.uid(),
      v_received_at
    );
  end loop;

  update public.inventory_receipts
  set status = 'posted',
      posted_at = now()
  where id = p_receipt_id;
end;
$$;

create or replace function public.post_inventory_issue(p_issue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue public.inventory_issues%rowtype;
  v_line public.inventory_issue_items%rowtype;
  v_chosen_lot_id uuid;
  v_available numeric(18,3);
  v_item public.inventory_items%rowtype;
  v_fefo_lot uuid;
begin
  select *
  into v_issue
  from public.inventory_issues
  where id = p_issue_id
  for update;

  if not found then
    raise exception 'Inventory issue % not found', p_issue_id;
  end if;

  if v_issue.status = 'posted' then
    return;
  end if;

  for v_line in
    select *
    from public.inventory_issue_items
    where inventory_issue_id = p_issue_id
    order by created_at asc
  loop
    select *
    into v_item
    from public.inventory_items
    where id = v_line.item_id
    limit 1;

    if not found then
      raise exception 'Inventory item % not found', v_line.item_id;
    end if;

    v_chosen_lot_id := coalesce(v_line.lot_id, v_line.suggested_lot_id);

    if v_chosen_lot_id is null then
      select lot_id
      into v_fefo_lot
      from public.suggest_fefo_lots(
        v_line.item_id,
        v_line.qty_issued,
        v_issue.warehouse_id,
        v_issue.shop_id,
        false
      )
      order by fefo_rank
      limit 1;

      v_chosen_lot_id := v_fefo_lot;
    end if;

    if v_chosen_lot_id is null then
      raise exception 'No FEFO candidate lot found for item %', v_line.item_id;
    end if;

    select coalesce(sum(quantity_delta), 0)
    into v_available
    from public.inventory_movements
    where lot_id = v_chosen_lot_id;

    if v_available < v_line.qty_issued then
      raise exception
        'Insufficient lot stock for lot %: available %, requested %',
        v_chosen_lot_id,
        v_available,
        v_line.qty_issued;
    end if;

    if v_line.suggested_lot_id is not null
      and v_chosen_lot_id is distinct from v_line.suggested_lot_id then
      if not public.has_permission('inventory.fefo.override') then
        raise exception 'Permission denied for FEFO override';
      end if;

      if coalesce(v_line.fefo_override_reason, '') = '' then
        raise exception 'FEFO override reason is required';
      end if;
    end if;

    update public.inventory_issue_items
    set lot_id = v_chosen_lot_id,
        fefo_overridden = v_line.suggested_lot_id is not null
          and v_chosen_lot_id is distinct from v_line.suggested_lot_id,
        fefo_override_reason = case
          when v_line.suggested_lot_id is not null
            and v_chosen_lot_id is distinct from v_line.suggested_lot_id
          then v_line.fefo_override_reason
          else fefo_override_reason
        end
    where id = v_line.id;

    insert into public.inventory_movements (
      shop_id,
      warehouse_id,
      item_id,
      inventory_item_id,
      lot_id,
      movement_type,
      quantity_delta,
      unit_cost,
      reference_type,
      reference_id,
      reference_line_id,
      notes,
      created_by,
      movement_at
    )
    values (
      v_issue.shop_id,
      v_issue.warehouse_id,
      v_line.item_id,
      v_line.item_id,
      v_chosen_lot_id,
      'issue',
      -abs(coalesce(v_line.qty_issued, 0)),
      v_item.average_unit_cost,
      'inventory_issue',
      v_issue.id,
      v_line.id,
      v_line.note,
      auth.uid(),
      v_issue.issued_at
    );
  end loop;

  update public.inventory_issues
  set status = 'posted',
      posted_at = now()
  where id = p_issue_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS / grants for phase 3 documents
-- -----------------------------------------------------------------------------
alter table public.inventory_receipts enable row level security;
alter table public.inventory_receipt_items enable row level security;
alter table public.inventory_issues enable row level security;
alter table public.inventory_issue_items enable row level security;

drop policy if exists read_inventory_receipts on public.inventory_receipts;
create policy read_inventory_receipts
on public.inventory_receipts
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.receipt.read')
    or public.has_permission('inventory.stock.read')
  )
);

drop policy if exists write_inventory_receipts on public.inventory_receipts;
create policy write_inventory_receipts
on public.inventory_receipts
for insert
with check (
  public.user_can_access_shop(shop_id)
  and public.has_permission('inventory.receipt.create')
);

drop policy if exists update_inventory_receipts on public.inventory_receipts;
create policy update_inventory_receipts
on public.inventory_receipts
for update
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.receipt.create')
    or public.has_permission('inventory.receipt.post')
  )
)
with check (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.receipt.create')
    or public.has_permission('inventory.receipt.post')
  )
);

drop policy if exists read_inventory_receipt_items on public.inventory_receipt_items;
create policy read_inventory_receipt_items
on public.inventory_receipt_items
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.receipt.read')
    or public.has_permission('inventory.stock.read')
  )
);

drop policy if exists write_inventory_receipt_items on public.inventory_receipt_items;
create policy write_inventory_receipt_items
on public.inventory_receipt_items
for insert
with check (
  public.user_can_access_shop(shop_id)
  and public.has_permission('inventory.receipt.create')
);

drop policy if exists update_inventory_receipt_items on public.inventory_receipt_items;
create policy update_inventory_receipt_items
on public.inventory_receipt_items
for update
using (
  public.user_can_access_shop(shop_id)
  and public.has_permission('inventory.receipt.create')
)
with check (
  public.user_can_access_shop(shop_id)
  and public.has_permission('inventory.receipt.create')
);

drop policy if exists read_inventory_issues on public.inventory_issues;
create policy read_inventory_issues
on public.inventory_issues
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.issue.read')
    or public.has_permission('inventory.stock.read')
  )
);

drop policy if exists write_inventory_issues on public.inventory_issues;
create policy write_inventory_issues
on public.inventory_issues
for insert
with check (
  public.user_can_access_shop(shop_id)
  and public.has_permission('inventory.issue.create')
);

drop policy if exists update_inventory_issues on public.inventory_issues;
create policy update_inventory_issues
on public.inventory_issues
for update
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.issue.create')
    or public.has_permission('inventory.issue.post')
  )
)
with check (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.issue.create')
    or public.has_permission('inventory.issue.post')
  )
);

drop policy if exists read_inventory_issue_items on public.inventory_issue_items;
create policy read_inventory_issue_items
on public.inventory_issue_items
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.issue.read')
    or public.has_permission('inventory.stock.read')
  )
);

drop policy if exists write_inventory_issue_items on public.inventory_issue_items;
create policy write_inventory_issue_items
on public.inventory_issue_items
for insert
with check (
  public.user_can_access_shop(shop_id)
  and public.has_permission('inventory.issue.create')
);

drop policy if exists update_inventory_issue_items on public.inventory_issue_items;
create policy update_inventory_issue_items
on public.inventory_issue_items
for update
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.issue.create')
    or public.has_permission('inventory.issue.post')
  )
)
with check (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.issue.create')
    or public.has_permission('inventory.issue.post')
  )
);

grant select, insert, update on
  public.inventory_receipts,
  public.inventory_receipt_items,
  public.inventory_issues,
  public.inventory_issue_items
to authenticated;

alter table public.inventory_lots enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists read_inventory_lots on public.inventory_lots;
create policy read_inventory_lots
on public.inventory_lots
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.stock.read')
    or public.has_permission('inventory.receipt.read')
    or public.has_permission('inventory.issue.read')
  )
);

drop policy if exists read_inventory_movements on public.inventory_movements;
create policy read_inventory_movements
on public.inventory_movements
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.stock.read')
    or public.has_permission('inventory.receipt.read')
    or public.has_permission('inventory.issue.read')
  )
);

grant select on
  public.inventory_lots,
  public.inventory_movements,
  public.v_inventory_stock_by_item,
  public.v_inventory_stock_by_lot,
  public.v_fefo_candidates
to authenticated;

grant execute on function public.suggest_fefo_lots(uuid, numeric, uuid, uuid, boolean) to authenticated;
grant execute on function public.post_inventory_receipt(uuid) to authenticated;
grant execute on function public.post_inventory_issue(uuid) to authenticated;

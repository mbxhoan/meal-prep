-- Inventory, order finance, and automatic gross profit extension for MealFit
-- Run this after the base storefront schema.

do $$
begin
  if to_regclass('public.profiles') is null
    or to_regclass('public.products') is null
    or to_regclass('public.product_variants') is null then
    raise exception
      'Missing base storefront schema. Apply 20260316230000_storefront_base.sql before this migration.';
  end if;
end
$$;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  unit text not null,
  current_quantity numeric(14,2) not null default 0,
  reorder_point numeric(14,2) not null default 0,
  average_unit_cost numeric(14,2) not null default 0,
  last_purchase_cost numeric(14,2) not null default 0,
  supplier_name text,
  image_url text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null check (
    movement_type in ('purchase', 'adjustment', 'waste', 'order_consumption')
  ),
  quantity_delta numeric(14,2) not null,
  unit_cost numeric(14,2),
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.product_variants
  add column if not exists packaging_cost numeric(14,2) not null default 0,
  add column if not exists labor_cost numeric(14,2) not null default 0,
  add column if not exists overhead_cost numeric(14,2) not null default 0;

create table if not exists public.recipe_components (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity_per_unit numeric(14,2) not null check (quantity_per_unit > 0),
  wastage_pct numeric(6,2) not null default 0 check (wastage_pct >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id, inventory_item_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text,
  sales_channel text not null default 'manual' check (
    sales_channel in ('website', 'facebook', 'zalo', 'store', 'grab', 'manual')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'confirmed', 'completed', 'cancelled')
  ),
  note text,
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  shipping_fee numeric(14,2) not null default 0,
  other_fee numeric(14,2) not null default 0,
  total_revenue numeric(14,2) not null default 0,
  total_cogs numeric(14,2) not null default 0,
  gross_profit numeric(14,2) not null default 0,
  gross_margin numeric(8,4) not null default 0,
  inventory_applied_at timestamptz,
  ordered_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(14,2),
  ingredient_cost numeric(14,2) not null default 0,
  packaging_cost numeric(14,2) not null default 0,
  labor_cost numeric(14,2) not null default 0,
  overhead_cost numeric(14,2) not null default 0,
  unit_cogs numeric(14,2) not null default 0,
  line_revenue numeric(14,2) not null default 0,
  line_cogs numeric(14,2) not null default 0,
  line_profit numeric(14,2) not null default 0,
  recipe_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inventory_items_active on public.inventory_items(is_active);
create index if not exists idx_inventory_movements_item_created
  on public.inventory_movements(inventory_item_id, created_at desc);
create index if not exists idx_recipe_components_variant
  on public.recipe_components(variant_id);
create index if not exists idx_orders_status_ordered_at
  on public.orders(status, ordered_at desc);
create index if not exists idx_order_items_order
  on public.order_items(order_id);
create index if not exists idx_order_items_variant
  on public.order_items(variant_id);

drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
create trigger trg_inventory_items_updated_at
before update on public.inventory_items
for each row
execute function public.set_updated_at();

drop trigger if exists trg_recipe_components_updated_at on public.recipe_components;
create trigger trg_recipe_components_updated_at
before update on public.recipe_components
for each row
execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists trg_order_items_updated_at on public.order_items;
create trigger trg_order_items_updated_at
before update on public.order_items
for each row
execute function public.set_updated_at();

create or replace function public.apply_inventory_movement_effect()
returns trigger
language plpgsql
as $$
declare
  v_current_quantity numeric(14,2);
  v_average_cost numeric(14,2);
  v_new_quantity numeric(14,2);
begin
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
        when new.movement_type = 'purchase'
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
        when new.movement_type = 'purchase' and coalesce(new.unit_cost, 0) > 0
        then new.unit_cost
        else last_purchase_cost
      end
  where id = new.inventory_item_id;

  return new;
end;
$$;

drop trigger if exists trg_inventory_movements_apply_effect on public.inventory_movements;
create trigger trg_inventory_movements_apply_effect
after insert on public.inventory_movements
for each row
execute function public.apply_inventory_movement_effect();

create or replace function public.variant_ingredient_cost(p_variant_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(
    round(
      sum(
        rc.quantity_per_unit
        * ii.average_unit_cost
        * (1 + (rc.wastage_pct / 100.0))
      ),
      2
    ),
    0
  )
  from public.recipe_components rc
  join public.inventory_items ii on ii.id = rc.inventory_item_id
  where rc.variant_id = p_variant_id;
$$;

create or replace function public.populate_order_item_financials()
returns trigger
language plpgsql
as $$
declare
  v_product_id uuid;
  v_default_price numeric(14,2);
  v_packaging_cost numeric(14,2);
  v_labor_cost numeric(14,2);
  v_overhead_cost numeric(14,2);
  v_ingredient_cost numeric(14,2);
begin
  select
    product_id,
    coalesce(price, 0),
    coalesce(packaging_cost, 0),
    coalesce(labor_cost, 0),
    coalesce(overhead_cost, 0)
  into
    v_product_id,
    v_default_price,
    v_packaging_cost,
    v_labor_cost,
    v_overhead_cost
  from public.product_variants
  where id = new.variant_id;

  if not found then
    raise exception 'variant % not found', new.variant_id;
  end if;

  v_ingredient_cost := public.variant_ingredient_cost(new.variant_id);

  new.product_id := coalesce(new.product_id, v_product_id);
  new.unit_price := coalesce(new.unit_price, v_default_price, 0);
  new.ingredient_cost := v_ingredient_cost;
  new.packaging_cost := v_packaging_cost;
  new.labor_cost := v_labor_cost;
  new.overhead_cost := v_overhead_cost;
  new.unit_cogs := round(
    v_ingredient_cost + v_packaging_cost + v_labor_cost + v_overhead_cost,
    2
  );
  new.line_revenue := round(new.quantity * new.unit_price, 2);
  new.line_cogs := round(new.quantity * new.unit_cogs, 2);
  new.line_profit := round(new.line_revenue - new.line_cogs, 2);
  new.recipe_snapshot := coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'inventory_item_id', rc.inventory_item_id,
          'ingredient_name', ii.name,
          'unit', ii.unit,
          'quantity_per_unit', rc.quantity_per_unit,
          'wastage_pct', rc.wastage_pct,
          'unit_cost', ii.average_unit_cost,
          'line_cost', round(
            rc.quantity_per_unit
            * ii.average_unit_cost
            * (1 + (rc.wastage_pct / 100.0)),
            2
          )
        )
        order by ii.name
      )
      from public.recipe_components rc
      join public.inventory_items ii on ii.id = rc.inventory_item_id
      where rc.variant_id = new.variant_id
    ),
    '[]'::jsonb
  );

  return new;
end;
$$;

drop trigger if exists trg_order_items_financials on public.order_items;
create trigger trg_order_items_financials
before insert or update on public.order_items
for each row
execute function public.populate_order_item_financials();

create or replace function public.refresh_order_totals(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  v_subtotal numeric(14,2);
  v_total_cogs numeric(14,2);
  v_discount numeric(14,2);
  v_shipping numeric(14,2);
  v_other numeric(14,2);
  v_total_revenue numeric(14,2);
  v_gross_profit numeric(14,2);
begin
  select
    coalesce(sum(line_revenue), 0),
    coalesce(sum(line_cogs), 0)
  into v_subtotal, v_total_cogs
  from public.order_items
  where order_id = p_order_id;

  select
    coalesce(discount_amount, 0),
    coalesce(shipping_fee, 0),
    coalesce(other_fee, 0)
  into v_discount, v_shipping, v_other
  from public.orders
  where id = p_order_id;

  v_total_revenue := greatest(v_subtotal - v_discount + v_shipping + v_other, 0);
  v_gross_profit := round(v_total_revenue - v_total_cogs, 2);

  update public.orders
  set subtotal = v_subtotal,
      total_revenue = v_total_revenue,
      total_cogs = v_total_cogs,
      gross_profit = v_gross_profit,
      gross_margin = case
        when v_total_revenue > 0
        then round(v_gross_profit / v_total_revenue, 4)
        else 0
      end
  where id = p_order_id;
end;
$$;

create or replace function public.handle_order_item_totals()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_order_totals(coalesce(new.order_id, old.order_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_order_items_refresh_totals on public.order_items;
create trigger trg_order_items_refresh_totals
after insert or update or delete on public.order_items
for each row
execute function public.handle_order_item_totals();

create or replace function public.consume_inventory_for_order()
returns trigger
language plpgsql
as $$
begin
  if new.status not in ('confirmed', 'completed') then
    return new;
  end if;

  if new.inventory_applied_at is not null then
    return new;
  end if;

  insert into public.inventory_movements (
    inventory_item_id,
    movement_type,
    quantity_delta,
    unit_cost,
    reference_type,
    reference_id,
    notes,
    created_by
  )
  select
    rc.inventory_item_id,
    'order_consumption',
    round(-sum(
      oi.quantity
      * rc.quantity_per_unit
      * (1 + (rc.wastage_pct / 100.0))
    ), 2),
    ii.average_unit_cost,
    'order',
    new.id,
    concat('Auto consume for ', new.order_number),
    new.created_by
  from public.order_items oi
  join public.recipe_components rc on rc.variant_id = oi.variant_id
  join public.inventory_items ii on ii.id = rc.inventory_item_id
  where oi.order_id = new.id
  group by rc.inventory_item_id, ii.average_unit_cost;

  update public.orders
  set inventory_applied_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_orders_consume_inventory on public.orders;
create trigger trg_orders_consume_inventory
after update of status on public.orders
for each row
when (
  old.status is distinct from new.status
  and new.status in ('confirmed', 'completed')
)
execute function public.consume_inventory_for_order();

alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.recipe_components enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Editors can manage inventory items" on public.inventory_items;
create policy "Editors can manage inventory items"
on public.inventory_items
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Editors can manage inventory movements" on public.inventory_movements;
create policy "Editors can manage inventory movements"
on public.inventory_movements
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Editors can manage recipe components" on public.recipe_components;
create policy "Editors can manage recipe components"
on public.recipe_components
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Editors can manage orders" on public.orders;
create policy "Editors can manage orders"
on public.orders
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Editors can manage order items" on public.order_items;
create policy "Editors can manage order items"
on public.order_items
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

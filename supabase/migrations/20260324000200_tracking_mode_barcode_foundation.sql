-- Tracking mode, barcode, lot and serial foundation for MealFit inventory.
-- This migration is intentionally non-breaking and extends the existing
-- inventory tables used by the current app/runtime.

do $$
begin
  if to_regclass('public.inventory_items') is null
    or to_regclass('public.inventory_movements') is null then
    raise exception
      'Missing inventory foundation. Apply 20260316231500_inventory_profit_admin.sql before this migration.';
  end if;
end
$$;

alter table public.inventory_items
  add column if not exists barcode text,
  add column if not exists barcode_type text,
  add column if not exists tracking_mode text,
  add column if not exists is_expirable boolean,
  add column if not exists is_fefo_enabled boolean,
  add column if not exists requires_unit_label boolean,
  add column if not exists default_shelf_life_days integer;

update public.inventory_items
set
  tracking_mode = coalesce(tracking_mode, 'lot'),
  is_expirable = coalesce(is_expirable, true),
  is_fefo_enabled = coalesce(is_fefo_enabled, true),
  requires_unit_label = coalesce(requires_unit_label, false)
where tracking_mode is null
   or is_expirable is null
   or is_fefo_enabled is null
   or requires_unit_label is null;

alter table public.inventory_items
  alter column tracking_mode set default 'lot',
  alter column tracking_mode set not null,
  alter column is_expirable set default true,
  alter column is_expirable set not null,
  alter column is_fefo_enabled set default true,
  alter column is_fefo_enabled set not null,
  alter column requires_unit_label set default false,
  alter column requires_unit_label set not null,
  alter column default_shelf_life_days drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inventory_items_tracking_mode_check'
      and conrelid = 'public.inventory_items'::regclass
  ) then
    alter table public.inventory_items
      add constraint inventory_items_tracking_mode_check
      check (tracking_mode in ('none', 'lot', 'serial', 'lot_serial'));
  end if;
end
$$;

create index if not exists idx_inventory_items_tracking_mode
  on public.inventory_items(tracking_mode);

create index if not exists idx_inventory_items_barcode
  on public.inventory_items(barcode);

create table if not exists public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  lot_no text not null,
  lot_barcode text,
  supplier_lot_no text,
  manufactured_at timestamptz,
  expired_at timestamptz,
  received_at timestamptz not null default now(),
  status text not null default 'open' check (
    status in ('open', 'quarantined', 'closed', 'expired', 'consumed', 'void')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inventory_item_id, lot_no)
);

create unique index if not exists idx_inventory_lots_barcode
  on public.inventory_lots(lot_barcode)
  where lot_barcode is not null;

create index if not exists idx_inventory_lots_item_expired
  on public.inventory_lots(inventory_item_id, expired_at, received_at);

drop trigger if exists trg_inventory_lots_updated_at on public.inventory_lots;
create trigger trg_inventory_lots_updated_at
before update on public.inventory_lots
for each row
execute function public.set_updated_at();

create table if not exists public.inventory_serials (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  inventory_lot_id uuid references public.inventory_lots(id) on delete set null,
  serial_no text not null,
  serial_barcode text,
  status text not null default 'in_stock' check (
    status in ('in_stock', 'reserved', 'sold', 'returned', 'damaged', 'void')
  ),
  received_at timestamptz,
  sold_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inventory_item_id, serial_no)
);

create unique index if not exists idx_inventory_serials_barcode
  on public.inventory_serials(serial_barcode)
  where serial_barcode is not null;

create index if not exists idx_inventory_serials_item_status
  on public.inventory_serials(inventory_item_id, status);

create index if not exists idx_inventory_serials_lot
  on public.inventory_serials(inventory_lot_id);

drop trigger if exists trg_inventory_serials_updated_at on public.inventory_serials;
create trigger trg_inventory_serials_updated_at
before update on public.inventory_serials
for each row
execute function public.set_updated_at();

alter table public.inventory_movements
  add column if not exists serial_id uuid references public.inventory_serials(id) on delete set null;

create index if not exists idx_inventory_movements_serial
  on public.inventory_movements(serial_id);

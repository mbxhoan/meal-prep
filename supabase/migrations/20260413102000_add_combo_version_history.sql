-- Combo version history: immutable snapshots for every combo change.

do $$
begin
  if to_regclass('public.shops') is null
    or to_regclass('public.combos') is null
    or to_regclass('public.combo_items') is null
    or to_regprocedure('public.set_master_data_audit_columns()') is null
    or to_regprocedure('public.audit_master_data_change()') is null
    or to_regprocedure('public.calculate_combo_financials()') is null
    or to_regprocedure('public.calculate_combo_item_snapshot()') is null
    or to_regprocedure('public.recompute_combo_summary(uuid)') is null
    or to_regprocedure('public.sync_combo_summary_from_items()') is null then
    raise exception
      'Missing combo base schema. Apply the combo management migration before version history.';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Version table
-- -----------------------------------------------------------------------------
create table if not exists public.combo_versions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  combo_id uuid not null references public.combos(id) on delete cascade,
  version_no integer not null,
  change_action text not null,
  combo_code text not null,
  combo_name text not null,
  sale_price numeric(18,2) not null default 0,
  default_sale_price numeric(18,2) not null default 0,
  total_cost numeric(18,2) not null default 0,
  gross_profit numeric(18,2) not null default 0,
  gross_margin numeric(18,4) not null default 0,
  notes text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  combo_items_snapshot jsonb not null default '[]'::jsonb,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (shop_id, combo_id, version_no)
);

create index if not exists idx_combo_versions_combo_created
  on public.combo_versions (shop_id, combo_id, created_at desc);

create index if not exists idx_combo_versions_created
  on public.combo_versions (shop_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Snapshot helper
-- -----------------------------------------------------------------------------
create or replace function public.snapshot_combo_version(
  p_combo_id uuid,
  p_change_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_combo public.combos%rowtype;
  v_items_snapshot jsonb;
  v_next_version integer;
begin
  if p_combo_id is null then
    return;
  end if;

  select *
  into v_combo
  from public.combos
  where id = p_combo_id
  limit 1;

  if not found then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_combo_id::text));

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ci.id,
        'shopId', ci.shop_id,
        'comboId', ci.combo_id,
        'menuItemVariantId', ci.menu_item_variant_id,
        'menuItemName', mi.name,
        'variantLabel', miv.label,
        'weightGrams', miv.weight_grams,
        'quantity', ci.quantity,
        'unitSalePrice', ci.unit_sale_price_snapshot,
        'unitCost', ci.unit_cost_snapshot,
        'lineSaleTotal', ci.line_sale_total,
        'lineCostTotal', ci.line_cost_total,
        'displayText', ci.display_text,
        'sortOrder', ci.sort_order,
        'isActive', ci.is_active,
        'notes', ci.notes,
        'deletedAt', ci.deleted_at,
        'createdAt', ci.created_at,
        'updatedAt', ci.updated_at
      )
      order by ci.sort_order, ci.created_at, ci.id
    ),
    '[]'::jsonb
  )
  into v_items_snapshot
  from public.combo_items ci
  left join public.menu_item_variants miv
    on miv.id = ci.menu_item_variant_id
  left join public.menu_items mi
    on mi.id = miv.menu_item_id
  where ci.combo_id = p_combo_id;

  select coalesce(max(version_no), 0) + 1
  into v_next_version
  from public.combo_versions
  where combo_id = p_combo_id;

  insert into public.combo_versions (
    shop_id,
    combo_id,
    version_no,
    change_action,
    combo_code,
    combo_name,
    sale_price,
    default_sale_price,
    total_cost,
    gross_profit,
    gross_margin,
    notes,
    is_active,
    deleted_at,
    combo_items_snapshot,
    changed_by
  ) values (
    v_combo.shop_id,
    v_combo.id,
    v_next_version,
    coalesce(nullif(p_change_action, ''), 'update'),
    v_combo.code,
    v_combo.name,
    v_combo.sale_price,
    v_combo.default_sale_price,
    v_combo.total_cost,
    v_combo.gross_profit,
    v_combo.gross_margin,
    v_combo.notes,
    v_combo.is_active,
    v_combo.deleted_at,
    coalesce(v_items_snapshot, '[]'::jsonb),
    auth.uid()
  );
end;
$$;

create or replace function public.sync_combo_version_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_combo_id uuid := coalesce(new.id, old.id);
begin
  perform public.snapshot_combo_version(v_combo_id, tg_op);
  return coalesce(new, old);
end;
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
drop trigger if exists trg_combo_versions_snapshot on public.combos;
create trigger trg_combo_versions_snapshot
after insert or update on public.combos
for each row
execute function public.sync_combo_version_history();

drop trigger if exists trg_combo_versions_snapshot_delete on public.combos;
create trigger trg_combo_versions_snapshot_delete
before delete on public.combos
for each row
execute function public.sync_combo_version_history();

-- -----------------------------------------------------------------------------
-- RLS and grants
-- -----------------------------------------------------------------------------
alter table public.combo_versions enable row level security;

drop policy if exists read_combo_versions on public.combo_versions;
create policy read_combo_versions
on public.combo_versions
for select
using (
  public.user_can_access_shop(shop_id)
  and public.has_permission('master.menu.read')
);

grant select on public.combo_versions to authenticated;

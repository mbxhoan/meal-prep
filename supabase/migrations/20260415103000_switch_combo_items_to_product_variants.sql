-- Switch combo items to the product catalog while keeping legacy combo rows readable.

do $$
begin
  if to_regclass('public.shops') is null
    or to_regclass('public.combos') is null
    or to_regclass('public.combo_items') is null
    or to_regclass('public.products') is null
    or to_regclass('public.product_variants') is null
    or to_regclass('public.menu_items') is null
    or to_regclass('public.menu_item_variants') is null
    or to_regprocedure('public.set_master_data_audit_columns()') is null
    or to_regprocedure('public.audit_master_data_change()') is null
    or to_regprocedure('public.calculate_combo_financials()') is null
    or to_regprocedure('public.recompute_combo_summary(uuid)') is null
    or to_regprocedure('public.sync_combo_summary_from_items()') is null
    or to_regprocedure('public.set_updated_at()') is null then
    raise exception
      'Missing combo base schema. Apply the existing migrations before switching combo items to product variants.';
  end if;
end
$$;

alter table public.combo_items
  add column if not exists product_variant_id uuid references public.product_variants(id) on delete restrict;

alter table public.combo_items
  alter column menu_item_variant_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_combo_items_variant_reference'
  ) then
    alter table public.combo_items
      add constraint chk_combo_items_variant_reference
      check (coalesce(product_variant_id, menu_item_variant_id) is not null);
  end if;
end
$$;

create index if not exists idx_combo_items_product_variant
  on public.combo_items (product_variant_id);

-- Best-effort backfill for legacy combo rows whose menu item variant has a matching product variant.
update public.combo_items ci
set product_variant_id = pv.id
from public.menu_item_variants miv
join public.menu_items mi
  on mi.id = miv.menu_item_id
join public.products p
  on lower(btrim(p.name)) = lower(btrim(mi.name))
join public.product_variants pv
  on pv.product_id = p.id
 and lower(btrim(pv.label)) = lower(btrim(miv.label))
 and coalesce(pv.weight_in_grams, 0) = coalesce(miv.weight_grams, 0)
where ci.product_variant_id is null
  and ci.menu_item_variant_id = miv.id
  and ci.shop_id = miv.shop_id;

create or replace function public.calculate_combo_item_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_name text;
  v_variant_label text;
  v_weight_grams numeric(18,3);
  v_unit_sale_price numeric(18,2);
  v_unit_cost numeric(18,2);
begin
  if coalesce(new.product_variant_id, new.menu_item_variant_id) is null then
    return new;
  end if;

  if new.product_variant_id is not null then
    select
      p.name,
      pv.label,
      pv.weight_in_grams,
      coalesce(pv.price, 0),
      coalesce(pv.standard_cost, 0)
    into
      v_item_name,
      v_variant_label,
      v_weight_grams,
      v_unit_sale_price,
      v_unit_cost
    from public.product_variants pv
    join public.products p
      on p.id = pv.product_id
    where pv.id = new.product_variant_id
    limit 1;
  else
    select
      mi.name,
      miv.label,
      miv.weight_grams,
      coalesce(pbi.sale_price, 0),
      coalesce(pbi.standard_cost, 0)
    into
      v_item_name,
      v_variant_label,
      v_weight_grams,
      v_unit_sale_price,
      v_unit_cost
    from public.menu_item_variants miv
    join public.menu_items mi
      on mi.id = miv.menu_item_id
    left join public.price_book_items pbi
      on pbi.menu_item_variant_id = miv.id
     and pbi.deleted_at is null
     and pbi.is_active = true
    where miv.id = new.menu_item_variant_id
      and miv.shop_id = new.shop_id
    limit 1;
  end if;

  new.unit_sale_price_snapshot := case
    when coalesce(new.unit_sale_price_snapshot, 0) > 0 then new.unit_sale_price_snapshot
    else coalesce(v_unit_sale_price, 0)
  end;
  new.unit_cost_snapshot := case
    when coalesce(new.unit_cost_snapshot, 0) > 0 then new.unit_cost_snapshot
    else coalesce(v_unit_cost, 0)
  end;
  new.line_sale_total := round(coalesce(new.quantity, 0) * coalesce(new.unit_sale_price_snapshot, 0), 2);
  new.line_cost_total := round(coalesce(new.quantity, 0) * coalesce(new.unit_cost_snapshot, 0), 2);

  if coalesce(new.display_text, '') = '' then
    new.display_text := trim(both ' ' from concat_ws(
      ' ',
      coalesce(v_item_name, 'Món'),
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

-- Recompute existing combo rows after the schema switch so the UI shows real totals.
update public.combo_items ci
set
  unit_sale_price_snapshot = coalesce(pv.price, 0),
  unit_cost_snapshot = coalesce(pv.standard_cost, 0),
  line_sale_total = round(coalesce(ci.quantity, 0) * coalesce(pv.price, 0), 2),
  line_cost_total = round(coalesce(ci.quantity, 0) * coalesce(pv.standard_cost, 0), 2),
  display_text = case
    when coalesce(ci.display_text, '') <> '' then ci.display_text
    else trim(both ' ' from concat_ws(
      ' ',
      coalesce(p.name, 'Món'),
      coalesce(pv.label, ''),
      case
        when pv.weight_in_grams is null then null
        else pv.weight_in_grams::text || 'g'
      end,
      'x' || coalesce(ci.quantity, 0)::text
    ))
  end
from public.product_variants pv
left join public.products p
  on p.id = pv.product_id
where ci.product_variant_id = pv.id
  and coalesce(ci.unit_sale_price_snapshot, 0) = 0
  and coalesce(ci.unit_cost_snapshot, 0) = 0;

update public.combo_items ci
set
  unit_sale_price_snapshot = coalesce(pbi.sale_price, 0),
  unit_cost_snapshot = coalesce(pbi.standard_cost, 0),
  line_sale_total = round(coalesce(ci.quantity, 0) * coalesce(pbi.sale_price, 0), 2),
  line_cost_total = round(coalesce(ci.quantity, 0) * coalesce(pbi.standard_cost, 0), 2),
  display_text = case
    when coalesce(ci.display_text, '') <> '' then ci.display_text
    else trim(both ' ' from concat_ws(
      ' ',
      coalesce(mi.name, 'Món'),
      coalesce(miv.label, ''),
      case
        when miv.weight_grams is null then null
        else miv.weight_grams::text || 'g'
      end,
      'x' || coalesce(ci.quantity, 0)::text
    ))
  end
from public.menu_item_variants miv
join public.menu_items mi
  on mi.id = miv.menu_item_id
left join public.price_book_items pbi
  on pbi.menu_item_variant_id = miv.id
 and pbi.deleted_at is null
 and pbi.is_active = true
where ci.product_variant_id is null
  and ci.menu_item_variant_id = miv.id
  and coalesce(ci.unit_sale_price_snapshot, 0) = 0
  and coalesce(ci.unit_cost_snapshot, 0) = 0;

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
        'productVariantId', ci.product_variant_id,
        'productName', p.name,
        'variantLabel', pv.label,
        'weightGrams', pv.weight_in_grams,
        'menuItemVariantId', ci.menu_item_variant_id,
        'menuItemName', mi.name,
        'legacyVariantLabel', miv.label,
        'legacyWeightGrams', miv.weight_grams,
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
  left join public.product_variants pv
    on pv.id = ci.product_variant_id
  left join public.products p
    on p.id = pv.product_id
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

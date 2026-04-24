alter table public.sales_orders
  add column if not exists shipper_name text not null default '',
  add column if not exists shipper_phone text not null default '';

alter table public.combos
  add column if not exists cost_price numeric(14,2) not null default 0,
  add column if not exists base_sale_price numeric(14,2) not null default 0;

create or replace function public.refresh_combo_reference_prices(target_combo_id uuid)
returns void
language plpgsql
as $$
begin
  update public.combos c
  set cost_price = coalesce(t.cost_price, 0),
      base_sale_price = coalesce(t.base_sale_price, 0),
      updated_at = now()
  from (
    select
      ci.combo_id,
      sum(coalesce(pv.cost_price, 0) * ci.qty) as cost_price,
      sum(coalesce(pv.sale_price, 0) * ci.qty) as base_sale_price
    from public.combo_items ci
    join public.product_variants pv on pv.id = ci.product_variant_id
    where ci.combo_id = target_combo_id
    group by ci.combo_id
  ) t
  where c.id = target_combo_id
    and c.id = t.combo_id;

  update public.combos c
  set cost_price = 0,
      base_sale_price = 0,
      updated_at = now()
  where c.id = target_combo_id
    and not exists (
      select 1
      from public.combo_items ci
      where ci.combo_id = target_combo_id
    );
end;
$$;

create or replace function public.refresh_combo_reference_prices_trigger()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_combo_reference_prices(new.combo_id);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_combo_reference_prices(old.combo_id);
  end if;

  return null;
end;
$$;

drop trigger if exists refresh_combo_reference_prices_on_items on public.combo_items;
create trigger refresh_combo_reference_prices_on_items
after insert or update or delete on public.combo_items
for each row execute function public.refresh_combo_reference_prices_trigger();

create or replace function public.refresh_combo_reference_prices_from_variant_trigger()
returns trigger
language plpgsql
as $$
declare
  combo_record record;
begin
  for combo_record in
    select distinct combo_id
    from public.combo_items
    where product_variant_id = new.id
  loop
    perform public.refresh_combo_reference_prices(combo_record.combo_id);
  end loop;

  return null;
end;
$$;

drop trigger if exists refresh_combo_reference_prices_on_variant_prices on public.product_variants;
create trigger refresh_combo_reference_prices_on_variant_prices
after update of cost_price, sale_price on public.product_variants
for each row execute function public.refresh_combo_reference_prices_from_variant_trigger();

do $$
declare
  combo_record record;
begin
  for combo_record in select id from public.combos loop
    perform public.refresh_combo_reference_prices(combo_record.id);
  end loop;
end;
$$;

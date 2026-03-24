-- Shop config foundation for MealFit Ops
-- Default price book + shop-level stock knobs used by sales and future inventory flow.

do $$
begin
  if to_regclass('public.shops') is null
    or to_regclass('public.price_books') is null
    or to_regprocedure('public.has_permission(text)') is null
    or to_regprocedure('public.user_can_access_shop(uuid)') is null
    or to_regprocedure('public.log_audit_event(uuid,text,text,uuid,text,text,jsonb,jsonb,jsonb,inet,text)') is null then
    raise exception
      'Missing Phase 0/1 foundation. Apply Phase 0 and Phase 1 migration before this migration.';
  end if;
end
$$;

create table if not exists public.shop_configs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null unique references public.shops(id) on delete cascade,
  near_expiry_days int not null default 3,
  expiring_soon_days int not null default 7,
  default_price_book_id uuid references public.price_books(id) on delete set null,
  allow_negative_stock boolean not null default false,
  allow_expired_issue boolean not null default false,
  allow_fefo_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_configs_shop_id
  on public.shop_configs (shop_id);

drop trigger if exists trg_shop_configs_updated_at on public.shop_configs;
create trigger trg_shop_configs_updated_at
before update on public.shop_configs
for each row
execute function public.set_updated_at();

create or replace function public.ensure_default_shop_config()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.shop_configs (shop_id)
  values (new.id)
  on conflict (shop_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_shops_default_shop_config on public.shops;
create trigger trg_shops_default_shop_config
after insert on public.shops
for each row
execute function public.ensure_default_shop_config();

insert into public.shop_configs (shop_id)
select shops.id
from public.shops shops
on conflict (shop_id) do nothing;

create or replace function public.audit_shop_config_change()
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
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
  else
    v_action := 'update';
  end if;

  perform public.log_audit_event(
    p_shop_id := v_shop_id,
    p_action := v_action,
    p_entity_name := tg_table_name,
    p_entity_id := v_entity_id,
    p_entity_code := coalesce(v_shop_id::text, v_entity_id::text),
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

drop trigger if exists trg_shop_configs_audit on public.shop_configs;
create trigger trg_shop_configs_audit
after insert or update or delete on public.shop_configs
for each row
execute function public.audit_shop_config_change();

alter table public.shop_configs enable row level security;

drop policy if exists read_shop_configs on public.shop_configs;
create policy read_shop_configs
on public.shop_configs
for select
using (
  public.user_can_access_shop(shop_id)
);

drop policy if exists insert_shop_configs on public.shop_configs;
create policy insert_shop_configs
on public.shop_configs
for insert
with check (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('system.shop.create')
    or public.has_permission('system.shop.update')
    or public.has_permission('master.lookup.create')
    or public.has_permission('master.lookup.update')
  )
);

drop policy if exists update_shop_configs on public.shop_configs;
create policy update_shop_configs
on public.shop_configs
for update
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('system.shop.update')
    or public.has_permission('master.lookup.update')
  )
)
with check (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('system.shop.update')
    or public.has_permission('master.lookup.update')
  )
);

grant select, insert, update on public.shop_configs to authenticated;

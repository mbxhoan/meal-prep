-- Align role model to system_admin / shop_owner / staff while keeping viewer
-- This migration is safe on top of the base schema and upgrades old role values.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception
      'Missing base storefront schema. Apply 20260316230000_storefront_base.sql before this migration.';
  end if;
end
$$;

update public.profiles
set role = case
  when role = 'admin' then 'system_admin'
  when role = 'editor' then 'staff'
  else role
end
where role in ('admin', 'editor');

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('system_admin', 'shop_owner', 'staff', 'viewer'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'viewer'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;
  return new;
end;
$$;

create or replace function public.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'system_admin'
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
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('system_admin', 'shop_owner')
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
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('system_admin', 'shop_owner', 'staff')
  );
$$;

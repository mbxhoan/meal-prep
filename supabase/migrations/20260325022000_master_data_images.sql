-- Add image support to master data items and menu items.

do $$
begin
  if to_regclass('public.items') is null
    or to_regclass('public.menu_items') is null then
    raise exception
      'Missing master data tables. Apply 20260324001000_phase1_master_data.sql before this migration.';
  end if;
end
$$;

alter table public.items
  add column if not exists image_url text;

alter table public.menu_items
  add column if not exists image_url text;

alter table public.product_images
  add column if not exists is_primary boolean not null default false;

create unique index if not exists uq_product_images_primary
  on public.product_images(product_id)
  where is_primary;

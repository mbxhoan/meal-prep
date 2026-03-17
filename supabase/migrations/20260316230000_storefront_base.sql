-- Base storefront schema for MealFit
-- Copied from docs/init/01_schema_supabase.sql so Supabase CLI can apply
-- prerequisite tables/functions before the inventory-profit extension.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  on conflict (id) do nothing;
  return new;
end;
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
      and p.role = 'admin'
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
      and p.role in ('admin', 'editor')
  );
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table if not exists public.navigation_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.navigation_menus (id) on delete cascade,
  parent_id uuid references public.navigation_items (id) on delete cascade,
  label text not null,
  href text,
  page_slug text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  target text not null default '_self' check (target in ('_self', '_blank')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_navigation_items_menu_sort
  on public.navigation_items(menu_id, sort_order);

drop trigger if exists trg_navigation_menus_updated_at on public.navigation_menus;
create trigger trg_navigation_menus_updated_at
before update on public.navigation_menus
for each row
execute function public.set_updated_at();

drop trigger if exists trg_navigation_items_updated_at on public.navigation_items;
create trigger trg_navigation_items_updated_at
before update on public.navigation_items
for each row
execute function public.set_updated_at();

create table if not exists public.site_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  meta_title text,
  meta_description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  section_key text not null,
  section_type text not null default 'content',
  title text,
  subtitle text,
  body text,
  image_url text,
  button_label text,
  button_href text,
  data_json jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(page_id, section_key)
);

create index if not exists idx_page_sections_page_sort
  on public.page_sections(page_id, sort_order);

drop trigger if exists trg_pages_updated_at on public.pages;
create trigger trg_pages_updated_at
before update on public.pages
for each row
execute function public.set_updated_at();

drop trigger if exists trg_page_sections_updated_at on public.page_sections;
create trigger trg_page_sections_updated_at
before update on public.page_sections
for each row
execute function public.set_updated_at();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  main_image_url text,
  sku text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  weight_in_grams integer,
  price numeric(12,2),
  compare_at_price numeric(12,2),
  is_default boolean not null default false,
  is_active boolean not null default true,
  calories integer,
  protein numeric(8,2),
  carbs numeric(8,2),
  fat numeric(8,2),
  fiber numeric(8,2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_benefits (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_active_sort
  on public.categories(is_active, sort_order);
create index if not exists idx_products_category_published_sort
  on public.products(category_id, is_published, sort_order);
create index if not exists idx_product_variants_product_sort
  on public.product_variants(product_id, sort_order);
create index if not exists idx_product_images_product_sort
  on public.product_images(product_id, sort_order);
create index if not exists idx_product_benefits_product_sort
  on public.product_benefits(product_id, sort_order);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at
before update on public.product_variants
for each row
execute function public.set_updated_at();

drop trigger if exists trg_product_images_updated_at on public.product_images;
create trigger trg_product_images_updated_at
before update on public.product_images
for each row
execute function public.set_updated_at();

drop trigger if exists trg_product_benefits_updated_at on public.product_benefits;
create trigger trg_product_benefits_updated_at
before update on public.product_benefits
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.navigation_menus enable row level security;
alter table public.navigation_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_benefits enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (id = auth.uid() or public.is_editor_or_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active menus" on public.navigation_menus;
create policy "Public can read active menus"
on public.navigation_menus
for select
using (is_active = true or public.is_editor_or_admin());

drop policy if exists "Editors can manage menus" on public.navigation_menus;
create policy "Editors can manage menus"
on public.navigation_menus
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Public can read visible navigation items" on public.navigation_items;
create policy "Public can read visible navigation items"
on public.navigation_items
for select
using (is_visible = true or public.is_editor_or_admin());

drop policy if exists "Editors can manage navigation items" on public.navigation_items;
create policy "Editors can manage navigation items"
on public.navigation_items
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Public can read public settings" on public.site_settings;
create policy "Public can read public settings"
on public.site_settings
for select
using (is_public = true or public.is_editor_or_admin());

drop policy if exists "Editors can manage settings" on public.site_settings;
create policy "Editors can manage settings"
on public.site_settings
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Public can read published pages" on public.pages;
create policy "Public can read published pages"
on public.pages
for select
using (is_published = true or public.is_editor_or_admin());

drop policy if exists "Editors can manage pages" on public.pages;
create policy "Editors can manage pages"
on public.pages
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Public can read visible page sections of published pages" on public.page_sections;
create policy "Public can read visible page sections of published pages"
on public.page_sections
for select
using (
  (
    is_visible = true
    and exists (
      select 1 from public.pages p
      where p.id = page_sections.page_id
        and p.is_published = true
    )
  )
  or public.is_editor_or_admin()
);

drop policy if exists "Editors can manage page sections" on public.page_sections;
create policy "Editors can manage page sections"
on public.page_sections
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories
for select
using (is_active = true or public.is_editor_or_admin());

drop policy if exists "Editors can manage categories" on public.categories;
create policy "Editors can manage categories"
on public.categories
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
on public.products
for select
using (is_published = true or public.is_editor_or_admin());

drop policy if exists "Editors can manage products" on public.products;
create policy "Editors can manage products"
on public.products
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Public can read variants of published products" on public.product_variants;
create policy "Public can read variants of published products"
on public.product_variants
for select
using (
  (
    is_active = true
    and exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and p.is_published = true
    )
  )
  or public.is_editor_or_admin()
);

drop policy if exists "Editors can manage variants" on public.product_variants;
create policy "Editors can manage variants"
on public.product_variants
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Public can read images of published products" on public.product_images;
create policy "Public can read images of published products"
on public.product_images
for select
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.is_published = true
  )
  or public.is_editor_or_admin()
);

drop policy if exists "Editors can manage product images" on public.product_images;
create policy "Editors can manage product images"
on public.product_images
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

drop policy if exists "Public can read benefits of published products" on public.product_benefits;
create policy "Public can read benefits of published products"
on public.product_benefits
for select
using (
  exists (
    select 1 from public.products p
    where p.id = product_benefits.product_id
      and p.is_published = true
  )
  or public.is_editor_or_admin()
);

drop policy if exists "Editors can manage product benefits" on public.product_benefits;
create policy "Editors can manage product benefits"
on public.product_benefits
for all
using (public.is_editor_or_admin())
with check (public.is_editor_or_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-media', 'product-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('site-media', 'site-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public can view product and site media" on storage.objects;
create policy "Public can view product and site media"
on storage.objects
for select
using (bucket_id in ('product-media', 'site-media'));

drop policy if exists "Editors can upload product and site media" on storage.objects;
create policy "Editors can upload product and site media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('product-media', 'site-media')
  and public.is_editor_or_admin()
);

drop policy if exists "Editors can update product and site media" on storage.objects;
create policy "Editors can update product and site media"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('product-media', 'site-media')
  and public.is_editor_or_admin()
)
with check (
  bucket_id in ('product-media', 'site-media')
  and public.is_editor_or_admin()
);

drop policy if exists "Editors can delete product and site media" on storage.objects;
create policy "Editors can delete product and site media"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('product-media', 'site-media')
  and public.is_editor_or_admin()
);

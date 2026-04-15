alter table if exists public.categories
  add column if not exists deleted_at timestamptz;

create index if not exists idx_categories_deleted_active_sort
  on public.categories(is_active, deleted_at, sort_order);

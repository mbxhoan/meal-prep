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

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  category_code text not null unique,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  product_name text not null,
  category_id uuid references public.product_categories(id) on delete set null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  variant_code text not null unique,
  product_id uuid not null references public.products(id) on delete cascade,
  weight_value numeric(10,2) not null,
  weight_unit text not null default 'g',
  weight_label text not null,
  cost_price numeric(14,2) not null default 0,
  sale_price numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, weight_value, weight_unit)
);

create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  combo_code text not null unique,
  combo_name text not null,
  sale_price numeric(14,2) not null default 0,
  note text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.combos(id) on delete cascade,
  product_variant_id uuid not null references public.product_variants(id) on delete restrict,
  qty numeric(12,2) not null default 1,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(combo_id, product_variant_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  name text not null,
  phone text not null default '',
  address text not null default '',
  note text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  name text not null,
  phone text not null default '',
  note text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  order_date date not null default current_date,
  customer_id uuid references public.customers(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  delivery_address text not null default '',
  phone text not null default '',
  shipping_fee numeric(14,2) not null default 0,
  discount_type text not null default 'amount' check (discount_type in ('amount', 'percent')),
  discount_value numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  subtotal_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  balance_due numeric(14,2) generated always as (greatest(total_amount - amount_paid, 0)) stored,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'preparing', 'shipping', 'delivered', 'failed')),
  order_status text not null default 'draft' check (order_status in ('draft', 'confirmed', 'completed', 'cancelled')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  line_type text not null check (line_type in ('product_variant', 'combo')),
  product_variant_id uuid references public.product_variants(id) on delete set null,
  combo_id uuid references public.combos(id) on delete set null,
  item_name_snapshot text not null,
  weight_label_snapshot text not null default '',
  combo_detail_snapshot jsonb not null default '[]'::jsonb,
  qty numeric(12,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  cost_price numeric(14,2) not null default 0,
  line_subtotal numeric(14,2) not null default 0,
  line_cost_total numeric(14,2) not null default 0,
  line_profit_total numeric(14,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  payment_date timestamptz not null default now(),
  amount numeric(14,2) not null default 0,
  payment_method text not null default 'cash',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


drop trigger if exists set_product_categories_updated_at on public.product_categories;
drop trigger if exists set_products_updated_at on public.products;
drop trigger if exists set_product_variants_updated_at on public.product_variants;
drop trigger if exists set_combos_updated_at on public.combos;
drop trigger if exists set_combo_items_updated_at on public.combo_items;
drop trigger if exists set_customers_updated_at on public.customers;
drop trigger if exists set_employees_updated_at on public.employees;
drop trigger if exists set_sales_orders_updated_at on public.sales_orders;
drop trigger if exists set_sales_order_items_updated_at on public.sales_order_items;
drop trigger if exists set_payments_updated_at on public.payments;

create trigger set_product_categories_updated_at
before update on public.product_categories
for each row execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger set_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create trigger set_combos_updated_at
before update on public.combos
for each row execute function public.set_updated_at();

create trigger set_combo_items_updated_at
before update on public.combo_items
for each row execute function public.set_updated_at();

create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger set_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

create trigger set_sales_orders_updated_at
before update on public.sales_orders
for each row execute function public.set_updated_at();

create trigger set_sales_order_items_updated_at
before update on public.sales_order_items
for each row execute function public.set_updated_at();

create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.combos enable row level security;
alter table public.combo_items enable row level security;
alter table public.customers enable row level security;
alter table public.employees enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.payments enable row level security;


drop policy if exists "authenticated full access product_categories" on public.product_categories;
drop policy if exists "authenticated full access products" on public.products;
drop policy if exists "authenticated full access product_variants" on public.product_variants;
drop policy if exists "authenticated full access combos" on public.combos;
drop policy if exists "authenticated full access combo_items" on public.combo_items;
drop policy if exists "authenticated full access customers" on public.customers;
drop policy if exists "authenticated full access employees" on public.employees;
drop policy if exists "authenticated full access sales_orders" on public.sales_orders;
drop policy if exists "authenticated full access sales_order_items" on public.sales_order_items;
drop policy if exists "authenticated full access payments" on public.payments;

create policy "authenticated full access product_categories"
on public.product_categories
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access products"
on public.products
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access product_variants"
on public.product_variants
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access combos"
on public.combos
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access combo_items"
on public.combo_items
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access customers"
on public.customers
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access employees"
on public.employees
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access sales_orders"
on public.sales_orders
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access sales_order_items"
on public.sales_order_items
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access payments"
on public.payments
for all
to authenticated
using (true)
with check (true);

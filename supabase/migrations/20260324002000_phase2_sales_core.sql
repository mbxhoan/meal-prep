-- Phase 2 sales core for MealFit
-- sales_orders + sales_order_items + bill lifecycle + payments + audit

do $$
begin
  if to_regclass('public.shops') is null
    or to_regclass('public.customers') is null
    or to_regclass('public.employees') is null
    or to_regclass('public.price_books') is null
    or to_regclass('public.price_book_items') is null
    or to_regclass('public.menu_items') is null
    or to_regclass('public.menu_item_variants') is null
    or to_regclass('public.product_variants') is null
    or to_regclass('public.shop_configs') is null
    or to_regprocedure('public.has_permission(text)') is null
    or to_regprocedure('public.user_can_access_shop(uuid)') is null
    or to_regprocedure('public.log_audit_event(uuid,text,text,uuid,text,text,jsonb,jsonb,jsonb,inet,text)') is null then
    raise exception
      'Missing storefront base / Phase 0 / Phase 1 / shop config foundation. Apply 20260316230000_storefront_base.sql, 20260324000100_phase0_rbac_auth_shop_audit.sql, 20260324001000_phase1_master_data.sql, and 20260324001100_shop_configs_foundation.sql before this migration.';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Sales tables
-- -----------------------------------------------------------------------------
create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_no text not null,
  sales_channel text not null default 'manual' check (
    sales_channel in ('website', 'facebook', 'zalo', 'store', 'grab', 'manual')
  ),
  ordered_at timestamptz not null default now(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name_snapshot text not null,
  customer_phone_snapshot text,
  customer_address_snapshot text,
  employee_id uuid references public.employees(id) on delete set null,
  status text not null default 'draft' check (
    status in (
      'draft',
      'sent',
      'confirmed',
      'preparing',
      'ready',
      'delivered',
      'completed',
      'cancelled'
    )
  ),
  payment_status text not null default 'unpaid' check (
    payment_status in ('unpaid', 'partial', 'paid', 'refunded', 'void')
  ),
  price_book_id_snapshot uuid references public.price_books(id) on delete set null,
  subtotal_before_discount numeric(18,2) not null default 0,
  order_discount_type text,
  order_discount_value numeric(18,2),
  order_discount_amount numeric(18,2) not null default 0,
  shipping_fee numeric(18,2) not null default 0,
  other_fee numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  total_revenue numeric(18,2) not null default 0,
  total_cogs numeric(18,2) not null default 0,
  gross_profit numeric(18,2) not null default 0,
  gross_margin numeric(18,4) not null default 0,
  coupon_code_snapshot text,
  notes text,
  sent_at timestamptz,
  confirmed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, order_no)
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  menu_item_variant_id uuid references public.menu_item_variants(id) on delete set null,
  legacy_product_variant_id uuid references public.product_variants(id) on delete set null,
  price_book_item_id_snapshot uuid references public.price_book_items(id) on delete set null,
  item_name_snapshot text not null,
  variant_label_snapshot text,
  weight_grams_snapshot numeric(18,3),
  quantity numeric(18,3) not null default 0,
  unit_price_snapshot numeric(18,2) not null default 0,
  standard_cost_snapshot numeric(18,2) not null default 0,
  line_discount_type text,
  line_discount_value numeric(18,2),
  line_discount_amount numeric(18,2) not null default 0,
  line_total_before_discount numeric(18,2) not null default 0,
  line_total_after_discount numeric(18,2) not null default 0,
  line_cost_total numeric(18,2) not null default 0,
  line_profit_total numeric(18,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_order_status_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  action text not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  payment_method_id uuid,
  amount numeric(18,2) not null default 0,
  paid_at timestamptz not null default now(),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_sales_orders_shop_ordered
  on public.sales_orders (shop_id, ordered_at desc);

create index if not exists idx_sales_orders_status
  on public.sales_orders (shop_id, status, ordered_at desc);

create index if not exists idx_sales_orders_payment_status
  on public.sales_orders (shop_id, payment_status);

create index if not exists idx_sales_order_items_order
  on public.sales_order_items (sales_order_id);

create index if not exists idx_sales_order_items_menu_variant
  on public.sales_order_items (menu_item_variant_id);

create index if not exists idx_sales_order_items_legacy_variant
  on public.sales_order_items (legacy_product_variant_id);

create index if not exists idx_sales_order_status_logs_order
  on public.sales_order_status_logs (sales_order_id, created_at desc);

create index if not exists idx_sales_payments_order
  on public.sales_payments (sales_order_id, paid_at desc);

-- -----------------------------------------------------------------------------
-- Audit helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_sales_audit_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = coalesce(new.created_by, auth.uid());
    new.updated_by = coalesce(new.updated_by, auth.uid());
    new.created_at = coalesce(new.created_at, now());
    new.updated_at = coalesce(new.updated_at, now());
  else
    new.updated_by = auth.uid();
    new.updated_at = now();
  end if;

  return new;
end;
$$;

create or replace function public.audit_sales_change()
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
  v_entity_code text := nullif(
    coalesce(
      v_after ->> 'order_no',
      v_after ->> 'item_name_snapshot',
      v_after ->> 'price_book_id_snapshot',
      v_before ->> 'order_no',
      v_before ->> 'item_name_snapshot',
      v_before ->> 'price_book_id_snapshot'
    ),
    ''
  );
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
    p_entity_code := v_entity_code,
    p_message := format('%s %s', tg_table_name, v_action),
    p_before_json := v_before,
    p_after_json := v_after,
    p_metadata_json := jsonb_build_object(
      'table', tg_table_name,
      'operation', tg_op
    )
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.calculate_sales_order_item_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line_before numeric(18,2);
  v_discount_amount numeric(18,2);
begin
  v_line_before := round(coalesce(new.quantity, 0) * coalesce(new.unit_price_snapshot, 0), 2);
  new.line_total_before_discount := v_line_before;

  if coalesce(new.line_discount_type, '') = 'percent'
     and coalesce(new.line_discount_value, 0) > 0 then
    v_discount_amount := round(v_line_before * coalesce(new.line_discount_value, 0) / 100, 2);
  elsif coalesce(new.line_discount_type, '') in ('fixed', 'amount') then
    v_discount_amount := greatest(coalesce(new.line_discount_value, 0), 0);
  else
    v_discount_amount := greatest(coalesce(new.line_discount_amount, 0), 0);
  end if;

  v_discount_amount := least(v_discount_amount, v_line_before);
  new.line_discount_amount := v_discount_amount;
  new.line_total_after_discount := greatest(v_line_before - v_discount_amount, 0);
  new.line_cost_total := round(coalesce(new.quantity, 0) * coalesce(new.standard_cost_snapshot, 0), 2);
  new.line_profit_total := round(new.line_total_after_discount - new.line_cost_total, 2);

  return new;
end;
$$;

create or replace function public.refresh_sales_order_totals(p_sales_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal_before_discount numeric(18,2);
  v_total_cogs numeric(18,2);
  v_order_discount numeric(18,2);
  v_shipping numeric(18,2);
  v_other numeric(18,2);
  v_total_amount numeric(18,2);
  v_gross_profit numeric(18,2);
begin
  select
    coalesce(sum(line_total_after_discount), 0),
    coalesce(sum(line_cost_total), 0)
  into v_subtotal_before_discount, v_total_cogs
  from public.sales_order_items
  where sales_order_id = p_sales_order_id;

  select
    coalesce(order_discount_amount, 0),
    coalesce(shipping_fee, 0),
    coalesce(other_fee, 0)
  into v_order_discount, v_shipping, v_other
  from public.sales_orders
  where id = p_sales_order_id;

  v_total_amount := greatest(v_subtotal_before_discount - v_order_discount + v_shipping + v_other, 0);
  v_gross_profit := round(v_total_amount - v_total_cogs, 2);

  update public.sales_orders
  set subtotal_before_discount = v_subtotal_before_discount,
      total_amount = v_total_amount,
      total_revenue = v_total_amount,
      total_cogs = v_total_cogs,
      gross_profit = v_gross_profit,
      gross_margin = case
        when v_total_amount > 0
        then round(v_gross_profit / v_total_amount, 4)
        else 0
      end
  where id = p_sales_order_id;

  perform public.refresh_sales_payment_status(p_sales_order_id);
end;
$$;

create or replace function public.refresh_sales_payment_status(p_sales_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid_total numeric(18,2);
  v_order_status text;
  v_total_amount numeric(18,2);
  v_payment_status text;
begin
  select
    coalesce(sum(amount), 0)
  into v_paid_total
  from public.sales_payments
  where sales_order_id = p_sales_order_id;

  select
    status,
    total_amount
  into v_order_status,
    v_total_amount
  from public.sales_orders
  where id = p_sales_order_id;

  if v_order_status = 'cancelled' then
    v_payment_status := 'void';
  elsif v_paid_total < 0 then
    v_payment_status := 'refunded';
  elsif v_paid_total = 0 then
    v_payment_status := 'unpaid';
  elsif v_paid_total < coalesce(v_total_amount, 0) then
    v_payment_status := 'partial';
  else
    v_payment_status := 'paid';
  end if;

  update public.sales_orders
  set payment_status = v_payment_status
  where id = p_sales_order_id;
end;
$$;

create or replace function public.apply_sales_order_status_timestamps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status in ('sent', 'confirmed', 'preparing', 'ready', 'delivered', 'completed') then
      new.sent_at = coalesce(new.sent_at, now());
    end if;

    if new.status in ('confirmed', 'preparing', 'ready', 'delivered', 'completed') then
      new.confirmed_at = coalesce(new.confirmed_at, now());
    end if;

    if new.status = 'cancelled' then
      new.payment_status = 'void';
    end if;
  elsif new.status is distinct from old.status then
    if new.status in ('sent', 'confirmed', 'preparing', 'ready', 'delivered', 'completed') then
      new.sent_at = coalesce(old.sent_at, new.sent_at, now());
    end if;

    if new.status in ('confirmed', 'preparing', 'ready', 'delivered', 'completed') then
      new.confirmed_at = coalesce(old.confirmed_at, new.confirmed_at, now());
    end if;

    if new.status = 'cancelled' then
      new.payment_status = 'void';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.log_sales_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.sales_order_status_logs (
      shop_id,
      sales_order_id,
      from_status,
      to_status,
      action,
      note,
      changed_by
    )
    values (
      new.shop_id,
      new.id,
      old.status,
      new.status,
      case new.status
        when 'sent' then 'send'
        when 'confirmed' then 'confirm'
        when 'cancelled' then 'cancel'
        else 'status_change'
      end,
      null,
      auth.uid()
    );
  end if;

  return new;
end;
$$;

create or replace function public.handle_sales_order_item_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_sales_order_totals(coalesce(new.sales_order_id, old.sales_order_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.handle_sales_payment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_sales_payment_status(coalesce(new.sales_order_id, old.sales_order_id));
  return coalesce(new, old);
end;
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
drop trigger if exists trg_sales_orders_touch on public.sales_orders;
create trigger trg_sales_orders_touch
before insert or update on public.sales_orders
for each row
execute function public.set_sales_audit_columns();

drop trigger if exists trg_sales_order_items_touch on public.sales_order_items;
create trigger trg_sales_order_items_touch
before insert or update on public.sales_order_items
for each row
execute function public.set_sales_audit_columns();

drop trigger if exists trg_sales_payments_touch on public.sales_payments;
create trigger trg_sales_payments_touch
before insert or update on public.sales_payments
for each row
execute function public.set_sales_audit_columns();

drop trigger if exists trg_sales_order_items_calc on public.sales_order_items;
create trigger trg_sales_order_items_calc
before insert or update on public.sales_order_items
for each row
execute function public.calculate_sales_order_item_totals();

drop trigger if exists trg_sales_order_items_refresh on public.sales_order_items;
create trigger trg_sales_order_items_refresh
after insert or update or delete on public.sales_order_items
for each row
execute function public.handle_sales_order_item_change();

drop trigger if exists trg_sales_payments_refresh on public.sales_payments;
create trigger trg_sales_payments_refresh
after insert or update or delete on public.sales_payments
for each row
execute function public.handle_sales_payment_change();

drop trigger if exists trg_sales_orders_status on public.sales_orders;
create trigger trg_sales_orders_status
before insert or update of status on public.sales_orders
for each row
execute function public.apply_sales_order_status_timestamps();

drop trigger if exists trg_sales_orders_status_log on public.sales_orders;
create trigger trg_sales_orders_status_log
after update of status on public.sales_orders
for each row
execute function public.log_sales_order_status_change();

drop trigger if exists trg_sales_orders_audit on public.sales_orders;
create trigger trg_sales_orders_audit
after insert or update or delete on public.sales_orders
for each row
execute function public.audit_sales_change();

drop trigger if exists trg_sales_order_items_audit on public.sales_order_items;
create trigger trg_sales_order_items_audit
after insert or update or delete on public.sales_order_items
for each row
execute function public.audit_sales_change();

drop trigger if exists trg_sales_payments_audit on public.sales_payments;
create trigger trg_sales_payments_audit
after insert or update or delete on public.sales_payments
for each row
execute function public.audit_sales_change();

drop trigger if exists trg_sales_order_status_logs_audit on public.sales_order_status_logs;
create trigger trg_sales_order_status_logs_audit
after insert or update or delete on public.sales_order_status_logs
for each row
execute function public.audit_sales_change();

-- -----------------------------------------------------------------------------
-- RLS and grants
-- -----------------------------------------------------------------------------
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.sales_order_status_logs enable row level security;
alter table public.sales_payments enable row level security;

drop policy if exists read_sales_orders on public.sales_orders;
create policy read_sales_orders
on public.sales_orders
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.order.read')
    or public.has_permission('sales.bill.read')
  )
);

drop policy if exists insert_sales_orders on public.sales_orders;
create policy insert_sales_orders
on public.sales_orders
for insert
with check (
  public.user_can_access_shop(shop_id)
  and public.has_permission('sales.order.create')
);

drop policy if exists update_sales_orders on public.sales_orders;
create policy update_sales_orders
on public.sales_orders
for update
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.order.update_draft')
    or public.has_permission('sales.order.send')
    or public.has_permission('sales.order.confirm')
    or public.has_permission('sales.order.cancel')
    or public.has_permission('sales.order.refresh_price')
  )
)
with check (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.order.update_draft')
    or public.has_permission('sales.order.send')
    or public.has_permission('sales.order.confirm')
    or public.has_permission('sales.order.cancel')
    or public.has_permission('sales.order.refresh_price')
  )
);

drop policy if exists read_sales_order_items on public.sales_order_items;
create policy read_sales_order_items
on public.sales_order_items
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.order.read')
    or public.has_permission('sales.bill.read')
  )
);

drop policy if exists insert_sales_order_items on public.sales_order_items;
create policy insert_sales_order_items
on public.sales_order_items
for insert
with check (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.order.create')
    or public.has_permission('sales.order.update_draft')
    or public.has_permission('sales.order.refresh_price')
  )
);

drop policy if exists update_sales_order_items on public.sales_order_items;
create policy update_sales_order_items
on public.sales_order_items
for update
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.order.update_draft')
    or public.has_permission('sales.order.refresh_price')
  )
)
with check (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.order.update_draft')
    or public.has_permission('sales.order.refresh_price')
  )
);

drop policy if exists read_sales_order_status_logs on public.sales_order_status_logs;
create policy read_sales_order_status_logs
on public.sales_order_status_logs
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.order.read')
    or public.has_permission('sales.bill.read')
  )
);

drop policy if exists insert_sales_order_status_logs on public.sales_order_status_logs;
create policy insert_sales_order_status_logs
on public.sales_order_status_logs
for insert
with check (
  public.user_can_access_shop(shop_id)
);

drop policy if exists read_sales_payments on public.sales_payments;
create policy read_sales_payments
on public.sales_payments
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.payment.read')
    or public.has_permission('sales.bill.read')
  )
);

drop policy if exists insert_sales_payments on public.sales_payments;
create policy insert_sales_payments
on public.sales_payments
for insert
with check (
  public.user_can_access_shop(shop_id)
  and public.has_permission('sales.payment.record')
);

drop policy if exists update_sales_payments on public.sales_payments;
create policy update_sales_payments
on public.sales_payments
for update
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.payment.record')
    or public.has_permission('sales.payment.refund')
  )
)
with check (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('sales.payment.record')
    or public.has_permission('sales.payment.refund')
  )
);

grant select, insert, update on
  public.sales_orders,
  public.sales_order_items,
  public.sales_order_status_logs,
  public.sales_payments
to authenticated;

-- Read-only verification for a seeded MealPrep database.
-- Run with:
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f docs/seeding/db_seeded_ok_check.sql

select 'seed_import.customers' as table_name, count(*)::bigint as row_count from seed_import.customers
union all select 'seed_import.orders', count(*)::bigint from seed_import.orders
union all select 'seed_import.order_items', count(*)::bigint from seed_import.order_items
union all select 'seed_import.inventory_master', count(*)::bigint from seed_import.inventory_master
union all select 'seed_import.inventory_receipts', count(*)::bigint from seed_import.inventory_receipts
union all select 'seed_import.sales_inventory_map', count(*)::bigint from seed_import.sales_inventory_map
union all select 'seed_import.auto_issue_suggestions', count(*)::bigint from seed_import.auto_issue_suggestions
order by table_name;

select
  count(*) filter (where nullif(trim(inventory_code), '') is null) as missing_inventory_code,
  count(*) as total_rows
from seed_import.sales_inventory_map;

select
  count(*) filter (where nullif(trim(inventory_code), '') is null) as missing_inventory_code,
  count(*) as total_rows
from seed_import.auto_issue_suggestions;

select 'public.customers' as table_name, count(*)::bigint as row_count from public.customers
union all select 'public.sales_orders', count(*)::bigint from public.sales_orders
union all select 'public.sales_order_items', count(*)::bigint from public.sales_order_items
union all select 'public.inventory_items', count(*)::bigint from public.inventory_items
union all select 'public.sales_payments', count(*)::bigint from public.sales_payments
union all select 'public.inventory_receipts', count(*)::bigint from public.inventory_receipts
union all select 'public.inventory_receipt_items', count(*)::bigint from public.inventory_receipt_items
union all select 'public.inventory_lots', count(*)::bigint from public.inventory_lots
union all select 'public.inventory_movements', count(*)::bigint from public.inventory_movements
union all select 'public.inventory_issues', count(*)::bigint from public.inventory_issues
union all select 'public.inventory_issue_items', count(*)::bigint from public.inventory_issue_items
order by table_name;

select
  case
    when exists (select 1 from seed_import.inventory_receipts)
      then 'inventory_receipts present; expect lots/movements to be > 0 after importer'
    else 'inventory_receipts absent; zero receipts/lots/movements is expected'
  end as inventory_receipt_note;

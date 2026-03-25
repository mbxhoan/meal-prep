-- Smoke test for seed_import -> business schema importer.
-- Run this against a database that already has the business schema and seed_import data.
-- The transaction is rolled back so nothing persists.

begin;

do $$
declare
  v_shop_id uuid;
  v_missing_map_count bigint;
  v_order_count bigint;
  v_order_item_count bigint;
  v_receipt_count bigint;
  v_lot_count bigint;
  v_movement_count bigint;
  v_stock_view_count bigint;
  v_issue_count bigint;
begin
  if to_regclass('public.shops') is null
    or to_regclass('public.customers') is null
    or to_regclass('public.sales_orders') is null
    or to_regclass('public.sales_order_items') is null
    or to_regclass('public.sales_payments') is null
    or to_regclass('public.inventory_items') is null
    or to_regclass('public.inventory_lots') is null
    or to_regclass('public.inventory_movements') is null
    or to_regclass('public.inventory_receipts') is null
    or to_regclass('public.inventory_issues') is null
    or to_regclass('seed_import.sales_inventory_map') is null
    or to_regprocedure('public.import_seed_import_business_data(uuid)') is null
    or to_regprocedure('public.seed_import_missing_inventory_code_report()') is null then
    raise exception
      'Missing business schema or seed_import staging before importer smoke test.';
  end if;

  select id
  into v_shop_id
  from public.shops
  order by is_default desc, created_at asc
  limit 1;

  if v_shop_id is null then
    raise exception 'No shop is available for importer smoke test';
  end if;

  select count(*)
  into v_missing_map_count
  from seed_import.sales_inventory_map
  where nullif(trim(inventory_code), '') is null;

  if v_missing_map_count <> 0 then
    raise exception
      'seed_import.sales_inventory_map still has % rows without inventory_code',
      v_missing_map_count;
  end if;

  perform public.import_seed_import_business_data(v_shop_id);

  select count(*)
  into v_missing_map_count
  from public.seed_import_missing_inventory_code_report();

  if v_missing_map_count <> 0 then
    raise exception
      'Expected zero unresolved sales->inventory mappings, found %',
      v_missing_map_count;
  end if;

  select count(*)
  into v_order_count
  from public.sales_orders
  where shop_id = v_shop_id
    and import_source = 'seed_import';

  select count(*)
  into v_order_item_count
  from public.sales_order_items
  where shop_id = v_shop_id
    and import_source = 'seed_import';

  select count(*)
  into v_receipt_count
  from public.inventory_receipts
  where shop_id = v_shop_id
    and import_source = 'seed_import';

  select count(*)
  into v_lot_count
  from public.inventory_lots
  where shop_id = v_shop_id
    and import_source = 'seed_import';

  select count(*)
  into v_movement_count
  from public.inventory_movements
  where shop_id = v_shop_id
    and import_source = 'seed_import';

  select count(*)
  into v_stock_view_count
  from public.stock_movements
  where shop_id = v_shop_id
    and import_source = 'seed_import';

  select count(*)
  into v_issue_count
  from public.inventory_issues
  where shop_id = v_shop_id
    and import_source = 'seed_import';

  if v_order_count = 0 or v_order_item_count = 0 then
    raise exception
      'Importer smoke test did not create sales data: orders %, order_items %',
      v_order_count,
      v_order_item_count;
  end if;

  if v_receipt_count = 0 or v_lot_count = 0 or v_movement_count = 0 then
    raise exception
      'Importer smoke test did not create inventory data: receipts %, lots %, movements %',
      v_receipt_count,
      v_lot_count,
      v_movement_count;
  end if;

  if v_stock_view_count <> v_movement_count then
    raise exception
      'stock_movements view is out of sync with inventory_movements: view %, table %',
      v_stock_view_count,
      v_movement_count;
  end if;

  raise notice
    'Importer smoke test passed for shop %: orders=%, order_items=%, receipts=%, lots=%, movements=%, issues=%',
    v_shop_id,
    v_order_count,
    v_order_item_count,
    v_receipt_count,
    v_lot_count,
    v_movement_count,
    v_issue_count;
end
$$;

rollback;

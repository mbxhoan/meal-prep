create or replace function public.seed_import_missing_inventory_code_report()
returns table (
  sales_key text,
  product_name text,
  weight_label text,
  affected_orders text[],
  affected_auto_docs text[],
  affected_line_count bigint,
  notes text
)
language sql
stable
set search_path = public, seed_import
as $$
  select
    m.sales_key,
    coalesce(nullif(trim(m.product_name), ''), m.sales_key) as product_name,
    nullif(trim(m.weight_label), '') as weight_label,
    array_agg(distinct s.order_no) filter (where s.order_no is not null) as affected_orders,
    array_agg(distinct s.auto_doc_no) filter (where s.auto_doc_no is not null) as affected_auto_docs,
    count(s.id)::bigint as affected_line_count,
    max(m.notes) as notes
  from seed_import.sales_inventory_map m
  left join seed_import.auto_issue_suggestions s
    on s.sales_key = m.sales_key
  where nullif(trim(m.inventory_code), '') is null
  group by
    m.sales_key,
    coalesce(nullif(trim(m.product_name), ''), m.sales_key),
    nullif(trim(m.weight_label), '')
  order by
    product_name,
    weight_label,
    sales_key;
$$;

create or replace function public.import_seed_import_business_data(p_shop_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public, seed_import
as $$
declare
  v_shop_id uuid := coalesce(
    p_shop_id,
    (
      select id
      from public.shops
      order by is_default desc, created_at asc
      limit 1
    )
  );
  v_default_warehouse_id uuid;
  v_default_supplier_id uuid;
  v_receipt_header_id uuid;
  v_missing record;
begin
  if v_shop_id is null then
    raise exception 'No shop is available for seed import';
  end if;

  select id
  into v_default_warehouse_id
  from public.warehouses
  where shop_id = v_shop_id
    and is_default = true
    and deleted_at is null
  order by created_at asc
  limit 1;

  if v_default_warehouse_id is null then
    insert into public.warehouses (
      shop_id,
      code,
      name,
      is_default,
      is_active,
      note
    )
    values (
      v_shop_id,
      'DEFAULT',
      'Kho mặc định',
      true,
      true,
      'Auto-created as a fallback warehouse for seed import.'
    )
    on conflict (shop_id, code) do update
    set name = excluded.name,
        is_default = excluded.is_default,
        is_active = excluded.is_active,
        note = excluded.note
    returning id into v_default_warehouse_id;
  end if;

  select id
  into v_default_supplier_id
  from public.suppliers
  where shop_id = v_shop_id
    and code = 'DEFAULT'
    and deleted_at is null
  order by created_at asc
  limit 1;

  if v_default_supplier_id is null then
    insert into public.suppliers (
      shop_id,
      code,
      name,
      is_active,
      note
    )
    values (
      v_shop_id,
      'DEFAULT',
      'Nhà cung cấp mặc định',
      true,
      'Auto-created as a fallback supplier for seed import.'
    )
    on conflict (shop_id, code) do update
    set name = excluded.name,
        is_active = excluded.is_active,
        note = excluded.note
    returning id into v_default_supplier_id;
  end if;

  -- ---------------------------------------------------------------------------
  -- Customers
  -- ---------------------------------------------------------------------------
  insert into public.customers (
    shop_id,
    code,
    name,
    phone,
    email,
    address,
    note,
    is_active,
    import_source,
    import_source_id,
    import_source_row,
    source_payload
  )
  select
    v_shop_id,
    'CUST-' || replace(src.id::text, '-', ''),
    src.customer_name,
    nullif(trim(src.phone), ''),
    null,
    nullif(trim(src.address), ''),
    nullif(trim(src.notes), ''),
    true,
    'seed_import',
    src.id,
    src.source_row,
    to_jsonb(src)
  from seed_import.customers src
  where not exists (
    select 1
    from public.customers target
    where target.shop_id = v_shop_id
      and target.import_source = 'seed_import'
      and target.import_source_id = src.id
  );

  -- ---------------------------------------------------------------------------
  -- Inventory master
  -- ---------------------------------------------------------------------------
  insert into public.inventory_items (
    shop_id,
    sku,
    name,
    unit,
    barcode,
    barcode_type,
    tracking_mode,
    is_expirable,
    is_fefo_enabled,
    requires_unit_label,
    default_shelf_life_days,
    minimum_stock_qty,
    reorder_point,
    current_quantity,
    average_unit_cost,
    last_purchase_cost,
    supplier_name,
    image_url,
    notes,
    is_active,
    item_code,
    group_name,
    item_type,
    default_shelf_life_raw,
    recipe_link,
    import_source,
    import_source_id,
    import_source_row,
    source_payload
  )
  select
    v_shop_id,
    coalesce(nullif(trim(src.item_code), ''), 'INV-' || replace(src.id::text, '-', '')),
    src.item_name,
    coalesce(nullif(trim(src.unit), ''), 'phần'),
    nullif(trim(coalesce(src.barcode, src.item_code)), ''),
    case
      when nullif(trim(coalesce(src.barcode, src.item_code)), '') is not null then 'code128'
      else null
    end,
    case
      when coalesce(src.lot_managed, false) or coalesce(src.fefo_enabled, false) then 'lot'
      else 'none'
    end,
    coalesce(src.lot_managed, src.fefo_enabled, true),
    coalesce(src.fefo_enabled, src.lot_managed, true),
    false,
    null,
    greatest(coalesce(src.reorder_point, 0), 0),
    greatest(coalesce(src.reorder_point, 0), 0),
    0,
    0,
    0,
    null,
    null,
    nullif(trim(src.notes), ''),
    true,
    nullif(trim(src.item_code), ''),
    nullif(trim(src.group_name), ''),
    nullif(trim(src.item_type), ''),
    nullif(trim(src.default_shelf_life_raw), ''),
    nullif(trim(src.recipe_link), ''),
    'seed_import',
    src.id,
    src.source_row,
    to_jsonb(src)
  from seed_import.inventory_master src
  on conflict (sku) do update
  set
    shop_id = excluded.shop_id,
    name = excluded.name,
    unit = excluded.unit,
    barcode = excluded.barcode,
    barcode_type = excluded.barcode_type,
    tracking_mode = excluded.tracking_mode,
    is_expirable = excluded.is_expirable,
    is_fefo_enabled = excluded.is_fefo_enabled,
    requires_unit_label = excluded.requires_unit_label,
    default_shelf_life_days = excluded.default_shelf_life_days,
    minimum_stock_qty = excluded.minimum_stock_qty,
    reorder_point = excluded.reorder_point,
    current_quantity = excluded.current_quantity,
    average_unit_cost = excluded.average_unit_cost,
    last_purchase_cost = excluded.last_purchase_cost,
    supplier_name = excluded.supplier_name,
    image_url = excluded.image_url,
    notes = excluded.notes,
    is_active = excluded.is_active,
    item_code = excluded.item_code,
    group_name = excluded.group_name,
    item_type = excluded.item_type,
    default_shelf_life_raw = excluded.default_shelf_life_raw,
    recipe_link = excluded.recipe_link,
    import_source = excluded.import_source,
    import_source_id = excluded.import_source_id,
    import_source_row = excluded.import_source_row,
    source_payload = excluded.source_payload,
    updated_at = now();

  -- ---------------------------------------------------------------------------
  -- Sales orders
  -- ---------------------------------------------------------------------------
  insert into public.sales_orders (
    shop_id,
    order_no,
    sales_channel,
    ordered_at,
    customer_id,
    customer_name_snapshot,
    customer_phone_snapshot,
    customer_address_snapshot,
    employee_id,
    status,
    payment_status,
    price_book_id_snapshot,
    subtotal_before_discount,
    order_discount_type,
    order_discount_value,
    order_discount_amount,
    shipping_fee,
    other_fee,
    total_amount,
    total_revenue,
    total_cogs,
    gross_profit,
    gross_margin,
    coupon_code_snapshot,
    notes,
    sent_at,
    confirmed_at,
    created_by,
    updated_by,
    created_at,
    updated_at,
    handled_by_name_snapshot,
    import_source,
    import_source_id,
    import_source_row,
    source_payload
  )
  select
    v_shop_id,
    src.order_no,
    'manual',
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    ),
    customer_target.id,
    src.customer_name,
    nullif(trim(src.phone), ''),
    nullif(trim(src.address), ''),
    null,
    case
      when coalesce(src.paid_amount, 0) > 0
        and coalesce(src.paid_amount, 0) >= greatest(coalesce(src.after_discount, src.subtotal), 0)
      then 'completed'
      else 'confirmed'
    end,
    case
      when coalesce(src.paid_amount, 0) < 0 then 'refunded'
      when coalesce(src.paid_amount, 0) = 0 then 'unpaid'
      when coalesce(src.paid_amount, 0) < greatest(coalesce(src.after_discount, src.subtotal), 0)
      then 'partial'
      else 'paid'
    end,
    null,
    greatest(coalesce(src.subtotal, 0), 0),
    case
      when coalesce(src.discount_amount, 0) > 0 then 'amount'
      when coalesce(src.discount_pct, 0) > 0 then 'percent'
      else null
    end,
    case
      when coalesce(src.discount_amount, 0) > 0 then round(coalesce(src.discount_amount, 0), 2)
      when coalesce(src.discount_pct, 0) > 1 then round(coalesce(src.discount_pct, 0), 2)
      when coalesce(src.discount_pct, 0) > 0 then round(coalesce(src.discount_pct, 0) * 100, 2)
      else null
    end,
    greatest(coalesce(src.discount_amount, 0), 0),
    greatest(coalesce(src.shipping_fee, 0), 0),
    0,
    greatest(coalesce(src.after_discount, src.subtotal, 0) + coalesce(src.shipping_fee, 0), 0),
    0,
    0,
    0,
    0,
    null,
    nullif(trim(src.notes), ''),
    case
      when coalesce(src.paid_amount, 0) > 0
        and coalesce(src.paid_amount, 0) >= greatest(coalesce(src.after_discount, src.subtotal), 0)
      then make_timestamptz(
        extract(year from src.order_date)::int,
        extract(month from src.order_date)::int,
        extract(day from src.order_date)::int,
        0,
        0,
        0,
        'Asia/Ho_Chi_Minh'
      )
      else make_timestamptz(
        extract(year from src.order_date)::int,
        extract(month from src.order_date)::int,
        extract(day from src.order_date)::int,
        0,
        0,
        0,
        'Asia/Ho_Chi_Minh'
      )
    end,
    case
      when coalesce(src.paid_amount, 0) > 0
        and coalesce(src.paid_amount, 0) >= greatest(coalesce(src.after_discount, src.subtotal), 0)
      then make_timestamptz(
        extract(year from src.order_date)::int,
        extract(month from src.order_date)::int,
        extract(day from src.order_date)::int,
        0,
        0,
        0,
        'Asia/Ho_Chi_Minh'
      )
      else make_timestamptz(
        extract(year from src.order_date)::int,
        extract(month from src.order_date)::int,
        extract(day from src.order_date)::int,
        0,
        0,
        0,
        'Asia/Ho_Chi_Minh'
      )
    end,
    null,
    null,
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    ),
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    ),
    nullif(trim(src.staff_name), ''),
    'seed_import',
    src.id,
    row_number() over (order by src.order_no),
    to_jsonb(src)
  from seed_import.orders src
  left join lateral (
    select customers.id
    from seed_import.customers customers
    where public.seed_import_normalize_text(customers.customer_name) = public.seed_import_normalize_text(src.customer_name)
      and (
        public.seed_import_normalize_text(src.phone) is null
        or public.seed_import_normalize_text(customers.phone) = public.seed_import_normalize_text(src.phone)
      )
    order by
      case
        when public.seed_import_normalize_text(customers.phone) = public.seed_import_normalize_text(src.phone) then 0
        else 1
      end,
      customers.source_row asc
    limit 1
  ) matched_customer on true
  left join public.customers customer_target
    on customer_target.import_source = 'seed_import'
   and customer_target.import_source_id = matched_customer.id
  on conflict (shop_id, order_no) do nothing;

  -- ---------------------------------------------------------------------------
  -- Sales order items
  -- ---------------------------------------------------------------------------
  insert into public.sales_order_items (
    shop_id,
    sales_order_id,
    menu_item_variant_id,
    legacy_product_variant_id,
    price_book_item_id_snapshot,
    item_name_snapshot,
    variant_label_snapshot,
    weight_grams_snapshot,
    quantity,
    unit_price_snapshot,
    standard_cost_snapshot,
    line_discount_type,
    line_discount_value,
    line_discount_amount,
    line_total_before_discount,
    line_total_after_discount,
    line_cost_total,
    line_profit_total,
    import_source,
    import_source_id,
    import_source_row,
    source_payload,
    created_at,
    updated_at
  )
  select
    v_shop_id,
    so.id,
    null,
    src.current_variant_id,
    null,
    src.product_name,
    src.weight_label,
    case
      when coalesce(src.quantity, 0) > 0
      then round(coalesce(src.total_weight_grams, 0) / coalesce(src.quantity, 0), 3)
      else null
    end,
    coalesce(src.quantity, 0),
    coalesce(src.unit_price, 0),
    coalesce(src.unit_cost_snapshot, 0),
    null,
    null,
    0,
    round(coalesce(src.quantity, 0) * coalesce(src.unit_price, 0), 2),
    round(coalesce(src.quantity, 0) * coalesce(src.unit_price, 0), 2),
    round(coalesce(src.quantity, 0) * coalesce(src.unit_cost_snapshot, 0), 2),
    round(
      (coalesce(src.quantity, 0) * coalesce(src.unit_price, 0))
      - (coalesce(src.quantity, 0) * coalesce(src.unit_cost_snapshot, 0)),
      2
    ),
    'seed_import',
    src.id,
    src.line_no,
    to_jsonb(src),
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    ),
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    )
  from seed_import.order_items src
  join public.sales_orders so
    on so.shop_id = v_shop_id
   and so.order_no = src.order_no
  on conflict (shop_id, import_source, import_source_id) do nothing;

  -- ---------------------------------------------------------------------------
  -- Payments and status logs
  -- ---------------------------------------------------------------------------
  insert into public.sales_payments (
    shop_id,
    sales_order_id,
    payment_method_id,
    amount,
    paid_at,
    note,
    import_source,
    import_source_id,
    import_source_row,
    source_payload,
    created_at,
    updated_at
  )
  select
    v_shop_id,
    so.id,
    null,
    coalesce(src.paid_amount, 0),
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    ),
    nullif(trim(src.notes), ''),
    'seed_import',
    src.id,
    row_number() over (order by src.order_no),
    to_jsonb(src),
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    ),
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    )
  from seed_import.orders src
  join public.sales_orders so
    on so.shop_id = v_shop_id
   and so.order_no = src.order_no
  where coalesce(src.paid_amount, 0) > 0
  on conflict (shop_id, import_source, import_source_id) do nothing;

  insert into public.sales_order_status_logs (
    shop_id,
    sales_order_id,
    from_status,
    to_status,
    action,
    note,
    changed_by,
    import_source,
    import_source_id,
    import_source_row,
    source_payload,
    created_at
  )
  select
    v_shop_id,
    so.id,
    null,
    so.status,
    'import',
    'Imported from seed_import.orders',
    null,
    'seed_import',
    src.id,
    row_number() over (order by src.order_no),
    to_jsonb(src),
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    )
  from seed_import.orders src
  join public.sales_orders so
    on so.shop_id = v_shop_id
   and so.order_no = src.order_no
  on conflict (shop_id, import_source, import_source_id) do nothing;

  -- ---------------------------------------------------------------------------
  -- Receipt warehouses / suppliers and posted receipts
  -- ---------------------------------------------------------------------------
  insert into public.warehouses (
    shop_id,
    code,
    name,
    is_default,
    is_active,
    note
  )
  select distinct
    v_shop_id,
    'SEED-WH-' || substr(md5(public.seed_import_normalize_text(src.warehouse_name)), 1, 10),
    trim(src.warehouse_name),
    false,
    true,
    'Imported from seed_import.inventory_receipts'
  from seed_import.inventory_receipts src
  where public.seed_import_normalize_text(src.warehouse_name) is not null
  on conflict (shop_id, code) do nothing;

  insert into public.suppliers (
    shop_id,
    code,
    name,
    is_active,
    note
  )
  select distinct
    v_shop_id,
    'SEED-SUP-' || substr(md5(public.seed_import_normalize_text(src.supplier_name)), 1, 10),
    trim(src.supplier_name),
    true,
    'Imported from seed_import.inventory_receipts'
  from seed_import.inventory_receipts src
  where public.seed_import_normalize_text(src.supplier_name) is not null
  on conflict (shop_id, code) do nothing;

  insert into public.inventory_receipts (
    shop_id,
    receipt_no,
    received_at,
    warehouse_id,
    supplier_id,
    status,
    note,
    posted_at,
    import_source,
    import_source_id,
    import_source_row,
    source_payload
  )
  select
    v_shop_id,
    grouped.receipt_no,
      coalesce(
        make_timestamptz(
          extract(year from grouped.receipt_date)::int,
          extract(month from grouped.receipt_date)::int,
          extract(day from grouped.receipt_date)::int,
          0,
          0,
          0,
          'Asia/Ho_Chi_Minh'
        ),
        now()
      ),
      coalesce(warehouse_target.id, v_default_warehouse_id),
      supplier_target.id,
      'draft',
      format('Imported from seed_import.inventory_receipts (%s lines)', grouped.line_count),
      null,
      'seed_import',
      public.seed_import_uuid('seed_import.inventory_receipts:' || grouped.receipt_no),
      grouped.group_row,
      jsonb_build_object(
        'receipt_no', grouped.receipt_no,
      'receipt_date', grouped.receipt_date,
      'warehouse_name', grouped.warehouse_name,
      'supplier_name', grouped.supplier_name,
      'line_count', grouped.line_count,
      'lines', grouped.lines_json
    )
  from (
    select
      src.receipt_no,
      min(src.receipt_date) as receipt_date,
      max(nullif(trim(src.warehouse_name), '')) as warehouse_name,
      max(nullif(trim(src.supplier_name), '')) as supplier_name,
      count(*)::integer as line_count,
      jsonb_agg(to_jsonb(src) order by src.source_row) as lines_json,
      row_number() over (order by src.receipt_no) as group_row
    from seed_import.inventory_receipts src
    group by src.receipt_no
  ) grouped
  left join public.warehouses warehouse_target
    on warehouse_target.shop_id = v_shop_id
   and warehouse_target.code = 'SEED-WH-' || substr(md5(public.seed_import_normalize_text(grouped.warehouse_name)), 1, 10)
  left join public.suppliers supplier_target
    on supplier_target.shop_id = v_shop_id
   and supplier_target.code = 'SEED-SUP-' || substr(md5(public.seed_import_normalize_text(grouped.supplier_name)), 1, 10)
  on conflict (shop_id, receipt_no) do nothing;

  insert into public.inventory_receipt_items (
    shop_id,
    inventory_receipt_id,
    item_id,
    lot_id,
    lot_no_snapshot,
    lot_barcode_snapshot,
    qty_received,
    unit_cost,
    line_total,
    manufactured_at,
    expired_at,
    note,
    import_source,
    import_source_id,
    import_source_row,
    source_payload
  )
  select
    v_shop_id,
    receipt_target.id,
    item_target.id,
    null,
    coalesce(
      nullif(trim(src.lot_code), ''),
      format('%s-%s', src.receipt_no, coalesce(src.source_row::text, '1'))
    ),
    nullif(trim(src.lot_barcode), ''),
    coalesce(src.qty, 0),
    coalesce(src.unit_cost, 0),
    coalesce(src.total_cost, round(coalesce(src.qty, 0) * coalesce(src.unit_cost, 0), 2)),
    coalesce(src.mfg_date::timestamptz, null),
    coalesce(src.exp_date::timestamptz, null),
    nullif(trim(coalesce(src.notes, src.hsd_warning)), ''),
    'seed_import',
    src.id,
    src.source_row,
    to_jsonb(src)
  from seed_import.inventory_receipts src
  join public.inventory_receipts receipt_target
    on receipt_target.shop_id = v_shop_id
   and receipt_target.receipt_no = src.receipt_no
  join public.inventory_items item_target
    on item_target.shop_id = v_shop_id
   and item_target.sku = src.item_code
  on conflict (shop_id, import_source, import_source_id) do nothing;

  for v_receipt_header_id in
    select id
    from public.inventory_receipts
    where shop_id = v_shop_id
      and import_source = 'seed_import'
    order by received_at asc, receipt_no asc
  loop
    perform public.post_inventory_receipt(v_receipt_header_id);
  end loop;

  update public.inventory_receipt_items receipt_item
  set lot_id = lot_target.id
  from public.inventory_receipts receipt_header,
       public.inventory_lots lot_target
  where receipt_item.inventory_receipt_id = receipt_header.id
    and receipt_header.shop_id = v_shop_id
    and receipt_header.import_source = 'seed_import'
    and receipt_item.lot_id is null
    and lot_target.shop_id = receipt_header.shop_id
    and lot_target.item_id = receipt_item.item_id
    and lot_target.lot_no = receipt_item.lot_no_snapshot;

  update public.inventory_lots lot_target
  set import_source = coalesce(lot_target.import_source, 'seed_import'),
      import_source_id = coalesce(lot_target.import_source_id, receipt_item.import_source_id),
      import_source_row = coalesce(lot_target.import_source_row, receipt_item.import_source_row),
      source_payload = coalesce(lot_target.source_payload, receipt_item.source_payload)
  from public.inventory_receipt_items receipt_item,
       public.inventory_receipts receipt_header
  where receipt_item.inventory_receipt_id = receipt_header.id
    and receipt_header.shop_id = v_shop_id
    and receipt_header.import_source = 'seed_import'
    and receipt_item.lot_id = lot_target.id;

  update public.inventory_movements movement
  set import_source = coalesce(movement.import_source, 'seed_import'),
      import_source_id = coalesce(movement.import_source_id, receipt_item.import_source_id),
      import_source_row = coalesce(movement.import_source_row, receipt_item.import_source_row),
      source_payload = coalesce(movement.source_payload, receipt_item.source_payload)
  from public.inventory_receipt_items receipt_item,
       public.inventory_receipts receipt_header
  where movement.reference_type = 'inventory_receipt'
    and movement.reference_id = receipt_header.id
    and movement.reference_line_id = receipt_item.id
    and receipt_header.shop_id = v_shop_id
    and receipt_header.import_source = 'seed_import';

  -- ---------------------------------------------------------------------------
  -- Warn about unresolved sales → inventory mapping rows before issue import.
  -- ---------------------------------------------------------------------------
  for v_missing in
    select *
    from public.seed_import_missing_inventory_code_report()
  loop
    raise notice
      'Missing inventory_code mapping: % | % | %',
      v_missing.sales_key,
      v_missing.product_name,
      coalesce(v_missing.weight_label, '');
  end loop;

  -- ---------------------------------------------------------------------------
  -- Auto issue suggestions become draft issue documents when mapping exists.
  -- Rows without inventory_code are intentionally skipped and reported above.
  -- ---------------------------------------------------------------------------
  insert into public.inventory_issues (
    shop_id,
    issue_no,
    issued_at,
    warehouse_id,
    status,
    reason_code,
    source_type,
    source_id,
    note,
    posted_at,
    import_source,
    import_source_id,
    import_source_row,
    source_payload
  )
  select
    v_shop_id,
    src.auto_doc_no,
    make_timestamptz(
      extract(year from src.order_date)::int,
      extract(month from src.order_date)::int,
      extract(day from src.order_date)::int,
      0,
      0,
      0,
      'Asia/Ho_Chi_Minh'
    ),
    v_default_warehouse_id,
    'draft',
    'auto_issue_suggestion',
    'seed_import.auto_issue_suggestions',
    src.id,
    format('%s | %s', src.customer_name, src.status),
    null,
    'seed_import',
    src.id,
    src.source_row,
    to_jsonb(src)
  from seed_import.auto_issue_suggestions src
  on conflict (shop_id, issue_no) do nothing;

  insert into public.inventory_issue_items (
    shop_id,
    inventory_issue_id,
    item_id,
    lot_id,
    suggested_lot_id,
    lot_no_snapshot,
    lot_barcode_snapshot,
    qty_issued,
    fefo_overridden,
    fefo_override_reason,
    note,
    import_source,
    import_source_id,
    import_source_row,
    source_payload
  )
  select
    v_shop_id,
    issue_target.id,
    item_target.id,
    null,
    lot_target.id,
    coalesce(
      nullif(trim(src.suggested_lot_code), ''),
      nullif(trim(src.consumed_lot_code), '')
    ),
    nullif(trim(src.consumed_lot_barcode), ''),
    coalesce(src.issue_qty, src.sale_qty * src.issue_factor, 0),
    false,
    null,
    nullif(trim(coalesce(src.fefo_check, src.status)), ''),
    'seed_import',
    src.id,
    src.source_row,
    to_jsonb(src)
  from seed_import.auto_issue_suggestions src
  left join seed_import.sales_inventory_map map_row
    on map_row.sales_key = src.sales_key
  join public.inventory_issues issue_target
    on issue_target.shop_id = v_shop_id
   and issue_target.issue_no = src.auto_doc_no
  join public.inventory_items item_target
    on item_target.shop_id = v_shop_id
   and item_target.sku = coalesce(
     nullif(trim(src.inventory_code), ''),
     nullif(trim(map_row.inventory_code), '')
   )
  left join public.inventory_lots lot_target
    on lot_target.shop_id = v_shop_id
   and lot_target.item_id = item_target.id
   and lot_target.lot_no = coalesce(
     nullif(trim(src.suggested_lot_code), ''),
     nullif(trim(src.consumed_lot_code), '')
   )
  where coalesce(
    nullif(trim(src.inventory_code), ''),
    nullif(trim(map_row.inventory_code), '')
  ) is not null
  on conflict (shop_id, import_source, import_source_id) do nothing;

  raise notice 'Seed import completed for shop %', v_shop_id;
end;
$$;

select public.import_seed_import_business_data();
select * from public.seed_import_missing_inventory_code_report();

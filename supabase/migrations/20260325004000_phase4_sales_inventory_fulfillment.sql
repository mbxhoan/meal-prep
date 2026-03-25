-- Phase 4: sales ↔ inventory fulfillment (menu variant → stock item, confirm → issue draft, FEFO, post)

do $$
begin
  if to_regclass('public.menu_item_variants') is null
    or to_regclass('public.inventory_issues') is null
    or to_regclass('public.sales_orders') is null
    or to_regprocedure('public.suggest_fefo_lots(uuid,numeric,uuid,uuid,boolean)') is null
    or to_regprocedure('public.has_permission(text)') is null
    or to_regprocedure('public.user_can_access_shop(uuid)') is null
    or to_regprocedure('public.log_audit_event(uuid,text,text,uuid,text,text,jsonb,jsonb,jsonb,inet,text)') is null then
    raise exception
      'Missing Phase 1–3 foundation before Phase 4 fulfillment migration.';
  end if;
end
$$;

-- Variant → inventory_items (ledger SKU) for fulfillment / FEFO
alter table public.menu_item_variants
  add column if not exists fulfillment_inventory_item_id uuid references public.inventory_items(id) on delete set null;

create index if not exists idx_menu_item_variants_fulfillment_item
  on public.menu_item_variants (shop_id, fulfillment_inventory_item_id)
  where fulfillment_inventory_item_id is not null;

-- Trace which order line drove each issue line (optional on manual issues)
alter table public.inventory_issue_items
  add column if not exists sales_order_item_id uuid references public.sales_order_items(id) on delete set null;

create index if not exists idx_inventory_issue_items_sales_line
  on public.inventory_issue_items (sales_order_item_id)
  where sales_order_item_id is not null;

-- -----------------------------------------------------------------------------
-- Post issue: support non-lot items (tracking_mode = none) without FEFO lots
-- -----------------------------------------------------------------------------
create or replace function public.post_inventory_issue(p_issue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue public.inventory_issues%rowtype;
  v_line public.inventory_issue_items%rowtype;
  v_chosen_lot_id uuid;
  v_available numeric(18,3);
  v_item public.inventory_items%rowtype;
  v_fefo_lot uuid;
begin
  select *
  into v_issue
  from public.inventory_issues
  where id = p_issue_id
  for update;

  if not found then
    raise exception 'Inventory issue % not found', p_issue_id;
  end if;

  if v_issue.status = 'posted' then
    return;
  end if;

  for v_line in
    select *
    from public.inventory_issue_items
    where inventory_issue_id = p_issue_id
    order by created_at asc
  loop
    select *
    into v_item
    from public.inventory_items
    where id = v_line.item_id
    limit 1;

    if not found then
      raise exception 'Inventory item % not found', v_line.item_id;
    end if;

    if coalesce(v_item.tracking_mode, 'lot') = 'none' then
      v_chosen_lot_id := null;

      select coalesce(sum(quantity_delta), 0)
      into v_available
      from public.inventory_movements
      where shop_id = v_issue.shop_id
        and coalesce(item_id, inventory_item_id) = v_line.item_id
        and warehouse_id is not distinct from v_issue.warehouse_id;

      if v_available < v_line.qty_issued then
        raise exception
          'Insufficient stock for item % in warehouse: available %, requested %',
          v_line.item_id,
          v_available,
          v_line.qty_issued;
      end if;

      update public.inventory_issue_items
      set lot_id = null,
          suggested_lot_id = null,
          fefo_overridden = false,
          fefo_override_reason = null
      where id = v_line.id;

      insert into public.inventory_movements (
        shop_id,
        warehouse_id,
        item_id,
        inventory_item_id,
        lot_id,
        movement_type,
        quantity_delta,
        unit_cost,
        reference_type,
        reference_id,
        reference_line_id,
        notes,
        created_by,
        movement_at
      )
      values (
        v_issue.shop_id,
        v_issue.warehouse_id,
        v_line.item_id,
        v_line.item_id,
        null,
        'issue',
        -abs(coalesce(v_line.qty_issued, 0)),
        v_item.average_unit_cost,
        'inventory_issue',
        v_issue.id,
        v_line.id,
        v_line.note,
        auth.uid(),
        v_issue.issued_at
      );

      continue;
    end if;

    v_chosen_lot_id := coalesce(v_line.lot_id, v_line.suggested_lot_id);

    if v_chosen_lot_id is null then
      select lot_id
      into v_fefo_lot
      from public.suggest_fefo_lots(
        v_line.item_id,
        v_line.qty_issued,
        v_issue.warehouse_id,
        v_issue.shop_id,
        false
      )
      order by fefo_rank
      limit 1;

      v_chosen_lot_id := v_fefo_lot;
    end if;

    if v_chosen_lot_id is null then
      raise exception 'No FEFO candidate lot found for item %', v_line.item_id;
    end if;

    select coalesce(sum(quantity_delta), 0)
    into v_available
    from public.inventory_movements
    where lot_id = v_chosen_lot_id;

    if v_available < v_line.qty_issued then
      raise exception
        'Insufficient lot stock for lot %: available %, requested %',
        v_chosen_lot_id,
        v_available,
        v_line.qty_issued;
    end if;

    if v_line.suggested_lot_id is not null
      and v_chosen_lot_id is distinct from v_line.suggested_lot_id then
      if not public.has_permission('inventory.fefo.override') then
        raise exception 'Permission denied for FEFO override';
      end if;

      if coalesce(v_line.fefo_override_reason, '') = '' then
        raise exception 'FEFO override reason is required';
      end if;
    end if;

    update public.inventory_issue_items
    set lot_id = v_chosen_lot_id,
        fefo_overridden = v_line.suggested_lot_id is not null
          and v_chosen_lot_id is distinct from v_line.suggested_lot_id,
        fefo_override_reason = case
          when v_line.suggested_lot_id is not null
            and v_chosen_lot_id is distinct from v_line.suggested_lot_id
          then v_line.fefo_override_reason
          else coalesce(fefo_override_reason, v_line.fefo_override_reason)
        end
    where id = v_line.id;

    insert into public.inventory_movements (
      shop_id,
      warehouse_id,
      item_id,
      inventory_item_id,
      lot_id,
      movement_type,
      quantity_delta,
      unit_cost,
      reference_type,
      reference_id,
      reference_line_id,
      notes,
      created_by,
      movement_at
    )
    values (
      v_issue.shop_id,
      v_issue.warehouse_id,
      v_line.item_id,
      v_line.item_id,
      v_chosen_lot_id,
      'issue',
      -abs(coalesce(v_line.qty_issued, 0)),
      v_item.average_unit_cost,
      'inventory_issue',
      v_issue.id,
      v_line.id,
      v_line.note,
      auth.uid(),
      v_issue.issued_at
    );
  end loop;

  update public.inventory_issues
  set status = 'posted',
      posted_at = now()
  where id = p_issue_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Confirm / fulfillment: draft issue from sales order (FEFO suggestion per line)
-- -----------------------------------------------------------------------------
create or replace function public.create_fulfillment_issue_draft_from_sales_order(p_sales_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.sales_orders%rowtype;
  v_wh uuid;
  v_issue_id uuid;
  v_issue_no text;
  v_line public.sales_order_items%rowtype;
  v_inv_item uuid;
  v_suggested_lot uuid;
  v_inserted integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not (
    public.has_permission('sales.order.confirm')
    or public.has_permission('inventory.issue.create')
  ) then
    raise exception 'Permission denied';
  end if;

  select *
  into v_order
  from public.sales_orders
  where id = p_sales_order_id
  for update;

  if not found then
    raise exception 'Sales order % not found', p_sales_order_id;
  end if;

  if not public.user_can_access_shop(v_order.shop_id) then
    raise exception 'Shop access denied';
  end if;

  if v_order.status is distinct from 'confirmed' then
    raise exception 'Order must be confirmed before fulfillment draft (status=%)', v_order.status;
  end if;

  select id
  into v_issue_id
  from public.inventory_issues
  where shop_id = v_order.shop_id
    and source_type = 'sales_order'
    and source_id = p_sales_order_id
    and status = 'draft'
  limit 1;

  if found then
    return v_issue_id;
  end if;

  select w.id
  into v_wh
  from public.warehouses w
  where w.shop_id = v_order.shop_id
    and w.deleted_at is null
    and w.is_default = true
  limit 1;

  if v_wh is null then
    select w.id
    into v_wh
    from public.warehouses w
    where w.shop_id = v_order.shop_id
      and w.deleted_at is null
    order by w.created_at asc
    limit 1;
  end if;

  if v_wh is null then
    raise exception 'No warehouse configured for shop %', v_order.shop_id;
  end if;

  v_issue_id := gen_random_uuid();
  v_issue_no := 'ISS-' || v_order.order_no;

  insert into public.inventory_issues (
    id,
    shop_id,
    issue_no,
    issued_at,
    warehouse_id,
    status,
    reason_code,
    source_type,
    source_id,
    note
  )
  values (
    v_issue_id,
    v_order.shop_id,
    v_issue_no,
    coalesce(v_order.confirmed_at, now()),
    v_wh,
    'draft',
    'sales_fulfillment',
    'sales_order',
    p_sales_order_id,
    format('Auto draft for order %s', v_order.order_no)
  );

  for v_line in
    select *
    from public.sales_order_items
    where sales_order_id = p_sales_order_id
      and shop_id = v_order.shop_id
    order by created_at asc
  loop
    v_inv_item := null;
    v_suggested_lot := null;

    if v_line.menu_item_variant_id is not null then
      select m.fulfillment_inventory_item_id
      into v_inv_item
      from public.menu_item_variants m
      where m.id = v_line.menu_item_variant_id
        and m.shop_id = v_order.shop_id
        and m.deleted_at is null;
    end if;

    if v_inv_item is null then
      continue;
    end if;

    if exists (
      select 1
      from public.inventory_items ii
      where ii.id = v_inv_item
        and coalesce(ii.tracking_mode, 'lot') <> 'none'
    ) then
      select s.lot_id
      into v_suggested_lot
      from public.suggest_fefo_lots(
        v_inv_item,
        v_line.quantity,
        v_wh,
        v_order.shop_id,
        false
      ) s
      where coalesce(s.suggested_qty, 0) > 0
      order by s.fefo_rank
      limit 1;
    end if;

    insert into public.inventory_issue_items (
      shop_id,
      inventory_issue_id,
      item_id,
      lot_id,
      suggested_lot_id,
      qty_issued,
      note,
      sales_order_item_id
    )
    values (
      v_order.shop_id,
      v_issue_id,
      v_inv_item,
      null,
      v_suggested_lot,
      v_line.quantity,
      format(
        'Order %s · %s %s',
        v_order.order_no,
        v_line.item_name_snapshot,
        coalesce(v_line.variant_label_snapshot, '')
      ),
      v_line.id
    );

    v_inserted := v_inserted + 1;
  end loop;

  if v_inserted = 0 then
    delete from public.inventory_issues
    where id = v_issue_id;
    perform public.log_audit_event(
      p_shop_id := v_order.shop_id,
      p_action := 'sales_fulfillment_skip',
      p_entity_name := 'sales_orders',
      p_entity_id := p_sales_order_id,
      p_entity_code := v_order.order_no,
      p_message := 'Confirmed order had no mapped fulfillment inventory items; issue draft skipped',
      p_before_json := null,
      p_after_json := jsonb_build_object('sales_order_id', p_sales_order_id),
      p_metadata_json := jsonb_build_object('rpc', 'create_fulfillment_issue_draft_from_sales_order')
    );
    return null;
  end if;

  perform public.log_audit_event(
    p_shop_id := v_order.shop_id,
    p_action := 'create',
    p_entity_name := 'inventory_issues',
    p_entity_id := v_issue_id,
    p_entity_code := v_issue_no,
    p_message := format('Fulfillment issue draft from order %s', v_order.order_no),
    p_before_json := null,
    p_after_json := jsonb_build_object(
      'sales_order_id', p_sales_order_id,
      'issue_no', v_issue_no,
      'lines', v_inserted
    ),
    p_metadata_json := jsonb_build_object('source', 'sales_order_confirm')
  );

  return v_issue_id;
end;
$$;

grant execute on function public.create_fulfillment_issue_draft_from_sales_order(uuid) to authenticated;

-- Allow sales readers to see issues created from orders (bill ↔ fulfillment)
drop policy if exists read_inventory_issues on public.inventory_issues;
create policy read_inventory_issues
on public.inventory_issues
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.issue.read')
    or public.has_permission('inventory.stock.read')
    or (
      public.has_permission('sales.order.read')
      and source_type = 'sales_order'
      and source_id is not null
    )
  )
);

drop policy if exists read_inventory_issue_items on public.inventory_issue_items;
create policy read_inventory_issue_items
on public.inventory_issue_items
for select
using (
  public.user_can_access_shop(shop_id)
  and (
    public.has_permission('inventory.issue.read')
    or public.has_permission('inventory.stock.read')
    or (
      public.has_permission('sales.order.read')
      and exists (
        select 1
        from public.inventory_issues issues
        where issues.id = inventory_issue_items.inventory_issue_id
          and issues.source_type = 'sales_order'
          and issues.source_id is not null
      )
    )
  )
);

-- Align sales tables with the Google Sheet workflow
-- Adds workbook-facing fields for order type, delivery status, and shipper

alter table public.sales_orders
  add column if not exists order_type text not null default 'order' check (
    order_type in ('ready_made', 'order')
  ),
  add column if not exists delivery_status text not null default 'pending' check (
    delivery_status in ('pending', 'delivered')
  ),
  add column if not exists shipper_name text;

comment on column public.sales_orders.order_type is 'Workbook-facing order type: ready_made or order.';
comment on column public.sales_orders.delivery_status is 'Workbook-facing shipping status: pending or delivered.';
comment on column public.sales_orders.shipper_name is 'Workbook-facing shipper name.';

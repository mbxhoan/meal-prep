# SCHEMA_SPEC.md

## Naming
- singular hoặc plural thống nhất toàn hệ thống; ưu tiên plural tables.
- tất cả bảng nghiệp vụ có:
  - `id uuid pk`
  - `shop_id uuid not null` (trừ bảng global)
  - `created_at timestamptz`
  - `created_by uuid`
  - `updated_at timestamptz`
  - `updated_by uuid`
  - `deleted_at timestamptz nullable` khi cần soft delete

## Core tables

### Global / admin
- `shops`
- `permissions`
- `roles`
- `role_permissions`
- `user_shop_roles`

### Master
- `employees`
- `customers`
- `suppliers`
- `warehouses`
- `item_groups`
- `item_types`
- `units`
- `items`
- `menu_items`
- `menu_item_variants`
- `price_books`
- `price_book_items`
- `coupons`
- `promotion_programs`
- `payment_methods`
- `stock_adjustment_reasons`
- `shop_configs`

### Sales
- `sales_orders`
- `sales_order_items`
- `sales_order_status_logs`
- `sales_payments`
- `sales_order_promotions`

### Inventory
- `inventory_lots`
- `inventory_receipts`
- `inventory_receipt_items`
- `inventory_issues`
- `inventory_issue_items`
- `inventory_adjustments`
- `inventory_adjustment_items`
- `inventory_movements`
- `inventory_allocations` (gợi ý hoặc chốt lô cấp phát cho order item)

### Audit
- `audit_logs`

## Quan hệ gợi ý
- shop 1-n customers
- shop 1-n employees
- shop 1-n items
- shop 1-n menu_items
- menu_item 1-n menu_item_variants
- price_book 1-n price_book_items
- sales_order 1-n sales_order_items
- item 1-n inventory_lots
- inventory_receipt 1-n inventory_receipt_items
- inventory_issue 1-n inventory_issue_items
- inventory_movements tham chiếu tới reference header/line

## Materialized views / views gợi ý
- `v_stock_on_hand_by_lot`
- `v_stock_on_hand_by_item`
- `v_fefo_candidates`
- `v_sales_daily_summary`
- `v_order_profit_summary`

## Ràng buộc quan trọng
- unique `(shop_id, code)` cho nhiều bảng
- unique `(shop_id, barcode)` cho items nếu dùng barcode nội bộ
- unique `(shop_id, order_no)`
- check qty >= 0
- check sale_price >= 0
- check discount hợp lệ
- check expired_at >= manufactured_at nếu cả hai cùng có

## Chỉ mục quan trọng
- `(shop_id, created_at desc)`
- `(shop_id, status)`
- `(shop_id, customer_id)`
- `(shop_id, item_id, warehouse_id)`
- `(shop_id, lot_id)`
- `(shop_id, expired_at)` cho FEFO
- `(shop_id, order_no)`

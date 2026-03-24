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
- `coupons` và `payment_methods` để Phase sau
- `promotion_programs`
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
- `inventory_serials` (phase sau hoặc tạo sẵn schema-ready)
- `inventory_serial_allocations` (optional phase sau)

### Audit
- `audit_logs`

## Phase 0 notes
- `shops` là nguồn sự thật cho shop context.
- `roles` chỉ gồm `system_admin`, `shop_admin`, `employee`.
- `user_shop_roles.shop_id` có thể `null` cho role global như `system_admin`.
- `profiles.role` chỉ là snapshot hiển thị để giữ tương thích với policy cũ.
- `employees.user_id` phải link tới `auth.users.id`.
- `audit_logs` lưu actor, action, entity, before/after và metadata.

## Trường quan trọng nên có

### items
- `sku`
- `name`
- `barcode` nullable
- `barcode_type` nullable
- `tracking_mode` check in (`none`, `lot`, `serial`, `lot_serial`)
- `is_expirable boolean not null default true`
- `is_fefo_enabled boolean not null default true`
- `requires_unit_label boolean not null default false`
- `default_shelf_life_days integer nullable`
- `minimum_stock_qty numeric(18,3) not null default 0`
- `is_active boolean not null default true`
- `notes`

### inventory_lots
- `item_id`
- `warehouse_id`
- `lot_no`
- `lot_barcode` nullable
- `supplier_lot_no` nullable
- `manufactured_at` nullable
- `expired_at` nullable
- `received_at`
- `status`

### inventory_movements
- `movement_type`
- `item_id`
- `warehouse_id`
- `lot_id` nullable
- `serial_id` nullable for future readiness
- `qty`
- `uom_id` or snapshot unit if needed
- `reference_type`, `reference_id`, `reference_line_id`

### inventory_serials
- `item_id`
- `warehouse_id`
- `lot_id` nullable hoặc bắt buộc theo rule item
- `serial_no`
- `serial_barcode` nullable
- `status` (`in_stock`, `reserved`, `sold`, `returned`, `damaged`, `void`)
- `received_at`
- `sold_at` nullable

## Quan hệ gợi ý
- shop 1-n customers
- shop 1-n employees
- shop 1-n items
- shop 1-n menu_items
- menu_item 1-n menu_item_variants
- price_book 1-n price_book_items
- sales_order 1-n sales_order_items
- item 1-n inventory_lots
- item 1-n inventory_serials
- inventory_lot 1-n inventory_serials (khi item là lot_serial hoặc serial gắn lot)
- inventory_receipt 1-n inventory_receipt_items
- inventory_issue 1-n inventory_issue_items
- inventory_movements tham chiếu tới reference header/line
- auth user 1-1 employee profile
- auth user 1-n user_shop_roles

## Materialized views / views gợi ý
- `v_stock_on_hand_by_lot`
- `v_stock_on_hand_by_item`
- `v_fefo_candidates`
- `v_sales_daily_summary`
- `v_order_profit_summary`

## Ràng buộc quan trọng
- unique `(shop_id, code)` cho nhiều bảng
- unique `(shop_id, sku)` cho items
- unique `(shop_id, barcode)` cho items nếu dùng barcode nội bộ
- unique `(shop_id, lot_barcode)` cho inventory_lots nếu shop dùng barcode lô
- unique `(shop_id, serial_no)` cho inventory_serials
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
- `(shop_id, tracking_mode)` trên items
- `(shop_id, serial_no)` trên inventory_serials
- `(shop_id, order_no)`

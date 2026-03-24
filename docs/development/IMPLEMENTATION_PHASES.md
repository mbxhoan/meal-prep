# IMPLEMENTATION_PHASES.md

## Phase 0 — Foundation
Mục tiêu:
- chuẩn hóa docs
- chốt schema
- chốt permission codes
- tạo migration nền
- bật auth + user profile + shop context + RBAC nền

Deliverables:
- tables: shops, roles, permissions, role_permissions, user_shop_roles
- user profile / employee profile
- shop switcher (nếu cần)
- audit_logs nền

## Phase 1 — Master data
Mục tiêu:
- CRUD master data đầy đủ

Bao gồm:
- customers
- employees
- suppliers
- warehouses
- item_groups
- item_types
- units
- items
- menu_items
- menu_item_variants
- price_books
- price_book_items
- payment_methods
- coupons (basic)

## Phase 2 — Sales core
Mục tiêu:
- tạo đơn thay Google Sheet

Bao gồm:
- sales_orders
- sales_order_items
- bill page
- snapshot giá
- discount cơ bản
- shipping fee
- payment status
- order status logs

Rule bắt buộc:
- order sent/confirmed không auto nhảy giá

## Phase 3 — Inventory core
Mục tiêu:
- nhập / xuất / tồn theo lot

Bao gồm:
- inventory_lots
- inventory_receipts + items
- inventory_issues + items
- inventory_movements
- stock views
- FEFO suggestion

## Phase 4 — Sales x Inventory integration
Mục tiêu:
- order confirm -> issue flow

Bao gồm:
- mapping menu variant -> inventory item
- create draft issue from confirmed order
- FEFO allocation
- confirm issue
- stock deduction

## Phase 5 — Promotions & reports
Bao gồm:
- coupons
- promotion programs cơ bản
- report doanh thu
- report tồn kho
- near expiry report
- gross profit report theo snapshot

## Phase 6 — Advanced
- recipe/BOM
- actual cost by lot
- production output/consumption
- notifications
- barcode label printing
- bulk import/export
- multi-warehouse transfer

## Nguyên tắc triển khai
- Mỗi phase ra production được, không đợi hoàn hảo
- Không build khuyến mãi phức tạp trước khi order + stock ổn định
- Không build actual costing trước khi movement + lots chắc chắn

# RBAC.md

## Role mặc định
### 1. system_admin
Quyền cao nhất toàn hệ thống, có thể đọc / quản lý mọi shop.

### 2. shop_admin
Quản trị nghiệp vụ trong phạm vi shop được gán.

### 3. employee
Nhân viên tác nghiệp theo quyền được cấp.

## Permission code gợi ý

### System
- `system.shop.read`
- `system.shop.create`
- `system.shop.update`
- `system.shop.disable`
- `system.user.assign_role`
- `system.audit.read_all`

### Master data
- `master.customer.read`
- `master.customer.create`
- `master.customer.update`
- `master.customer.delete`

- `master.lookup.read`
- `master.lookup.create`
- `master.lookup.update`
- `master.lookup.delete`

- `master.employee.read`
- `master.employee.create`
- `master.employee.update`

- `master.item.read`
- `master.item.create`
- `master.item.update`
- `master.item.delete`

- `master.menu.read`
- `master.menu.create`
- `master.menu.update`
- `master.menu.delete`

- `master.price_book.read`
- `master.price_book.create`
- `master.price_book.update`
- `master.price_book.delete`
- `master.price_book.activate`

- `master.warehouse.read`
- `master.warehouse.create`
- `master.warehouse.update`
- `master.warehouse.delete`

- `master.supplier.read`
- `master.supplier.create`
- `master.supplier.update`
- `master.supplier.delete`

### Sales
- `sales.order.read`
- `sales.order.create`
- `sales.order.update_draft`
- `sales.order.send`
- `sales.order.confirm`
- `sales.order.cancel`
- `sales.order.refresh_price`
- `sales.order.override_price`
- `sales.discount.apply`
- `sales.discount.override`
- `sales.bill.read`
- `sales.bill.export`

### Payments
- `sales.payment.read`
- `sales.payment.record`
- `sales.payment.refund`

### Inventory
- `inventory.receipt.read`
- `inventory.receipt.create`
- `inventory.receipt.post`

- `inventory.issue.read`
- `inventory.issue.create`
- `inventory.issue.post`

- `inventory.adjustment.read`
- `inventory.adjustment.create`
- `inventory.adjustment.post`

- `inventory.stock.read`
- `inventory.stock.read_cost`
- `inventory.fefo.override`
- `inventory.expired.override`
- `inventory.negative_stock.override`

### Reports
- `report.sales.read`
- `report.sales.export`
- `report.inventory.read`
- `report.inventory.export`
- `report.audit.read`

## Role matrix tối thiểu
### system_admin
Full tất cả permission.

### shop_admin
Gần full trong phạm vi shop, trừ các `system.*`.

### employee
Có thể bắt đầu với:
- read master cần thiết
- read lookup cho item/menu/price book options
- create/update draft order
- send order
- read bill
- create goods receipt / issue nếu được cấp
- không có quyền:
  - override giá
  - activate price book
  - override FEFO
  - xem audit toàn hệ thống
  - quản lý role/permission

## Shop context / auth context
- `profiles.role` chỉ là snapshot hiển thị, không phải nguồn sự thật RBAC.
- Nguồn sự thật của quyền là `roles` + `permissions` + `role_permissions` + `user_shop_roles`.
- `user_shop_roles.shop_id = null` được dùng cho role global như `system_admin`.
- `employees.user_id` link tới `auth.users.id`, và `employees.primary_shop_id` giữ shop chính của nhân sự.

## SQL helpers cần có
- `get_user_primary_role_code()`
- `get_user_primary_shop_id()`
- `user_can_access_shop(shop_id)`
- `has_permission(permission_code)`
- `assign_user_shop_role(user_id, shop_id, role_code, is_primary)`
- `log_audit_event(...)`

## RLS nguyên tắc
- System admin bypass bằng service role hoặc claim đặc biệt.
- User thường chỉ truy cập dữ liệu cùng `shop_id`.
- Với bảng transaction, chỉ cho update trong status hợp lệ.

# AUDIT_LOGGING.md

## Mục tiêu
Mọi hành động nhạy cảm đều có lịch sử đầy đủ để:
- truy vết
- kiểm tra sai sót
- hỗ trợ đối soát
- tránh sửa ngầm

## Bảng audit_logs đề xuất
- id
- shop_id
- actor_user_id
- actor_role_snapshot
- action
- entity_name
- entity_id
- entity_code
- message
- before_json
- after_json
- metadata_json
- ip_address (nếu có)
- user_agent (nếu có)
- created_at

## Action nên chuẩn hóa
- create
- update
- delete
- send
- confirm
- cancel
- refresh_price
- override_price
- apply_coupon
- post_receipt
- post_issue
- post_adjustment
- fefo_override
- role_assign
- role_revoke
- login
- config_update

## Entity name gợi ý
- customer
- item
- menu_item_variant
- price_book
- sales_order
- sales_order_item
- inventory_receipt
- inventory_issue
- inventory_lot
- inventory_adjustment
- role
- user_shop_role
- shop_config

## Khi nào phải log before/after đầy đủ
- update
- delete/soft delete
- override giá
- override FEFO
- role/permission changes
- config changes

## Khi nào chỉ cần metadata
- create đơn giản
- send / confirm / cancel
- post receipt / issue

## Nơi bắn log
Ưu tiên ở service layer / RPC wrapper, không chỉ ở UI.
UI log không đủ tin cậy.

## Tối thiểu phải nhìn được trên màn audit
- thời gian
- người thao tác
- shop
- action
- đối tượng
- mã chứng từ / mã hàng / mã đơn
- diff trước/sau

# CODEX_PROMPTS.md

## Prompt 1 — đọc tài liệu và chốt nền
Hãy đọc lần lượt:
- AGENTS.md
- docs/development/PRODUCT_SCOPE.md
- docs/development/BUSINESS_RULES.md
- docs/development/MASTER_DATA.md
- docs/development/SCHEMA_SPEC.md
- docs/development/RBAC.md

Sau đó:
1. đề xuất file tree implementation cho source Next.js + Supabase hiện tại
2. liệt kê các migration SQL cần tạo cho Phase 0 và Phase 1
3. liệt kê các type/interface/zod schema cần có
4. không code toàn bộ một lần; chỉ tạo plan chi tiết + diff proposal

## Prompt 2 — build phase 0
Dựa trên docs hiện có, hãy implement Phase 0:
- auth context + shop context
- roles / permissions / user_shop_roles
- employee profile liên kết auth user
- audit_logs nền
- middleware / helpers kiểm permission
- migration SQL + seed quyền mặc định
- UI tối thiểu để assign role cho user

Yêu cầu:
- dùng Supabase migration
- không hardcode role logic rải rác
- thêm docs cập nhật nếu thay đổi schema

## Prompt 3 — build master data
Implement Phase 1:
- customers
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

Yêu cầu:
- CRUD page tối thiểu
- search/filter cơ bản
- permission check
- audit log create/update/delete
- code sạch, tách server action/service layer

## Prompt 4 — build sales core
Implement Phase 2:
- sales_orders
- sales_order_items
- bill page
- order status
- payment status
- snapshot giá từ price book
- shipping fee
- discount cơ bản

Business rules bắt buộc:
- order draft có thể refresh giá
- order sent/confirmed không auto nhảy giá
- bill chỉ đọc snapshot trong order

## Prompt 5 — build inventory core
Implement Phase 3:
- inventory_lots
- inventory_receipts
- inventory_receipt_items
- inventory_issues
- inventory_issue_items
- inventory_movements
- views tồn theo item / theo lot
- FEFO suggestion logic

Business rules bắt buộc:
- không sửa trực tiếp tồn
- movement là source of truth
- lot tracked + expiry + FEFO

## Prompt 6 — nối sales với inventory
Implement Phase 4:
- mapping menu variant -> inventory item
- confirm order tạo issue draft
- allocate lot theo FEFO
- cho phép FEFO override có reason + audit
- post issue trừ kho

## Prompt 7 — kiểm tra chất lượng
Hãy review code hiện tại theo docs và liệt kê:
- chỗ nào vi phạm snapshot pricing
- chỗ nào vi phạm movement ledger
- chỗ nào thiếu audit
- chỗ nào thiếu permission check
- chỗ nào cần refactor trước khi đi tiếp

## Quy tắc dùng prompt
- luôn bảo Codex đọc docs trước
- luôn yêu cầu migration + types + UI + permission + audit cùng nhau
- luôn làm theo phase nhỏ

# CODEX_PROMPTS.md

## Prompt 1 — đọc tài liệu và chốt nền
Hãy đọc lần lượt:
- AGENTS.md
- docs/development/PRODUCT_SCOPE.md
- docs/development/BUSINESS_RULES.md
- docs/development/MASTER_DATA.md
- docs/development/SCHEMA_SPEC.md
- docs/TRACKING_MODES_AND_BARCODES.md
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

## Prompt 2B — patch foundation sau Phase 0 để khóa kiến trúc tracking/barcode
Sau khi Phase 0 hiện tại hoàn tất, hãy đọc lại:
- AGENTS.md
- docs/development/BUSINESS_RULES.md
- docs/development/SCHEMA_SPEC.md
- docs/development/IMPLEMENTATION_PHASES.md
- docs/development/TRACKING_MODES_AND_BARCODES.md

Mục tiêu của prompt này là **cập nhật nền móng kiến trúc**, không phải build full inventory ngay.

Hãy thực hiện:
1. review schema/docs hiện tại và bổ sung support cho `tracking_mode` của item: `none`, `lot`, `serial`, `lot_serial`
2. đảm bảo schema spec / types / validation có chỗ cho:
   - `items.barcode`, `items.barcode_type`, `items.tracking_mode`, `items.is_expirable`, `items.is_fefo_enabled`, `items.requires_unit_label`, `items.default_shelf_life_days`
   - `inventory_lots.lot_barcode`
   - `inventory_movements.serial_id` nullable để sẵn sàng cho phase sau
   - nếu phù hợp, tạo luôn blueprint hoặc migration non-breaking cho `inventory_serials`
3. không build serial scan UI, không build full inventory flow ở prompt này
4. chỉ tạo thay đổi nào **không phá vỡ** code của Phase 0 vừa xong
5. cập nhật docs liên quan nếu tên cột / enum / table thay đổi

Yêu cầu output:
- liệt kê migration nào cần thêm
- liệt kê type/schema nào cần thêm
- implement phần foundation an toàn, tối thiểu, non-breaking
- ghi rõ phần nào defer sang Phase 3/4/6

Nguyên tắc:
- Meal Prep phase đầu vận hành bằng `lot + HSD + FEFO` là chính
- serial là kiến trúc mở sẵn, chưa ép áp dụng toàn bộ
- không hardcode giả định rằng mọi item đều serial-tracked


## Prompt 2C — build help/docs foundation cho user mới
Hãy đọc:
- AGENTS.md
- docs/development/USER_ONBOARDING_GUIDE.md
- docs/development/ROLE_BASED_OPERATIONS_SOP.md
- docs/development/DAILY_OPERATIONS_PLAYBOOK.md
- docs/development/OPERATIONAL_CHECKLISTS.md
- docs/development/TROUBLESHOOTING_AND_EXCEPTION_HANDLING.md
- docs/development/RBAC.md

Sau đó implement một khu vực `Help / SOP / Getting Started` trong app cho người dùng đã đăng nhập.
Yêu cầu:
- route và page rõ ràng
- nội dung có thể đọc từ markdown/constants, tách cấu trúc dễ bảo trì
- mọi role đã đăng nhập đều xem được
- thêm helper/empty-state ngắn ở sales và inventory để nhắc rule quan trọng
- không build chatbot hoặc tour phức tạp ở prompt này

## Prompt 4B — build guided workflows và UI guardrails
Sau khi có Sales hoặc Inventory core cơ bản, hãy đọc:
- AGENTS.md
- docs/development/BUSINESS_RULES.md
- docs/development/ORDER_PRICING_COST_RULES.md
- docs/development/INVENTORY_FEFO_RULES.md
- docs/development/USER_ONBOARDING_GUIDE.md
- docs/development/ROLE_BASED_OPERATIONS_SOP.md
- docs/development/DAILY_OPERATIONS_PLAYBOOK.md
- docs/development/OPERATIONAL_CHECKLISTS.md
- docs/development/TROUBLESHOOTING_AND_EXCEPTION_HANDLING.md

Sau đó bổ sung guardrails trong UI:
- confirm dialogs
- step hints
- helper text
- checklists trước khi post/confirm
- activity timeline nếu đã có dữ liệu log

Nguyên tắc:
- nhắc user về snapshot giá, movement ledger, FEFO, expiry rules
- không làm thay đổi business logic gốc
- implementation phải non-breaking
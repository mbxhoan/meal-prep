# Meal Prep Ops Docs Bundle

Bộ tài liệu này dùng để dẫn hướng Codex build phần mềm thay Google Sheets hiện tại.

## File nên đọc theo thứ tự
1. `PRODUCT_SCOPE.md`
2. `BUSINESS_RULES.md`
3. `ORDER_PRICING_COST_RULES.md`
4. `INVENTORY_FEFO_RULES.md`
5. `MASTER_DATA.md`
6. `SCHEMA_SPEC.md`
7. `RBAC.md`
8. `AUDIT_LOGGING.md`
9. `GOOGLE_SHEETS_MAPPING.md`
10. `IMPLEMENTATION_PHASES.md`
11. `CODEX_PROMPTS.md`

## Bối cảnh hiện tại
Google Sheets đang xử lý khá tốt:
- thực đơn / bảng giá
- khách hàng / nhân viên
- đơn hàng + chi tiết đơn
- bill thanh toán
- tính giá vốn món
- danh mục hàng / nhập kho / xuất kho / tồn lô / FEFO
- map bán hàng -> xuất kho

Phần mềm mới phải giữ được các ưu điểm đó, đồng thời giải quyết triệt để:
- snapshot giá để bill cũ không tự đổi
- quản lý tồn kho bài bản hơn
- audit lịch sử thao tác
- phân quyền rõ
- quy trình xác nhận đơn / chốt giá / xuất FEFO

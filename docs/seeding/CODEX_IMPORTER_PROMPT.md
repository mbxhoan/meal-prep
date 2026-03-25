Dùng schema `seed_import` đã có sẵn để viết migration + importer sang business schema thật.

Yêu cầu:
1. đọc `docs/seeding/IMPORT_COMPATIBILITY_REPORT.md`
2. tạo migration cho:
   - customers
   - orders
   - order_items
   - inventory_lots
   - stock_movements
   - order payments / discount snapshots / audit logs nếu chưa có
3. viết SQL importer idempotent từ:
   - seed_import.customers
   - seed_import.orders
   - seed_import.order_items
   - seed_import.inventory_master
   - seed_import.inventory_receipts
   - seed_import.sales_inventory_map
   - seed_import.auto_issue_suggestions
4. không làm mất dữ liệu lịch sử
5. giữ nguyên giá snapshot của order items, không lookup động lại từ bảng giá hiện tại
6. FEFO phải dựa trên lot + exp_date
7. report rõ các dòng mapping bán hàng → kho còn thiếu inventory_code để xử lý tay

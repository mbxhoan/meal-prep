# DB Seeded OK Checklist

Checklist này dùng để xác nhận database đã được seed đầy đủ theo source hiện tại.

## 1. Chuẩn bị
- [ ] DB local/dev đã apply đủ migrations business schema
- [ ] `seed_import` schema đã được tạo từ file seed Excel
- [ ] `docs/seeding/seed_import_business_importer.sql` đã được chạy thành công

## 2. Kiểm tra dữ liệu source
Chạy:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f docs/seeding/db_seeded_ok_check.sql
```

Pass khi:
- [ ] `seed_import.customers` > 0
- [ ] `seed_import.orders` > 0
- [ ] `seed_import.order_items` > 0
- [ ] `seed_import.inventory_master` > 0
- [ ] `seed_import.sales_inventory_map` còn `missing_inventory_code = 0`
- [ ] `seed_import.auto_issue_suggestions` còn `missing_inventory_code = 0`

## 3. Kiểm tra dữ liệu business schema
Pass khi:
- [ ] `public.customers` có dữ liệu
- [ ] `public.sales_orders` có dữ liệu
- [ ] `public.sales_order_items` có dữ liệu
- [ ] `public.inventory_items` có dữ liệu
- [ ] `public.inventory_issues` có dữ liệu nếu source có auto issue suggestions
- [ ] `public.sales_payments` có dữ liệu nếu source có paid orders

## 4. Kiểm tra tồn kho theo lô
Lưu ý:
- Nếu `seed_import.inventory_receipts = 0` thì các bảng sau có thể vẫn bằng `0` và đó là trạng thái đúng:
  - `public.inventory_receipts`
  - `public.inventory_receipt_items`
  - `public.inventory_lots`
  - `public.inventory_movements`

Nếu source có receipt nhập kho, pass khi:
- [ ] `public.inventory_receipts` > 0
- [ ] `public.inventory_receipt_items` > 0
- [ ] `public.inventory_lots` > 0
- [ ] `public.inventory_movements` > 0
- [ ] `public.stock_movements` khớp với `public.inventory_movements`

## 5. Smoke test
Chạy:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f docs/seeding/seed_import_business_importer_smoke_test.sql
```

Pass khi:
- [ ] Script kết thúc với `Importer smoke test passed`
- [ ] Không còn dòng thiếu `inventory_code`
- [ ] Không có lỗi unique key / column mismatch / missing table

## 6. Kết luận
DB được xem là “seeded OK” khi:
- dữ liệu source đã nạp xong
- importer chạy xong
- smoke test pass
- các count chính ở business schema khớp với source hiện có

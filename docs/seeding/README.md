# MealPrep seed bundle from Excel

## File chính
- `docs/seeding/mealprep_seed_full_from_excel_current_compatible.sql`

## File mô tả
- `docs/seeding/IMPORT_COMPATIBILITY_REPORT.md`
- `docs/seeding/DB_SEEDED_OK_CHECKLIST.md`
- `docs/seeding/seed_import_business_importer.sql`
- `docs/seeding/seed_import_business_importer_smoke_test.sql`
- `docs/seeding/db_seeded_ok_check.sql`

## CSV chuẩn hoá
- thư mục `docs/seeding/normalized_csv/`

## Cách dùng
1. Backup local/dev database.
2. Chạy file SQL chính.
3. Kiểm tra:
   - current schema đã được thay demo catalog/inventory bằng dữ liệu Excel
   - schema `seed_import` có full dữ liệu để import tiếp về business schema thật
4. Khi business schema đã sẵn sàng, chạy:
   - `docs/seeding/seed_import_business_importer.sql`
   - file này idempotent, có thể chạy lại an toàn để nạp sang schema thật
   - cuối script sẽ in report các dòng `sales_inventory_map` còn thiếu `inventory_code` nếu còn
5. Nếu muốn kiểm tra nhanh mà không giữ dữ liệu, chạy:
   - `docs/seeding/seed_import_business_importer_smoke_test.sql`
6. Nếu cần checklist nhanh sau khi import, chạy:
   - `docs/seeding/db_seeded_ok_check.sql`
   - hoặc mở `docs/seeding/DB_SEEDED_OK_CHECKLIST.md`

## Lưu ý
- Bundle này ưu tiên **tương thích + không mất dữ liệu**
- Các phần current app chưa có table đích sẽ được giữ nguyên trong `seed_import`

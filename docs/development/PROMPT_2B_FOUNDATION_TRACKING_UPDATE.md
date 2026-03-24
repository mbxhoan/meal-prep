# PROMPT_2B_FOUNDATION_TRACKING_UPDATE.md

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

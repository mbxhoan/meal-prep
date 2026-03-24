# TRACKING_MODES_AND_BARCODES.md

## Mục tiêu
Thiết kế hệ thống theo hướng **hỗ trợ barcode + lot + serial ngay từ nền móng**, nhưng không ép vận hành serial cho toàn bộ sản phẩm trong phase đầu.

## Kết luận nghiệp vụ
Với Meal Prep / thực phẩm, chuẩn vận hành khuyến nghị là:
- **item barcode** cho mã hàng / SKU
- **lot barcode** cho lô hàng / lô thành phẩm / lô nguyên liệu
- **FEFO theo lot + HSD** là cơ chế mặc định
- **serial per unit** chỉ bật cho nhóm hàng thật sự cần truy vết tới từng đơn vị

## Tracking mode cho item
Mỗi item phải có `tracking_mode`:
- `none`: không theo dõi lot/serial
- `lot`: theo dõi theo lô
- `serial`: theo dõi theo serial từng đơn vị
- `lot_serial`: vừa theo dõi lô vừa theo dõi serial

Khuyến nghị mặc định:
- Nguyên liệu: `lot`
- Gia vị: `lot`
- Thành phẩm Meal Prep: `lot`
- Bao bì: `none` hoặc `lot` tùy shop
- Tài sản/thiết bị đặc biệt: `serial`

## Barcode layers
Hệ thống nên hỗ trợ 3 lớp barcode:

### 1. Item barcode
Barcode ở cấp item master.
Ví dụ:
- `TP001`
- `GV001`
- `NL001`

Dùng cho:
- tìm hàng nhanh
- in tem mã hàng
- mapping scanner cơ bản

### 2. Lot barcode
Barcode ở cấp lô.
Ví dụ:
- `LOT-TP001-20260325-A`
- `LOT-NL014-20260324-02`

Dùng cho:
- nhập kho theo lô
- xuất kho theo FEFO
- truy vết lô lỗi / recall

### 3. Serial barcode
Barcode ở cấp từng đơn vị.
Ví dụ:
- `SR-TP001-20260325-0001`
- `SR-TP001-20260325-0002`

Dùng cho:
- scan từng hộp / từng đơn vị
- truy vết chính xác đơn vị nào đã bán cho đơn nào
- đổi trả / recall mức chi tiết

## Thiết kế triển khai theo phase

### Phase gần
Bắt buộc hỗ trợ ở kiến trúc:
- `tracking_mode` trên item
- `item barcode`
- `lot barcode`
- FEFO theo lot
- stock movement có thể tham chiếu lot

Triển khai hiện tại giữ compatibility với schema cũ, nên foundation này được mở rộng non-breaking trước; serial scan UI, serial allocation và auto-issue sẽ đi ở phase sau.

### Phase sau
Có thể bật thêm:
- `inventory_serials`
- scan serial khi xuất bán
- gắn serial allocation vào sales order item
- in tem serial từng hộp

## Rule nghiệp vụ
1. Item có `tracking_mode = lot`:
   - receipt / issue / adjustment phải chỉ rõ `lot_id`
2. Item có `tracking_mode = serial`:
   - movement nên gắn `serial_id`
   - qty logic thường theo từng đơn vị
3. Item có `tracking_mode = lot_serial`:
   - serial phải thuộc một lot
4. FEFO chỉ áp dụng trên item expirable và lot-tracked / lot_serial
5. Không cho bypass FEFO mà không ghi lý do và audit log

## Dữ liệu master nên có ở item
Đề xuất các field:
- `sku`
- `barcode`
- `barcode_type` (optional: code128, qr, ean13...)
- `tracking_mode`
- `is_expirable`
- `is_fefo_enabled`
- `requires_unit_label`
- `default_shelf_life_days` (optional)

## Dữ liệu transaction nên có ở lot
- `lot_no`
- `lot_barcode`
- `supplier_lot_no`
- `manufactured_at`
- `expired_at`
- `received_at`
- `status`

## Dữ liệu transaction nên có ở serial
- `serial_no`
- `serial_barcode`
- `lot_id`
- `status`
- `sold_at`
- `returned_at`

## Reporting / traceability
Về sau hệ thống phải có thể trả lời:
- mặt hàng nào đang theo dõi lot hay serial?
- lô nào còn tồn và hết hạn khi nào?
- serial nào đã bán cho đơn nào?
- đơn hàng nào đã nhận hàng từ lô nào / serial nào?

## Khuyến nghị vận hành thực tế
- Phase đầu không bắt nhân viên scan serial cho toàn bộ Meal Prep.
- Phase đầu nên vận hành bằng `lot + HSD + FEFO`.
- Kiến trúc vẫn phải mở sẵn để không phải đập schema khi sau này bật serial.

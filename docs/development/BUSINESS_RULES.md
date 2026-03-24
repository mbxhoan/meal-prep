# BUSINESS_RULES.md

## 1. Tư duy dữ liệu
Hệ thống có 3 lớp dữ liệu:
1. **Master data hiện hành**
2. **Transaction data**
3. **Snapshot lịch sử**

Master data có thể thay đổi theo thời gian.
Transaction lịch sử không được đổi ngầm theo master data.

## 2. Shop / tenant
- Mỗi record nghiệp vụ thuộc về một `shop_id`.
- System admin có thể xem nhiều shop.
- Shop admin / employee chỉ thấy dữ liệu trong shop của mình.
- Mặc định thiết kế multi-tenant từ đầu.

## 3. Order lifecycle
Đề xuất status:
- `draft`
- `sent`
- `confirmed`
- `preparing`
- `ready`
- `delivered`
- `completed`
- `cancelled`

Rule:
- `draft`: được refresh giá từ bảng giá.
- `sent`: không auto refresh giá nữa.
- `confirmed`: khóa giá, khóa snapshot chính.
- `completed`: khóa chỉnh sửa nghiệp vụ.
- `cancelled`: không xóa vật lý.

## 4. Payment lifecycle
- `unpaid`
- `partial`
- `paid`
- `refunded`
- `void`

## 5. Pricing lifecycle
- Bảng giá hiện hành dùng cho đơn mới.
- Order item phải lưu snapshot:
  - tên món
  - trọng lượng
  - đơn giá
  - giá vốn chuẩn
  - discount
  - tổng tiền dòng
- Bill đã gửi hoặc đơn đã confirmed không auto cập nhật giá.
- Nếu muốn áp giá mới cho order draft, dùng action chủ động `refresh_price_from_current_price_book`.

## 6. Promotions
- Mã giảm giá / coupon có thể theo:
  - fixed amount
  - percentage
  - free ship
- Có điều kiện:
  - min order amount
  - valid date range
  - usage limit
  - active status
- Promotion áp vào order header hoặc line item tùy loại.
- Phải lưu snapshot discount trên order.

## 7. Inventory
- Không sửa số tồn trực tiếp.
- Tất cả tồn phát sinh từ:
  - receipt
  - issue
  - adjustment_in
  - adjustment_out
  - production_output
  - production_consumption
  - return_in
  - return_out
- Nếu item quản lý theo lot:
  - movement phải chỉ rõ lot
- Nếu item áp dụng FEFO:
  - hệ thống gợi ý lot theo expiry date sớm nhất còn tồn > 0
  - override FEFO phải ghi reason

## 7A. Tracking mode / barcode
- Mỗi item phải có `tracking_mode`: `none`, `lot`, `serial`, `lot_serial`.
- Mỗi item có thể có `barcode` ở cấp item master.
- Mỗi lot có thể có `lot_barcode`.
- Với item `serial` hoặc `lot_serial`, hệ thống có thể tạo `serial_no` / `serial_barcode` cho từng đơn vị.
- Phase đầu không bắt buộc scan serial cho toàn bộ Meal Prep; lot là mặc định.

## 8. Expiry / FEFO
- FEFO áp dụng theo `expired_at` tăng dần trên các item có `tracking_mode` là `lot` hoặc `lot_serial`.
- Lot hết hạn không được gợi ý xuất thường.
- Có quyền đặc biệt mới được xuất lô hết hạn hoặc bypass FEFO.
- Hệ thống phải có cảnh báo:
  - expired
  - near_expiry (<= cấu hình, ví dụ 3 ngày)
  - expiring_soon (<= cấu hình, ví dụ 7 ngày)

## 9. Costing
Phase 1:
- dùng **standard cost snapshot** tại thời điểm tạo order item hoặc lúc confirm order.

Phase 2+:
- có thể bổ sung **actual cost by lot movement** để báo cáo lợi nhuận chính xác hơn.

## 9A. Serial readiness
- Kiến trúc phải cho phép sau này gắn serial vào sales order item / stock movement.
- Nếu bật serial cho một item, không được đánh dấu serial là `sold` nếu chưa có movement hoặc allocation hợp lệ.
- Serial có thể gắn với lot để vừa truy vết FEFO vừa truy vết từng đơn vị.

## 10. Audit bắt buộc
Các action phải log:
- create/update/delete item
- create/update/send/confirm/cancel order
- refresh price
- apply coupon
- create goods receipt
- create goods issue
- FEFO override
- lot allocation override
- serial assignment / serial status change
- stock adjustment
- role/permission changes
- user/shop config changes

## 11. Deletion policy
- Không hard delete với transaction tables.
- Master data chỉ soft delete nếu đã được dùng.
- Dùng `is_active`, `deleted_at`, `archived_at` khi hợp lý.

## 12. Id generation
Mã hiển thị:
- order_no: `SO-YYYYMM-0001`
- goods_receipt_no: `GR-YYYYMM-0001`
- goods_issue_no: `GI-YYYYMM-0001`
- lot_no: có thể user nhập hoặc auto sinh
- item_code/sku: theo rule shop

DB vẫn dùng UUID làm khóa chính.

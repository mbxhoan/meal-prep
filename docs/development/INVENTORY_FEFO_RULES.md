# INVENTORY_FEFO_RULES.md

## Mục tiêu
Quản lý tồn kho cho:
- nguyên liệu
- gia vị
- thành phẩm
- bao bì

Có:
- nhập kho
- xuất kho
- tồn theo lô
- NSX / HSD
- FEFO
- log lịch sử

## Khái niệm chính
### Item
SKU tồn kho.

### Lot
Một lô hàng cụ thể của item.
Field chính:
- lot_no
- manufactured_at
- expired_at
- supplier_id
- warehouse_id
- received_at

### Stock movement
Mỗi lần tăng/giảm tồn.

## Table logic gợi ý
### inventory_receipts
Header phiếu nhập

### inventory_receipt_items
Dòng nhập
- item_id
- lot_id hoặc thông tin lot để sinh lot mới
- qty_received
- unit_cost
- received_at

### inventory_issues
Header phiếu xuất

### inventory_issue_items
Dòng xuất
- item_id
- lot_id
- qty_issued
- issued_at
- reason_code

### inventory_lots
Thông tin lô

### inventory_movements
Sổ cái kho, unified ledger
- movement_type
- item_id
- lot_id
- warehouse_id
- qty_in
- qty_out
- unit_cost_snapshot
- reference_type
- reference_id
- reference_line_id

## Rule FEFO
Áp dụng cho item có:
- `tracking_mode` là `lot` hoặc `lot_serial`
- `is_expirable = true`
- `is_fefo_enabled = true`

Thuật toán gợi ý:
1. lấy các lot còn tồn > 0
2. loại trừ lot expired nếu config không cho phép
3. sort theo `expired_at` ASC, `received_at` ASC, `created_at` ASC
4. cấp phát từ lot sớm nhất

## Override FEFO
Cho phép chỉ khi user có permission.
Bắt buộc lưu:
- chosen_lot_id
- suggested_lot_id
- override_reason
- actor_user_id
- timestamp

## Negative stock
Mặc định: không cho.
Chỉ system/shop admin có thể override nếu shop config cho phép.

## Cảnh báo kho
### Tồn thấp
Nếu on hand < minimum_stock_qty

### Cận HSD
Nếu expired_at - today <= near_expiry_days

### Sắp tới hạn
Nếu expired_at - today <= expiring_soon_days

### Hết hạn
Nếu expired_at < today

## Thành phẩm bán dần
Case meal prep:
- thành phẩm nấu ra có thể nhập kho thành 1 hoặc nhiều lot
- bán ra xem như goods issue từ lot thành phẩm
- nếu 1 món bán có các size 100/150/200g:
  - có thể map mỗi size vào 1 inventory item riêng
  - hoặc 1 item + unit conversion, nhưng phase đầu nên dùng item riêng cho đơn giản

## Bán hàng nối kho
Có 2 phase:
### Phase 1
- order confirm -> tạo yêu cầu xuất
- user kiểm tra lot FEFO rồi post issue

### Phase 2
- order confirm -> hệ thống auto allocate FEFO + tạo issue nháp
- user chỉ confirm

## Điều chỉnh kho
Các case:
- kiểm kê tăng
- kiểm kê giảm
- hỏng
- hết hạn
- sử dụng nội bộ
- trả hàng

Phải luôn có reason + note + actor.

## Không dùng
- Không tính tồn bằng cách lấy cột nhập trừ cột xuất trong UI.
- Tồn phải đọc từ movement/ledger hoặc materialized view chuẩn.

# GOOGLE_SHEETS_MAPPING.md

## Sheet hiện tại -> phần mềm mới

### 1. `Khach_hang`
Hiện tại:
- tên KH
- SĐT
- địa chỉ
- ghi chú

DB mới:
- `customers`

### 2. `Nhân_viên`
DB mới:
- `employees`
- liên kết user auth nếu nhân viên đăng nhập hệ thống

### 3. `Thuc_don`
Hiện tại là master món + giá/cost theo size.
DB mới tách:
- `menu_items`
- `menu_item_variants`

### 4. `Bang_gia`
Hiện tại là key bán hàng + giá.
DB mới:
- `price_books`
- `price_book_items`

### 5. `Don_hang`
Hiện tại:
- mã đơn
- ngày
- khách hàng
- nhân viên
- phí ship
- tổng tiền
- giảm giá

DB mới:
- `sales_orders`

### 6. `Chi_tiet_don_hang`
Hiện tại:
- món
- trọng lượng
- số lượng
- đơn giá
- thành tiền
- giá vốn

DB mới:
- `sales_order_items`
- phải lưu snapshot

### 7. `BILL`
DB mới:
- không cần bảng riêng
- render từ `sales_orders` + `sales_order_items`

### 8. `Tính_giá_vốn_món_chính` / `Danh_sách_gia_vị`
DB mới:
- phase 1 có thể chưa số hóa hết công thức chi tiết
- chỉ cần nhập `standard_cost` vào price book
- phase sau mới thêm module recipe/BOM/costing calculator

### 9. `Danh_muc_hang`
DB mới:
- `items`

### 10. `Nhap_kho`
DB mới:
- `inventory_receipts`
- `inventory_receipt_items`
- `inventory_lots`
- `inventory_movements`

### 11. `Xuat_kho`
DB mới:
- `inventory_issues`
- `inventory_issue_items`
- `inventory_movements`

### 12. `Ton_lo_FEFO`
DB mới:
- không nhập tay
- tính từ view/materialized view:
  - `v_stock_on_hand_by_lot`
  - `v_fefo_candidates`

### 13. `Tong_hop_kho`
DB mới:
- view/report tổng hợp tồn

### 14. `Map_ban_hang_kho`
DB mới:
- `menu_item_variants.linked_inventory_item_id`
- hoặc bảng `sales_inventory_mappings` nếu cần linh hoạt hơn

## Data migration note
- migrate customer, employee, item, menu, price, order, order item
- migrate transaction lịch sử quan trọng nếu cần đối soát
- bill sheet chỉ là derived view, không cần migrate trực tiếp

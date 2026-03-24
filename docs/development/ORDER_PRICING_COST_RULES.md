# ORDER_PRICING_COST_RULES.md

## Mục tiêu
Giải quyết triệt để vấn đề đã gặp ở Google Sheets:
1. giá nguyên liệu đổi không làm bill cũ đổi
2. giá menu đổi không làm order cũ đổi
3. bill đã gửi khách phải ổn định
4. vẫn cho phép đơn mới dùng giá mới

## Mô hình đúng
### Bảng giá hiện hành
- `price_books`
- `price_book_items`

### Snapshot trong order
- `sales_orders`
- `sales_order_items`

`sales_order_items` phải lưu snapshot:
- menu_item_variant_id
- item_name_snapshot
- weight_label_snapshot
- weight_grams_snapshot
- unit_price_snapshot
- standard_cost_snapshot
- quantity
- line_discount_type
- line_discount_value
- line_total_before_discount
- line_total_after_discount
- line_cost_total
- line_profit_total

## Rule giá
### 1. Khi tạo order draft
- load giá từ price book mặc định của shop
- fill snapshot vào order item

### 2. Khi chỉnh sửa order draft
- cho phép:
  - refresh từ giá hiện hành
  - override giá thủ công nếu user có quyền

### 3. Khi order status >= sent
- không tự refresh giá
- không join động vào bảng giá để hiển thị bill

### 4. Khi order confirmed
- khóa snapshot chính
- chỉ sửa bằng flow đặc biệt có audit

## Rule cost
### Standard cost
- cost chuẩn lấy từ `price_book_items.standard_cost`
- snapshot vào `sales_order_items.standard_cost_snapshot`

### Actual cost
- phase sau có thể tính từ stock movement/lot allocation
- không cần chặn phase 1

## Rule shipping / coupon / promo
Ở `sales_orders` lưu:
- subtotal_before_discount
- order_discount_type
- order_discount_value
- order_discount_amount
- shipping_fee
- total_amount
- coupon_code_snapshot
- promotion_snapshot_json

## Rule thay đổi giá nguyên liệu đầu vào
Nếu nguyên liệu tăng giá:
- cập nhật cost chuẩn cho menu variant ở phiên bản giá mới
- **không** update order đã có
- order mới dùng cost mới
- báo cáo historical dùng snapshot cũ

## Rule thay đổi giá menu
Nếu giá bán món đổi:
- tạo/update price book item mới
- order draft có thể refresh nếu chủ động
- order sent/confirmed/completed giữ nguyên snapshot

## Versioning giá
Khuyến nghị:
- mỗi lần đổi giá diện rộng, tạo `price_book` mới
- không sửa phá dữ liệu cũ nếu cần truy vết

## Quyền nhạy cảm về giá
Tách permission:
- `sales.price.read`
- `sales.price.override`
- `sales.discount.apply`
- `sales.discount.override`
- `sales.order.refresh_price`
- `sales.order.confirm`

## Bill
BILL view chỉ đọc từ:
- `sales_orders`
- `sales_order_items`
tuyệt đối không lookup động từ bảng giá.

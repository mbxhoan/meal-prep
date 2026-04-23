# 03 - Import Flow

## 1. Mục tiêu
Nạp dữ liệu master data đầu kỳ bằng Excel để không phải nhập thủ công.

## 2. File được hỗ trợ
- `.xlsx`

## 3. Sheet bắt buộc/hỗ trợ
- product_categories
- products
- product_variants
- combos
- combo_items
- customers
- employees

## 4. Thứ tự import
1. product_categories
2. products
3. product_variants
4. combos
5. combo_items
6. customers
7. employees

## 5. Logic xử lý
### product_categories
Upsert theo `category_code`

### products
Upsert theo `product_code`
Resolve `category_code -> category_id`

### product_variants
Ưu tiên map theo `variant_code`
Nếu thiếu `variant_code`, hệ thống tự generate từ:
- `product_code`
- `weight_value`
- `weight_unit`

### combos
Upsert theo `combo_code`

### combo_items
Resolve:
- `combo_code`
- `variant_code`
hoặc fallback:
- `product_code`
- `weight_label`

### customers
Upsert theo `customer_code`
Nếu thiếu code, cho phép generate `CUS-AUTO-xxxx`

### employees
Upsert theo `employee_code`
Nếu thiếu code, cho phép generate `EMP-AUTO-xxxx`

## 6. Validate bắt buộc
- sheet name hợp lệ
- code không rỗng ở master chính
- số tiền phải là number >= 0
- trọng lượng phải là number > 0 nếu có
- combo item qty > 0
- không cho combo item trỏ tới variant không tồn tại

## 7. Kết quả trả về
- số dòng đọc được
- số dòng upsert thành công
- số lỗi
- chi tiết lỗi theo sheet + row

## 8. Chính sách import
- import master data là **upsert**
- không xoá record cũ nếu không có trong file
- không auto deactivate record cũ

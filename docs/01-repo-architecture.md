# 01 - Repo Architecture

## 1. Mục tiêu
Repo này được tối ưu cho app nội bộ quản lý bán hàng MealFit theo cấu trúc nhỏ gọn nhưng đủ chắc để mở rộng.

## 2. Kiến trúc lớp
- **UI layer**: `app/` + `components/`
- **business/data layer**: `lib/repository/`
- **import layer**: `lib/import/`
- **database layer**: `supabase/migrations/`
- **operational docs**: `docs/`

## 3. Domain model
### Master data
- product_categories
- products
- product_variants
- combos
- combo_items
- customers
- employees

### Transaction data
- sales_orders
- sales_order_items
- payments

## 4. Vì sao tách `products` và `product_variants`
Vì cùng 1 món có nhiều mức trọng lượng, và mỗi mức trọng lượng có:
- giá vốn khác nhau
- giá bán khác nhau

Do đó, đối tượng bán thực tế là `product_variant`.

## 5. Vì sao combo luôn trỏ về variant
Vì combo cần biết chính xác:
- món nào
- trọng lượng nào
- giá vốn nào

Nếu chỉ trỏ về `products`, hệ thống sẽ không biết 100g hay 150g.

## 6. Demo fallback
Nếu chưa có Supabase env, app sẽ lấy dữ liệu từ `lib/demo-data.ts`.
Mục đích:
- mở repo là xem được UI
- dễ demo nhanh
- không chặn tiến độ giao diện

## 7. Live data mode
Khi đã có env + DB:
- repo functions trong `lib/repository` sẽ đọc dữ liệu thật
- import route sẽ upsert dữ liệu thật
- CLI import sẽ đẩy file lên DB thật

## 8. Các route chính
- `/`
- `/products`
- `/combos`
- `/customers`
- `/employees`
- `/orders`
- `/orders/new`
- `/imports/master-data`

## 9. Nguyên tắc đặt mã
- category_code: `CAT-CHICKEN`
- product_code: `PRD-UCG-CJ`
- variant_code: `VAR-UCG-CJ-100G`
- combo_code: `COM-KEEPFIT`
- customer_code: `CUS-0001`
- employee_code: `EMP-0001`

## 10. Rule dữ liệu quan trọng
- code là khoá nghiệp vụ hiển thị
- id là khoá kỹ thuật
- đơn hàng phải lưu snapshot tên và giá
- bill đọc từ order, không nhập tay

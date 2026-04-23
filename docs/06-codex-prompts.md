# 06 - Codex Prompts

## Prompt 1 — build CRUD products
Hãy triển khai module products hoàn chỉnh cho repo này:
- không thay đổi business model
- giữ products là món cha
- giữ product_variants là món bán thật
- thêm form create/edit product
- thêm form create/edit variant theo product
- dùng route app router
- không thêm thư viện UI mới
- cập nhật docs nếu thay schema

## Prompt 2 — build CRUD combos
Hãy triển khai module combos:
- combo gồm nhiều combo_items
- combo_items phải chọn từ product_variants
- tính tổng giá vốn combo ở server
- giá bán combo nhập tay
- hiển thị lãi gộp
- không phá import flow hiện có

## Prompt 3 — build order form
Hãy triển khai form tạo đơn hàng:
- đầu đơn gồm customer, employee, ship fee, discount, note
- dòng hàng gồm line_type = product_variant hoặc combo
- tự tính subtotal, discount_amount, total_amount, balance_due
- lưu snapshot name/price
- có validate server side

## Prompt 4 — harden import route
Hãy cải tiến import route:
- thêm duplicate detection trong cùng file
- thêm dry-run mode
- thêm download error report csv
- không đổi cấu trúc output đang có nếu không cần

## Prompt 5 — build auth
Hãy thêm auth internal app:
- Supabase auth email/password
- middleware bảo vệ route nội bộ
- vai trò admin / operator / viewer
- không dùng auth helpers cũ
- chỉ dùng @supabase/ssr

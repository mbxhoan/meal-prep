# AGENTS.md

## Mục tiêu repo
Xây dựng phần mềm nội bộ MealFit thay thế file Excel hiện tại cho phạm vi:
- món hàng
- biến thể món theo trọng lượng
- combo
- khách hàng
- nhân viên
- đơn hàng
- bill
- import Excel master data

## Nguyên tắc code
1. Không phá cấu trúc nghiệp vụ đã chốt trong `docs/`.
2. Ưu tiên đơn giản, rõ ràng, đọc được.
3. Không thêm thư viện UI nặng nếu không thực sự cần.
4. Mọi thay đổi schema phải cập nhật đồng thời:
   - `supabase/migrations`
   - `docs/01-repo-architecture.md`
   - `docs/04-api-contracts.md`
5. Không hardcode dữ liệu sản phẩm/khách hàng trong component nghiệp vụ. Demo data chỉ nằm trong `lib/demo-data.ts`.
6. Import Excel phải luôn giữ thứ tự import và rule validate trong `lib/import`.
7. Không đổi tên sheet import nếu chưa cập nhật cả:
   - docs
   - UI import
   - CLI import
   - validator

## Quy ước nghiệp vụ quan trọng
- `products` là món cha
- `product_variants` là món bán thực tế theo trọng lượng
- `combos` là sản phẩm bán dạng gộp
- `combo_items` luôn tham chiếu về `product_variants`
- `sales_order_items.line_type` chỉ nhận:
  - `product_variant`
  - `combo`
- đơn hàng phải lưu snapshot giá tại thời điểm bán

## Trình tự làm việc khi thêm tính năng
1. Cập nhật tài liệu nghiệp vụ nếu cần
2. Cập nhật schema
3. Cập nhật repository/service layer
4. Cập nhật UI
5. Cập nhật import nếu liên quan
6. Tự rà lại build path, empty state, error state

## Chuẩn output khi agent/codex code
- Ưu tiên patch nhỏ, không sửa tràn lan
- Tạo file mới phải đúng folder
- Thêm màn hình mới phải có link từ sidebar nếu là module chính
- Nếu thêm cột DB, phải thêm:
  - migration
  - type/interface
  - form field nếu cần
  - filter/search nếu ảnh hưởng danh sách
- Không để TODO mơ hồ

## Checklist bắt buộc trước khi kết thúc
- không có import thừa rõ ràng
- không có route chết
- không có field name lệch giữa UI và SQL
- import Excel vẫn chạy đúng thứ tự
- fallback demo data không bị vỡ

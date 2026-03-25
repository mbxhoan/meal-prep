# AGENTS.md — Meal Prep Ops Platform

## Mục tiêu
Build phần mềm vận hành thay Google Sheets cho mô hình Meal Prep, chạy trên **Next.js + Supabase**, có:
- bán hàng / tạo đơn / bill
- quản lý giá bán và giá vốn
- khuyến mãi / mã giảm giá
- quản lý tồn kho theo **lô + HSD + FEFO**
- kiến trúc hỗ trợ **barcode hàng + barcode lô + serial barcode**
- nhập kho / xuất kho / điều chỉnh kho
- audit log toàn hệ thống
- RBAC rõ ràng cho system admin / shop admin / employee

## Nguồn sự thật nghiệp vụ
Khi có xung đột giữa source code cũ và tài liệu này:
1. `docs/BUSINESS_RULES.md`
2. `docs/ORDER_PRICING_COST_RULES.md`
3. `docs/INVENTORY_FEFO_RULES.md`
4. `docs/TRACKING_MODES_AND_BARCODES.md`
5. `docs/SCHEMA_SPEC.md`
6. `docs/RBAC.md`

## Nguyên tắc bất biến
1. **Không để dữ liệu lịch sử tự nhảy theo master hiện tại**.
   - Giá món trong đơn phải là snapshot tại thời điểm tạo đơn.
   - Giá vốn chuẩn trong đơn phải là snapshot tại thời điểm tạo đơn.
   - Bill đã gửi/chốt không được tự đổi giá.
2. **Mọi chuyển động kho phải đi qua stock movement**.
   - Không cập nhật số tồn trực tiếp.
   - Tồn hiện tại = tổng nhập / sản xuất vào - tổng xuất / hao hụt / điều chỉnh.
3. **FEFO là rule mặc định cho hàng có HSD**.
   - Xuất kho thành phẩm / nguyên liệu có HSD phải ưu tiên lô gần hết hạn nhất còn tồn.
4. **Thiết kế item tracking mode ngay từ đầu**.
   - Mỗi item phải hỗ trợ `none` / `lot` / `serial` / `lot_serial`.
   - Phase đầu có thể chỉ vận hành bằng `lot`, nhưng schema phải mở sẵn cho `serial`.
5. **Mọi thao tác quan trọng phải có audit log**.
   - create / update / delete / approve / confirm / cancel / price override / stock override.
6. **Dùng migration có version**.
   - Không sửa tay DB production.
   - Tất cả thay đổi schema phải đi qua SQL migration.
7. **Ưu tiên soft delete / status hơn hard delete**.
8. **Không dùng lookup động để render số tiền lịch sử**.
   - Order item phải lưu snapshot.

## Kiến trúc mong muốn
- Frontend: Next.js App Router
- Backend DB/Auth: Supabase PostgreSQL + Supabase Auth
- RLS theo shop/tenant
- RPC / SQL function cho FEFO allocation, posting stock movement, order confirm
- Chuẩn bị chỗ cho lot allocation và serial allocation trong các phase sau
- UI desktop-first nhưng responsive cho tablet/mobile
- Tách module:
  - master data
  - sales
  - pricing & promotions
  - inventory
  - reports
  - administration / audit

## Coding rules cho Codex
- Sinh code theo từng phase nhỏ, chạy được, không cố làm tất cả một lần.
- Mỗi lần code xong, ghi thêm hướng dẫn next step để rà soát, double check hoặc review lại những gì đã thay đổi thực tế.
- Mỗi phase phải có:
  - migration SQL
  - type definitions
  - repository/service layer
  - page / form / table tối thiểu
  - validation schema
- Không hardcode text business rule trong UI; đưa vào constants hoặc docs.
- Không hardcode role check rải rác; tập trung permission codes.
- Với money:
  - lưu integer minor unit hoặc numeric(18,2); thống nhất một cách toàn hệ thống.
- Với quantity:
  - dùng numeric đủ lớn, tránh float.
- Với datetime:
  - lưu UTC.
- Với audit:
  - luôn lưu actor_user_id, shop_id, action, entity, entity_id, before_json, after_json.
- Với price:
  - luôn tách master price và order snapshot.

## Không được làm
- Không trừ tồn bằng cách cập nhật một cột `stock_on_hand` trực tiếp mà không có movement.
- Không để order item join động vào bảng giá để render bill.
- Không cho edit order đã confirmed mà không lưu lịch sử.
- Không cho delete lot đã có movement.
- Không cho bypass FEFO mà không ghi reason.

## Definition of done
Một phase được xem là xong khi:
- migration chạy được
- UI CRUD cơ bản hoạt động
- RLS/permission áp dụng được
- audit log có dữ liệu
- test manual flow chính chạy qua được
- docs liên quan đã cập nhật

## Nguyên tắc UX vận hành
- Hệ thống phải đủ rõ để user mới có thể học và thao tác an toàn.
- Business rule quan trọng phải xuất hiện trong UI qua helper text, empty state, confirm dialog hoặc checklist, không chỉ nằm trong docs dev.
- Các flow rủi ro cao phải có guardrail: pricing snapshot, FEFO override, stock adjustment, expiry-required receipt.
- Ưu tiên thiết kế màn hình có hướng dẫn ngắn ngay tại chỗ hơn là bắt user đọc tài liệu dài rồi tự nhớ.
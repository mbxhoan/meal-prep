# MealPrep Excel → Current App Seed compatibility report

## Kết luận
Tôi đã tách dữ liệu thành 2 lớp:

1. **Current-schema compatible seed**  
   Seed trực tiếp vào các bảng hiện có trong file seed hiện tại:
   - `public.categories`
   - `public.products`
   - `public.product_variants`
   - `public.inventory_items`

2. **Full business staging import**  
   Giữ nguyên toàn bộ dữ liệu còn lại trong schema `seed_import` để không mất dữ liệu:
   - customers
   - staff_members
   - menu_products / menu_variants
   - inventory_master / inventory_receipts
   - orders / order_items
   - sales_inventory_map
   - auto_issue_suggestions
   - spice_master
   - raw_sheet_cells

## Vì sao phải tách 2 lớp
File seed SQL hiện tại **chưa có** bảng đích cho các mảng vận hành sau:
- customers
- orders
- order_items
- inventory_lots / lot balances
- stock movements / sale issues
- discount codes / promotions
- audit logs

Vì vậy, nếu seed “thẳng” toàn bộ vào app hiện tại thì sẽ **không thể vừa tương thích vừa đầy đủ**.  
Giải pháp an toàn nhất là:
- seed thẳng phần schema đã có
- stage 100% phần còn lại trong `seed_import` để Codex/importer dùng tiếp khi migration business schema hoàn tất

## Số lượng dữ liệu đã đọc từ Excel
- Khách hàng: **19**
- Nhân sự được nhắc tới: **4**
- Món bán: **18**
- Biến thể món: **54**
- Mặt hàng kho: **39**
- Phiếu nhập/lô: **0**
- Đơn hàng thực tế: **19**
- Chi tiết đơn: **99**
- Mapping bán hàng → kho: **54**
- Gợi ý xuất tự động từ đơn: **99**
- Master gia vị/nguyên liệu: **25**
- Cell raw của 2 sheet cost/recipe: **1697**

## Những chỗ tôi phải xử lý cẩn trọng
### 1. Giá vốn biến thể
`public.product_variants` hiện **không có cột cost snapshot trực tiếp**.  
Để không làm mất cost từ Excel, tôi map:
- `packaging_cost = 0`
- `labor_cost = 0`
- `overhead_cost = cost_snapshot`

Cách này giữ được **tổng cost** ở current schema, dù tên cột chưa thật lý tưởng.

### 2. Recipe components
Workbook recipe/cost hiện nằm trong layout bán-cấu-trúc (`Danh_sách_gia_vị`, `Tính_giá_vốn_món_chính`).  
Tôi **không tự bịa** `public.recipe_components` vì như vậy dễ sai.  
Thay vào đó:
- xoá demo recipe cũ khỏi current seed
- lưu **toàn bộ sheet raw** vào `seed_import.raw_sheet_cells`

### 3. Tồn kho hiện tại
Workbook hiện chỉ có **1 phiếu nhập kho thực tế** nhưng lại có lịch sử bán hàng lớn.  
Điều đó có nghĩa:
- không thể suy ra tồn kho on-hand lịch sử một cách đáng tin tuyệt đối
- current seed chỉ lấy `public.inventory_items.current_quantity` từ **phiếu nhập đã ghi nhận rõ ràng**
- không tự trừ hàng theo các gợi ý auto issue chưa được post lô

### 4. Mapping bán hàng → kho
6 dòng salmon trước đây thiếu `inventory_code` đã được map về `TP014` (`Cá hồi ??`):
- Cá hồi cajun | 100g
- Cá hồi cajun | 150g
- Cá hồi cajun | 200g
- Cá hồi kiểu âu | 100g
- Cá hồi kiểu âu | 150g
- Cá hồi kiểu âu | 200g

`seed_import.auto_issue_suggestions` cũng đã được đồng bộ cho dòng salmon còn lại:
- `AUTO-0074 | DH0016 | Cá hồi kiểu âu | 200g`

### 5. Inventory master rescue items
Đã bổ sung 3 item thành phẩm rescue để phủ nốt các mapping còn thiếu:
- `TP015 | Nạ̣c heo tây bắc`
- `TP016 | Thăn bò tây bắc`
- `TP017 | Ức gà sả chanh`

Sau khi bổ sung các item này, `seed_import.auto_issue_suggestions` không còn dòng nào thiếu `inventory_code`.

## File chính nên dùng
- `docs/seeding/mealprep_seed_full_from_excel_current_compatible.sql`

## File phụ để kiểm tra/import
Thư mục `docs/seeding/normalized_csv/` chứa toàn bộ export chuẩn hoá để kiểm tra hoặc viết importer.

## Khuyến nghị chạy
1. Backup DB dev/local hiện tại
2. Chạy file:
   - `docs/seeding/mealprep_seed_full_from_excel_current_compatible.sql`
3. Kiểm tra:
- auth/profile/shop vẫn login được
- catalog menu hiển thị 18 món / 54 biến thể
- inventory master hiển thị 42 item
- schema `seed_import` đã có full dữ liệu vận hành
4. Sau khi Codex build xong business schema thật, viết importer từ `seed_import.*` → bảng thật

## Gợi ý bước tiếp theo
- build migration cho:
  - customers
  - orders
  - order_items
  - inventory_lots
  - stock_movements
  - pricing snapshots / promotions / audit_logs
- sau đó viết SQL importer lấy dữ liệu trực tiếp từ `seed_import`

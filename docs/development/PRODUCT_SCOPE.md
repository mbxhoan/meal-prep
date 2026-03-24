# PRODUCT_SCOPE.md

## Mục tiêu sản phẩm
Xây dựng web app vận hành Meal Prep cho shop, thay thế Google Sheets, bao phủ:
- Master data
- Sales order / bill
- Pricing / promotions / coupons
- Inventory theo lot + expiry + FEFO
- Nhập kho / xuất kho / điều chỉnh kho
- Lợi nhuận / doanh thu / tồn kho
- Audit log / lịch sử thao tác
- User / role / permission

## Persona người dùng ban đầu
### 1. System Admin
- quản trị toàn hệ thống
- tạo / khóa shop
- xem toàn bộ log
- quản lý role & permission hệ thống
- hỗ trợ dữ liệu, cấu hình global

### 2. Shop Admin
- quản trị 1 shop
- quản lý master data của shop
- quản lý menu / giá / khách hàng / nhân viên
- xác nhận đơn / xử lý kho / xem báo cáo

### 3. Employee
- tạo đơn
- nhập / xuất kho theo quyền được cấp
- xem bill / tra cứu khách hàng / thao tác tác nghiệp
- không được sửa rule nhạy cảm nếu không có quyền

## Module phase đầu
### A. Master data
- shop
- warehouse
- item group
- item type
- unit of measure
- customer
- employee
- supplier
- item / sku
- storage rule / shelf life profile (nếu cần)
- payment method
- stock movement reason
- promotion / coupon rule

### B. Sales
- sales order
- sales order item
- bill/print view
- discount / promotion
- payment status
- order status

### C. Inventory
- item lots
- goods receipt
- goods issue
- stock adjustment
- FEFO suggestion
- stock ledger
- on-hand by lot / by item / by warehouse

### D. Reporting
- doanh thu theo ngày / khách / nhân viên
- lợi nhuận gộp chuẩn
- tồn kho hiện tại
- lô cận HSD / hết HSD
- top món bán
- export CSV/XLSX

### E. Administration
- users
- roles
- permissions
- audit log
- config

## Non-goals phase 1
- POS offline
- đa chi nhánh phức tạp với transfer workflow nhiều bước
- accounting / công nợ kế toán đầy đủ
- production planning nâng cao
- BOM auto explode nhiều cấp
- loyalty point phức tạp

## Kết quả nghiệp vụ bắt buộc
1. Tạo đơn xong có bill ngay.
2. Đơn đã gửi/chốt không bị nhảy giá theo bảng giá mới.
3. Nhập kho thành phẩm/nguyên liệu theo lô, có NSX/HSD.
4. Xuất kho ưu tiên FEFO.
5. Mọi thay đổi nhạy cảm đều có lịch sử.
6. Có thể truy vết:
   - ai sửa giá
   - ai sửa đơn
   - ai xuất lô nào
   - ai override FEFO

# ROLE_BASED_OPERATIONS_SOP.md

## Mục tiêu
Mô tả rõ ai làm gì trong hệ thống để tránh chồng chéo quyền và tránh thao tác sai.

## 1. `system_admin`
### Phạm vi
- quản lý hệ thống đa shop
- tạo / khóa shop
- tạo / khóa role, permission, user mapping
- xem audit log toàn hệ thống
- cấu hình nền cho chính sách dữ liệu và bảo mật

### Được phép
- cấp / thu hồi quyền
- bật / tắt module
- xem báo cáo cấp hệ thống
- xử lý sự cố dữ liệu có kiểm soát

### Không nên làm hàng ngày
- trực tiếp tạo đơn bán lẻ
- chỉnh tay nghiệp vụ thay cho shop admin

## 2. `shop_admin`
### Phạm vi
- vận hành một shop
- quản lý nhân viên shop
- quản lý master data của shop
- cập nhật bảng giá hiện hành
- duyệt ngoại lệ có kiểm soát

### Được phép
- tạo và sửa khách hàng
- tạo và sửa hàng hóa / menu / biến thể
- tạo bảng giá mới, hiệu lực giá mới
- tạo phiếu nhập, phiếu xuất, điều chỉnh kho
- duyệt override giá / FEFO theo quyền được cấp
- xem audit log trong phạm vi shop

### Trách nhiệm
- đảm bảo không để bill cũ tự đổi giá
- đảm bảo tồn kho đi qua chứng từ
- đảm bảo FEFO được tuân thủ
- đảm bảo nhân viên không dùng chung tài khoản

## 3. `employee`
### Phạm vi
- thao tác tác nghiệp hàng ngày
- tạo đơn, cập nhật thanh toán theo quyền
- nhập / xuất kho theo quyền

### Được phép điển hình
- tạo khách hàng mới
- tạo đơn hàng nháp
- thêm món vào đơn
- gửi bill cho khách
- tạo phiếu nhập / xuất nháp
- scan barcode hàng hoặc barcode lô

### Không được phép mặc định
- xóa chứng từ đã post
- sửa giá đã chốt
- bypass FEFO nếu không có quyền
- điều chỉnh tồn kho không có lý do
- xem log toàn hệ thống

## Ma trận quyết định nhanh
| Tình huống | Employee | Shop Admin | System Admin |
|---|---|---:|---:|
| Tạo đơn nháp | Có | Có | Có |
| Sửa giá đơn nháp | Có nếu được cấp quyền | Có | Có |
| Sửa giá đơn đã gửi | Không mặc định | Có nếu có override + log | Có |
| Xác nhận xuất FEFO | Có nếu được cấp | Có | Có |
| Override FEFO | Không mặc định | Có | Có |
| Điều chỉnh tồn | Không mặc định | Có | Có |
| Gán role cho user | Không | Trong phạm vi shop nếu được thiết kế | Có |
| Xem audit log hệ thống | Không | Không | Có |

## SOP khi có nhân viên mới
1. Tạo tài khoản hoặc mời user.
2. Gán shop.
3. Gán role phù hợp.
4. Bắt user đọc `USER_ONBOARDING_GUIDE.md`.
5. Cho user chạy demo flow trên dữ liệu test.
6. Chỉ cấp quyền override sau khi user hiểu quy trình.

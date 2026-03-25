# USER_ONBOARDING_GUIDE.md

## Mục tiêu
Tài liệu này dành cho **người dùng mới** của phần mềm Meal Prep Ops Platform. Mục tiêu là giúp user mới có thể đăng nhập, hiểu hệ thống, nắm quy trình chính và vận hành an toàn mà không làm sai giá, sai kho hoặc sai lịch sử.

## Đối tượng sử dụng
- `system_admin`
- `shop_admin`
- `employee`

## Nguyên tắc vận hành phải nhớ
1. **Không sửa số liệu lịch sử bằng cách chỉnh tay trực tiếp trong database hoặc master data.**
2. **Đơn hàng đã gửi / đã chốt không được tự đổi giá.**
3. **Tồn kho không cập nhật tay.** Mọi thay đổi tồn phải đi qua chứng từ nhập / xuất / điều chỉnh.
4. **Hàng có HSD phải xuất theo FEFO**, trừ khi có override có lý do.
5. **Mọi thao tác quan trọng đều có log.** User phải thao tác đúng quy trình vì lịch sử được lưu lại.

## 30 phút đầu tiên cho user mới
### Bước 1 — đăng nhập và kiểm tra quyền
- Đăng nhập bằng tài khoản được cấp.
- Kiểm tra shop hiện tại đang thao tác.
- Kiểm tra menu được phép truy cập.
- Nếu thiếu quyền, báo `shop_admin` hoặc `system_admin`, không dùng chung tài khoản.

### Bước 2 — đọc dashboard và trạng thái hệ thống
- Xem tổng quan đơn hàng trong ngày.
- Xem tồn kho sắp hết / lô cận HSD.
- Xem các cảnh báo cần xử lý.

### Bước 3 — nắm 5 khu vực chính
- **Master Data**: khách hàng, hàng hóa, kho, đơn vị tính, giá.
- **Sales**: đơn hàng, bill, thanh toán, giảm giá.
- **Inventory**: nhập kho, xuất kho, tồn lô, FEFO.
- **Reports**: doanh thu, lợi nhuận snapshot, tồn kho, cận HSD.
- **Administration**: user, phân quyền, audit log.

### Bước 4 — nắm 4 câu hỏi trước khi bấm xác nhận
Trước khi user xác nhận thao tác quan trọng, luôn tự hỏi:
1. Đây là **master data** hay **giao dịch thực tế**?
2. Thao tác này có ảnh hưởng tới **giá lịch sử** không?
3. Thao tác này có ảnh hưởng tới **tồn kho** không?
4. Nếu cần kiểm tra lại sau này, **audit log** có đủ để giải thích không?

## Quy trình học nhanh theo vai trò
### `employee`
Ngày đầu cần biết:
- tạo khách hàng
- tạo đơn hàng
- thêm món vào đơn
- xem bill
- kiểm tra trạng thái thanh toán
- xem FEFO suggestion khi xuất kho
- không tự ý sửa giá nếu không có quyền

### `shop_admin`
Ngày đầu cần biết thêm:
- CRUD master data
- cập nhật bảng giá hiện hành
- tạo chương trình giảm giá cơ bản
- duyệt override FEFO / override giá
- xem audit log và báo cáo ngày

### `system_admin`
Ngày đầu cần biết thêm:
- quản lý shop, user, roles, permissions
- kiểm tra log toàn hệ thống
- khóa quy tắc nền: pricing snapshot, movement ledger, FEFO
- không chỉnh dữ liệu production bằng tay ngoài migration / công cụ admin có audit

## Luồng thao tác điển hình trong ngày
1. Kiểm tra dashboard đầu ngày.
2. Tạo / cập nhật đơn hàng mới.
3. Gửi bill cho khách.
4. Khi đơn được xác nhận, tạo và xử lý xuất kho theo FEFO.
5. Hoàn tất đơn, cập nhật thanh toán.
6. Cuối ngày đối chiếu doanh thu, đơn chưa thanh toán, tồn kho cận HSD.

## Những việc user mới không được làm
- Không sửa trực tiếp giá trên đơn đã gửi khách.
- Không xóa đơn đã có movement.
- Không sửa tồn bằng tay để “cho đúng”.
- Không bỏ qua FEFO mà không nhập lý do.
- Không dùng 1 tài khoản cho nhiều người.

## Cách báo lỗi đúng
Khi gặp lỗi, user cần gửi đủ:
- module đang thao tác
- shop đang chọn
- mã đơn / mã chứng từ / mã lô
- thao tác vừa thực hiện
- ảnh chụp màn hình hoặc nội dung lỗi
- thời điểm xảy ra

## Thuật ngữ cần hiểu
- **Snapshot giá**: giá được chụp lại tại thời điểm tạo đơn, không tự đổi theo bảng giá mới.
- **Lot / lô**: một đợt hàng nhập hoặc thành phẩm cùng NSX/HSD.
- **FEFO**: xuất lô gần hết hạn nhất trước.
- **Movement**: bút toán nhập/xuất/điều chỉnh kho, là nguồn sự thật cho tồn.
- **Override**: thao tác phá rule mặc định, phải có quyền và lý do.

# DAILY_OPERATIONS_PLAYBOOK.md

## Mục tiêu
Đây là playbook vận hành hàng ngày để user mới biết nên làm gì theo trình tự, giảm lỗi sai nghiệp vụ.

## A. Mở ngày làm việc
1. Mở dashboard shop.
2. Kiểm tra:
   - đơn chưa xử lý
   - đơn chưa thanh toán
   - lô cận HSD / hết hạn
   - tồn thấp
3. Kiểm tra phiếu nhập hoặc giao hàng dự kiến trong ngày.

## B. Nhập kho hàng mới
### Khi nào dùng
- nhận nguyên liệu từ nhà cung cấp
- nhập bao bì / gia vị
- nhập thành phẩm đã sản xuất

### Các bước
1. Tạo phiếu nhập kho.
2. Chọn kho nhận.
3. Chọn nhà cung cấp hoặc nguồn nhập.
4. Thêm từng item vào phiếu.
5. Với item có tracking mode `lot` hoặc `lot_serial`, nhập:
   - mã lô
   - NSX
   - HSD
   - số lượng
   - đơn giá vốn
6. In hoặc dán barcode lô nếu áp dụng.
7. Xác nhận phiếu nhập.
8. Sau khi post, kiểm tra tồn theo lô.

## C. Tạo đơn bán
1. Chọn khách hoặc tạo khách mới.
2. Tạo đơn nháp.
3. Thêm món, số lượng, trọng lượng / biến thể.
4. Hệ thống chụp snapshot giá tại thời điểm tạo đơn.
5. Kiểm tra giảm giá / coupon / phí giao hàng.
6. Gửi bill cho khách.

## D. Khi khách đã đồng ý đơn
1. Chuyển đơn từ `draft` sang `sent` hoặc `confirmed`.
2. Từ thời điểm này, **không tự refresh giá** nữa.
3. Nếu cần sửa giá, phải dùng flow override theo quyền.

## E. Xuất kho cho đơn bán
1. Mở phiếu xuất liên kết với đơn.
2. Hệ thống gợi ý lô theo FEFO.
3. User kiểm tra lô gợi ý.
4. Nếu đồng ý, xác nhận cấp phát.
5. Nếu cần đổi lô, nhập reason override.
6. Post phiếu xuất.
7. Kiểm tra tồn sau xuất.

## F. Thành phẩm nấu dư để bán dần
1. Sau khi sản xuất xong, tạo `production output` hoặc phiếu nhập thành phẩm.
2. Ghi nhận:
   - mã hàng thành phẩm
   - lô thành phẩm
   - NSX
   - HSD
   - số lượng tạo ra
3. Thành phẩm này sẽ được bán dần theo FEFO.

## G. Cuối ngày
1. Kiểm tra đơn chưa thanh toán.
2. Kiểm tra phiếu nhập / xuất nháp chưa post.
3. Kiểm tra lô cận HSD.
4. Kiểm tra audit log các thao tác override trong ngày.
5. Chốt báo cáo doanh thu và gross profit snapshot.

## H. Điều user mới thường nhầm
- đổi master price rồi tưởng bill cũ cũng phải đổi theo
- sửa tồn trực tiếp thay vì tạo phiếu điều chỉnh
- không nhập HSD khi item có FEFO
- xuất lô theo cảm tính thay vì theo gợi ý FEFO
- quên post phiếu nháp

# TROUBLESHOOTING_AND_EXCEPTION_HANDLING.md

## 1. Đơn cũ bị đổi giá sau khi sửa bảng giá
### Triệu chứng
Bill cũ hiển thị giá mới.

### Nguyên nhân có thể
- order item chưa snapshot giá, vẫn đọc động từ bảng giá
- user dùng chức năng refresh giá trên đơn đã gửi/chốt

### Cách xử lý đúng
1. Kiểm tra trạng thái đơn.
2. Nếu đơn đã `sent/confirmed/paid`, giá phải lấy từ snapshot.
3. Không sửa trực tiếp master price để “vá” bill cũ.
4. Tạo log bug và fix rule snapshot.

## 2. Tồn kho sai
### Triệu chứng
Tổng tồn không khớp với thực tế.

### Kiểm tra
1. Có phiếu nhập / xuất nào còn ở trạng thái nháp không.
2. Có ai chỉnh tay tồn hoặc post duplicate movement không.
3. Có movement bị cancel nhưng không reverse không.

### Cách xử lý đúng
- đối chiếu movement ledger
- nếu cần, dùng phiếu điều chỉnh kho có reason
- không update trực tiếp cột tồn

## 3. FEFO gợi ý lô A nhưng kho lại lấy lô B
### Cách xử lý đúng
- chỉ cho phép nếu user có quyền override
- bắt buộc nhập reason
- audit log phải lưu user, lô FEFO đề xuất, lô thực tế dùng, lý do

## 4. Nhập thiếu HSD
### Hệ quả
- không chạy FEFO đúng
- báo cáo cận HSD sai

### Cách xử lý
- item expirable phải chặn post phiếu nhập nếu thiếu HSD, trừ khi policy cho phép và có warning rõ ràng

## 5. Bill đã gửi khách nhưng cần sửa giá
### Cách xử lý
1. Nếu chính sách cho phép, tạo flow override giá.
2. Lưu lý do sửa.
3. Lưu lịch sử trước/sau.
4. Gửi lại bill phiên bản mới nếu cần.

## 6. Quét barcode không ra item/lô
### Kiểm tra
- barcode thuộc item hay lot
- barcode đã tồn tại trong master / lô chưa
- user đang ở đúng shop/kho chưa
- scanner có thêm ký tự lạ hoặc line break không

## 7. Hết hàng nhưng đơn vẫn confirm được
### Cách xử lý mong muốn của hệ thống
- cảnh báo rõ tồn không đủ
- chỉ cho confirm nếu policy cho phép backorder hoặc override
- log lý do nếu vẫn tiếp tục

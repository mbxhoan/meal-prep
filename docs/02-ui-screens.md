# 02 - UI Screens

## Dashboard `/`
- thẻ KPI
- link nhanh tới các module
- vùng hiển thị trạng thái import và checklist go-live

## Products `/products`
- filter theo nhóm món
- search theo tên/mã
- table danh sách món
- hiển thị số variant
- CTA:
  - thêm món
  - import master data

## Combos `/combos`
- search theo mã/tên combo
- table combo
- hiển thị giá vốn tham chiếu, giá bán ban đầu tham chiếu và giá bán hiện tại
- hiển thị số thành phần

## Customers `/customers`
- search tên / điện thoại
- table khách hàng
- số đơn / tổng chi tiêu nếu đã nối DB thật

## Employees `/employees`
- search tên / mã nhân viên
- table nhân viên
- số đơn / doanh số nếu đã nối DB thật

## Orders `/orders`
- filter theo trạng thái
- search theo mã đơn / khách
- hiển thị tạm tính / ship / giảm giá / tổng thanh toán
- hiển thị thông tin shipper nếu có
- badge cho:
  - order_status
  - payment_status
  - delivery_status
- cho phép cập nhật nhanh order_status / payment_status / delivery_status
- cho phép xoá đơn hàng

## New Order `/orders/new`
- form tạo đơn thật khi đã cấu hình Supabase
- 2 vùng:
  - thông tin đầu đơn
  - dòng hàng
- dòng hàng cho phép thêm nhiều món lẻ hoặc nhiều combo
- phí ship và giảm giá không nhập thì mặc định 0
- shipper và SĐT shipper là tuỳ chọn
- tổng tiền tự cập nhật khi thêm / xoá / sửa dòng hàng

## Import `/imports/master-data`
- upload file xlsx
- hiển thị thứ tự import
- hiển thị accepted sheet names
- hiển thị kết quả import

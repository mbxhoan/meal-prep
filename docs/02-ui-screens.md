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
- hiển thị giá bán
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
- badge cho:
  - order_status
  - payment_status
  - delivery_status

## New Order `/orders/new`
- form demo chuẩn để dev bám theo
- 2 vùng:
  - thông tin đầu đơn
  - dòng hàng

## Import `/imports/master-data`
- upload file xlsx
- hiển thị thứ tự import
- hiển thị accepted sheet names
- hiển thị kết quả import

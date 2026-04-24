# 04 - API Contracts

## GET `/api/health`
Trả về:
```json
{
  "ok": true,
  "app": "MealFit Sales Admin"
}
```

## POST `/api/import/master-data`
### Input
`multipart/form-data`
- `file`: Excel workbook

### Output thành công
```json
{
  "ok": true,
  "summary": {
    "sheets": 7,
    "insertedOrUpdated": 120,
    "errors": 0
  },
  "detail": []
}
```

### Output lỗi validate
```json
{
  "ok": false,
  "summary": {
    "sheets": 4,
    "insertedOrUpdated": 0,
    "errors": 3
  },
  "detail": [
    {
      "sheet": "product_variants",
      "row": 4,
      "message": "variant_code is missing"
    }
  ]
}
```

## Server Actions đơn hàng
### `createOrderAction`
Input từ form `/orders/new`:
- `customer_id`, `employee_id`
- `phone`, `delivery_address`
- `shipper_name`, `shipper_phone` tuỳ chọn
- `shipping_fee`, `discount_amount`, mặc định 0 nếu để trống
- `order_status`, `payment_status`, `delivery_status`
- nhiều dòng `line_type[]`, `item_id[]`, `qty[]`

Xử lý:
- chỉ nhận `line_type = product_variant | combo`
- đọc lại giá từ DB trước khi lưu
- lưu snapshot tên, trọng lượng, giá bán, giá vốn vào `sales_order_items`
- tự tính `subtotal_amount`, `discount_amount`, `total_amount`

### `updateOrderStatusesAction`
Cập nhật nhanh:
- `order_status`
- `payment_status`
- `delivery_status`

### `deleteOrderAction`
Xoá `sales_orders`; `sales_order_items` xoá theo cascade.

## API mở rộng nên làm tiếp
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `GET /api/combos`
- `POST /api/orders/:id/payments`

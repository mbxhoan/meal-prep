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

## API mở rộng nên làm tiếp
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `GET /api/combos`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `POST /api/orders/:id/payments`

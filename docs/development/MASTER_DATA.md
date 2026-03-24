# MASTER_DATA.md

## Các bảng master data nên có

### 1. shops
- shop code
- shop name
- address
- phone
- timezone
- currency
- active status

### 2. users / employees
- auth user
- employee profile
- display name
- phone
- shop
- active status

### 3. roles
### 4. permissions
### 5. role_permissions
### 6. user_shop_roles

### 7. customers
- code
- name
- phone
- address
- note
- active
- unique within shop theo rule phù hợp

### 8. suppliers
- code
- name
- phone
- address
- note

### 9. warehouses
- code
- name
- address
- default flag

### 10. item_groups
Ví dụ:
- meal_prep
- gia_vi
- bao_bi
- nguyen_lieu_khac

### 11. item_types
Ví dụ:
- raw_material
- seasoning
- finished_good
- packaging

### 12. units
Ví dụ:
- g
- kg
- hu
- bich
- cai
- goi
- phan

### 13. items
Đây là SKU/hàng hóa tồn kho.
Các field chính:
- item_code
- barcode
- name
- item_group_id
- item_type_id
- base_unit_id
- shelf_life_days_default
- lot_tracked
- fefo_enabled
- minimum_stock_qty
- active
- notes

### 14. menu_items
Đây là món bán cho khách.
Tách khỏi `items` để rõ nghiệp vụ.
Field gợi ý:
- code
- name
- active
- notes

### 15. menu_item_variants
Ví dụ:
- Ức gà cajun 100g
- Ức gà cajun 150g
- Ức gà cajun 200g

Field:
- menu_item_id
- weight_label
- weight_grams
- linked_inventory_item_id (nếu 1 gói bán tương ứng 1 item tồn kho)
- active

### 16. price_books
- code
- name
- effective_from
- effective_to
- status

### 17. price_book_items
- price_book_id
- menu_item_variant_id
- sale_price
- standard_cost
- target_margin_percent (optional)

### 18. coupons
- code
- type
- value
- min_order_amount
- valid_from
- valid_to
- max_usage
- max_usage_per_customer
- active

### 19. promotion_programs
- name
- type
- scope (order/line/shipping)
- rule json
- active

### 20. stock_adjustment_reasons
Ví dụ:
- count_gain
- count_loss
- damaged
- expired
- sample_use
- internal_use

### 21. payment_methods
Ví dụ:
- cash
- bank_transfer
- momo
- zalopay

### 22. configs (shop-level)
Các config gợi ý:
- near_expiry_days
- expiring_soon_days
- default_currency
- default_price_book_id
- allow_negative_stock
- allow_expired_issue
- allow_fefo_override

## Master data bổ sung rất nên có
1. `recipe_headers` / `recipe_lines`
   - để map thành phẩm -> nguyên liệu/bao bì tiêu hao
   - hữu ích cho phase sau
2. `customer_tags`
3. `warehouse_zones` (nếu sau này kho lớn hơn)
4. `sales_channels`
   - direct / zalo / shopee / website / phone
5. `notification_rules`
   - cảnh báo cận HSD, tồn thấp

## Mapping từ Google Sheet hiện tại
- `Khach_hang` -> customers
- `Nhân_viên` -> employees
- `Master_data` -> item_groups, item_types, units, warehouses
- `Danh_muc_hang` -> items
- `Thuc_don` + `Bang_gia` -> menu_items, menu_item_variants, price_books, price_book_items

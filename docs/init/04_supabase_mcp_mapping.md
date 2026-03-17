# MealFit - Supabase MCP Mapping

Tài liệu này giúp Codex / Cursor / AI agent hiểu cách map giữa **admin UI**, **schema Supabase** và **public storefront**.

---

## 1. Nguyên tắc MCP cho repo này

Khi dùng Supabase MCP, agent nên làm theo thứ tự:
1. Inspect schema hiện có trên project Supabase.
2. So sánh với các file migration trong repo.
3. Chỉ generate migration mới khi schema thiếu hoặc lệch.
4. Không đổi tên bảng/field tùy tiện nếu frontend public đang dùng.
5. Mọi thay đổi schema phải đi kèm cập nhật typed queries và form UI.

---

## 2. Bản đồ UI route -> bảng dữ liệu

### `/admin/categories`
**Bảng chính**
- `public.categories`

**CRUD fields**
- `name`
- `slug`
- `description`
- `image_url`
- `sort_order`
- `is_active`

**Query pattern**
- list: select * from categories order by sort_order asc, created_at desc
- create: insert category
- update: update by `id`
- delete: delete by `id`

---

### `/admin/products`
**Bảng chính**
- `public.products`

**Join cần thiết**
- join `public.categories`
- join `public.product_variants` để lấy default price / default nutrition nếu muốn

**CRUD fields**
- `category_id`
- `name`
- `slug`
- `short_description`
- `description`
- `main_image_url`
- `is_featured`
- `is_published`
- `sort_order`
- `seo_title`
- `seo_description`

**Query pattern**
- list products with category name
- filter by `category_id`
- search by `name ilike`
- order by `sort_order`, `updated_at desc`

---

### `/admin/products/[id]` -> tab Variants
**Bảng chính**
- `public.product_variants`

**Parent**
- `public.products`

**CRUD fields**
- `label`
- `weight_in_grams`
- `price`
- `compare_at_price`
- `packaging_cost`
- `labor_cost`
- `overhead_cost`
- `is_default`
- `is_active`
- `calories`
- `protein`
- `carbs`
- `fat`
- `fiber`
- `sort_order`

**Logic**
- mỗi product có nhiều variants
- chỉ nên có 1 variant `is_default = true`
- khi set default mới, unset default cũ
- `packaging_cost + labor_cost + overhead_cost + recipe cost` = `unit_cogs` dùng cho gross profit
- recipe cost được lấy từ `public.recipe_components` + `public.inventory_items.average_unit_cost`

### `/admin/products/[id]` -> cost recipe / BOM
**Bảng chính**
- `public.recipe_components`
- `public.inventory_items`

**Parent**
- `public.product_variants`

**CRUD fields**
- recipe: `variant_id`, `inventory_item_id`, `quantity_per_unit`, `wastage_pct`
- inventory: `name`, `sku`, `unit`, `current_quantity`, `average_unit_cost`, `reorder_point`

**Logic**
- mỗi variant có nhiều dòng BOM
- cost nguyên liệu = `quantity_per_unit * average_unit_cost * (1 + wastage_pct/100)`
- khi đổi giá nhập hoặc avg cost trong tồn kho, đơn mới sẽ tự tính lại cost theo dữ liệu hiện tại

---

### `/admin/products/[id]` -> tab Images
**Bảng chính**
- `public.product_images`

**Storage**
- bucket `product-media`

**CRUD fields**
- `image_url`
- `alt_text`
- `sort_order`

**Logic**
- upload file vào Storage trước
- sau đó insert row vào `product_images`
- `main_image_url` của product có thể lấy từ row đầu tiên hoặc chỉnh riêng ở product general tab

---

### `/admin/products/[id]` -> tab Benefits
**Bảng chính**
- `public.product_benefits`

**CRUD fields**
- `title`
- `sort_order`

---

### `/admin/navigation`
**Bảng chính**
- `public.navigation_menus`
- `public.navigation_items`

**Mapping location**
- `header-main` -> menu header public site
- `footer-main` -> quick links ở footer

**CRUD fields**
- menu: `name`, `location`, `description`, `is_active`
- item: `label`, `href`, `page_slug`, `sort_order`, `is_visible`, `target`, `parent_id`

---

### `/admin/pages`
**Bảng chính**
- `public.pages`
- `public.page_sections`

**Slug mapping**
- `home` -> trang chủ
- `menu` -> trang thực đơn
- `about` -> trang về chúng tôi

**Pages fields**
- `slug`
- `title`
- `excerpt`
- `meta_title`
- `meta_description`
- `is_published`

**Page sections fields**
- `section_key`
- `section_type`
- `title`
- `subtitle`
- `body`
- `image_url`
- `button_label`
- `button_href`
- `data_json`
- `sort_order`
- `is_visible`

**Current storefront mapping**
- homepage hero -> `pages.slug = 'home'` + `page_sections.section_key = 'hero'`
- about blocks -> nhiều rows trong `page_sections` với `page_id = about`

---

### `/admin/settings`
**Bảng chính**
- `public.site_settings`

**Known keys**
- `brand`
- `contact`
- `hero`
- `seo_defaults`

**UI mapping**
- `brand.name`, `brand.tagline`
- `contact.phone`, `contact.email`, `contact.address`
- `hero.featured_product_slug`, `hero.cta_label`, `hero.scroll_label`
- `seo_defaults.title`, `seo_defaults.description`

---

### `/admin/inventory`
**Bảng chính**
- `public.inventory_items`
- `public.inventory_movements`

**CRUD fields**
- item: `name`, `sku`, `unit`, `current_quantity`, `reorder_point`, `average_unit_cost`, `last_purchase_cost`, `supplier_name`, `notes`, `is_active`
- movement: `inventory_item_id`, `movement_type`, `quantity_delta`, `unit_cost`, `reference_type`, `reference_id`, `notes`

**Logic**
- movement insert sẽ trigger cập nhật `inventory_items.current_quantity`
- movement `purchase` sẽ recalculate `average_unit_cost`
- movement `order_consumption` được tạo tự động khi đơn chuyển sang `confirmed/completed`

---

### `/admin/orders`
**Bảng chính**
- `public.orders`
- `public.order_items`

**Order fields**
- `order_number`
- `customer_name`
- `customer_phone`
- `sales_channel`
- `status`
- `note`
- `subtotal`
- `discount_amount`
- `shipping_fee`
- `other_fee`
- `total_revenue`
- `total_cogs`
- `gross_profit`
- `gross_margin`
- `inventory_applied_at`
- `ordered_at`

**Order item fields**
- `variant_id`
- `product_id`
- `quantity`
- `unit_price`
- `ingredient_cost`
- `packaging_cost`
- `labor_cost`
- `overhead_cost`
- `unit_cogs`
- `line_revenue`
- `line_cogs`
- `line_profit`
- `recipe_snapshot`

**Logic**
- `before insert/update` trên `order_items` sẽ tự đổ cost breakdown từ variant + recipe
- `after insert/update/delete` trên `order_items` sẽ aggregate lại `orders.total_revenue`, `total_cogs`, `gross_profit`
- khi đổi trạng thái order sang `confirmed` hoặc `completed`, hệ thống sẽ auto consume tồn kho nếu chưa consume trước đó

---

### `/admin/analytics`
**Nguồn dữ liệu**
- `public.orders`
- `public.order_items`
- `public.products`

**KPI**
- doanh thu theo ngày
- COGS theo ngày
- gross profit theo ngày
- gross margin theo ngày
- top selling menu
- kênh bán mang doanh thu cao nhất

---

## 3. Public storefront mapping

### Header
- đọc menu từ `navigation_menus(location='header-main')`
- đọc items từ `navigation_items`

### Footer
- quick links từ `navigation_menus(location='footer-main')`
- contact từ `site_settings(key='contact')`
- brand tagline từ `site_settings(key='brand')`

### Trang chủ
- page basic SEO từ `pages(slug='home')`
- hero section từ `page_sections(section_key='hero')`
- featured product chi tiết từ `products` + `product_variants`

### Menu page
- page intro từ `pages(slug='menu')` + `page_sections`
- categories từ `categories`
- products list từ `products` + default `product_variants`
- ảnh đại diện lấy từ `products.main_image_url`

### Product detail page
- product từ `products(slug=...)`
- variants từ `product_variants`
- images từ `product_images`
- benefits từ `product_benefits`

### About page
- page basic từ `pages(slug='about')`
- sections từ `page_sections` order theo `sort_order`

---

## 4. Supabase Auth / RLS mapping

**Bảng role**
- `public.profiles`

**Role values**
- `admin`
- `editor`
- `viewer`

**Luật**
- public site: anonymous read published content
- admin/editor: full CRUD trên content tables
- viewer: không vào admin

**Guard logic**
- `profiles.role in ('admin', 'editor')` -> allow admin routes
- còn lại redirect về login hoặc trang không có quyền

---

## 5. Storage mapping

**Buckets**
- `product-media`
- `site-media`

**Dùng khi nào**
- `product-media`: ảnh sản phẩm, gallery, thumbnail
- `site-media`: logo, hero image, about image, banners

**Quy trình chuẩn**
1. Upload file vào bucket
2. Lấy public URL
3. Ghi URL vào bảng liên quan
4. Nếu xoá row dữ liệu, cân nhắc xoá object storage tương ứng

---

## 6. Quy ước cho AI agent

1. Luôn query đúng theo mapping trên.
2. Không đọc trực tiếp `auth.users` từ client.
3. Không dùng service role key ở frontend.
4. Nếu cần dữ liệu tổng hợp phức tạp, ưu tiên tạo view SQL hoặc RPC.
5. Khi cần sửa schema, tạo migration SQL rõ ràng thay vì sửa thủ công trong UI rồi bỏ quên repo.

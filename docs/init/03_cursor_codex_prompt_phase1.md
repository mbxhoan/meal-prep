# Prompt cho Codex / Cursor - Phase 1

Bạn đang làm việc trên repo webapp MealFit hiện tại.

## Mục tiêu
Xây một admin CMS hoàn chỉnh ở route `/admin` để quản lý:
- danh mục sản phẩm
- sản phẩm
- variants / trọng lượng / giá / nutrition
- lợi ích sản phẩm
- menu điều hướng
- trang tĩnh và sections
- site settings cơ bản

## Ràng buộc kỹ thuật
1. Giữ nguyên public storefront hiện có, không làm hỏng UI public.
2. Ưu tiên dùng stack hiện có của repo. Nếu repo là Next.js App Router thì tiếp tục dùng App Router.
3. Dùng Supabase làm backend dữ liệu.
4. Dùng TypeScript nghiêm ngặt.
5. Tạo code sạch, chia component nhỏ, không hardcode dữ liệu demo trong component UI.
6. UI admin phải responsive, chuyên nghiệp, dễ dùng.
7. Ưu tiên shadcn/ui + Tailwind nếu repo đang hợp với hướng đó. Nếu repo đã dùng MUI/Ant Design thì không ép đổi.

## Dữ liệu nguồn
Sử dụng schema và seed trong các file sau:
- `mealfit_admin_starter_pack/01_schema_supabase.sql`
- `mealfit_admin_starter_pack/02_seed_mealfit.sql`

## Yêu cầu màn hình admin
### 1. `/admin`
- dashboard overview đơn giản
- card tổng số categories, products, published pages
- recent updated products

### 2. `/admin/categories`
- bảng danh sách categories
- tạo mới category
- sửa inline hoặc qua dialog
- xoá category có confirm dialog
- fields: name, slug, description, image_url, sort_order, is_active

### 3. `/admin/products`
- bảng danh sách products
- filter theo category
- search theo name
- toggle publish
- create/edit product form
- fields:
  - name
  - slug
  - category_id
  - short_description
  - description
  - main_image_url
  - is_featured
  - is_published
  - sort_order
  - seo_title
  - seo_description

### 4. `/admin/products/[id]`
- tabs: General / Variants / Images / Benefits / SEO
- General: fields cơ bản
- Variants:
  - add/edit/delete variant
  - fields: label, weight_in_grams, price, compare_at_price, is_default, is_active, calories, protein, carbs, fat, fiber, sort_order
- Images:
  - upload image to Supabase Storage bucket `product-media`
  - reorder images
  - edit alt_text
- Benefits:
  - add/edit/delete benefit
  - drag to reorder hoặc sort_order

### 5. `/admin/navigation`
- quản lý header-main và footer-main
- add/edit/delete navigation items
- fields: label, href, page_slug, sort_order, is_visible, target

### 6. `/admin/pages`
- list pages: home, menu, about
- edit page basic SEO
- edit page sections

### 7. `/admin/settings`
- edit JSON-backed site settings bằng form thân thiện
- nhóm settings:
  - brand
  - contact
  - hero
  - seo_defaults

## Auth và bảo mật
- Dùng Supabase Auth.
- Chỉ user có role `admin` hoặc `editor` trong `public.profiles` được vào `/admin`.
- `viewer` không được vào admin.
- Tạo middleware hoặc server-side guard để chặn truy cập trái phép.
- Không dùng service role key ở client.

## Chất lượng code
- Tạo `lib/supabase/server.ts` và `lib/supabase/client.ts`
- Tạo `types/database.ts` cho typed queries nếu có thể
- Tạo reusable components:
  - `AdminShell`
  - `AdminSidebar`
  - `PageHeader`
  - `DataTable`
  - `ConfirmDialog`
  - `ImageUploader`
- Tách server actions / data layer rõ ràng
- Hiển thị loading, empty state, error state tử tế

## UI/UX kỳ vọng
- Sidebar trái + topbar
- Mobile: sidebar drawer
- Desktop: layout 2 cột rõ ràng
- Form spacing thoáng, label rõ ràng
- Bảng có search + filter + pagination cơ bản
- Toast khi create/update/delete thành công hoặc lỗi

## Acceptance criteria
1. Có thể đăng nhập admin bằng Supabase Auth.
2. Có thể CRUD categories.
3. Có thể CRUD products.
4. Có thể CRUD product variants.
5. Có thể upload và quản lý image cho product.
6. Có thể CRUD navigation items.
7. Có thể CRUD pages và page sections.
8. Toàn bộ dữ liệu lấy từ Supabase, không hardcode.
9. UI responsive và deploy được lên Vercel.

## Cách làm việc
- Đầu tiên đọc structure repo hiện tại.
- Sau đó tạo plan ngắn.
- Tiếp theo implement admin shell trước.
- Sau đó implement categories CRUD.
- Sau đó products CRUD.
- Sau đó pages/navigation/settings.
- Mỗi bước phải chạy được trước khi sang bước tiếp.
- Không refactor public storefront ngoài phần cần kết nối dữ liệu.

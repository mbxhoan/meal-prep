# MealFit Admin CMS – Tài liệu triển khai Vibe Coding + Supabase + MCP

## 1) Mục tiêu

Xây dựng một **trang quản trị nội dung** cho website `mealfitdemo.vercel.app` để quản lý toàn bộ:

- Sản phẩm
- Danh mục menu
- Nội dung trang chủ
- Trang “Về chúng tôi”
- Ảnh/banner
- Thông tin liên hệ
- CTA, section, SEO cơ bản
- Tuỳ chọn mở rộng: đơn hàng, khách hàng, coupon, reviews

Mục tiêu là để bạn có thể giao cho Codex/Cursor triển khai nhanh theo kiểu **vibe coding**, nhưng vẫn có một kiến trúc sạch, dễ mở rộng, bảo mật tốt, và dùng được lâu dài.

---

## 2) Phân tích nhanh website hiện tại

Từ website hiện tại:

- Header đang có 3 mục chính: **Trang chủ**, **Thực đơn**, **Về chúng tôi**.
- Trang chủ đang có hero sản phẩm nổi bật “**Ức Gà Ướp**”, mô tả ngắn, CTA “Đặt Hàng Ngay”, lựa chọn khối lượng `500 G / 200 G / 1 KG`.
- Trang **Thực đơn** đang có các nhóm: **Tất cả, Gà, Bò, Heo, Hải sản, Gia vị** và đang hiển thị danh sách nhiều sản phẩm.
- Trang **Về chúng tôi** đang có các section: **Sứ mệnh**, **Nguyên liệu tươi**, **Cân bằng dinh dưỡng**, **Không lãng phí**, **Tiện lợi**.
- Footer đang có thông tin liên hệ mẫu: số điện thoại, email, địa chỉ.

Điều đó cho thấy web hiện tại phù hợp nhất với mô hình **content-managed storefront**: frontend public vẫn chạy như hiện nay, còn admin là một webapp riêng hoặc route riêng để chỉnh dữ liệu nền. Nguồn: website hiện tại của bạn.

---

## 3) Kết luận nhanh về database: có nên dùng PostgreSQL?

**Có. Nên dùng PostgreSQL, và nên dùng Supabase làm nền tảng triển khai.**

Lý do:

- Supabase dùng **Postgres đầy đủ** cho mỗi project, không phải DB giả lập hay key-value store.
- Supabase tự sinh **REST API** trực tiếp từ schema DB, nên làm CRUD cực nhanh cho admin mà không cần dựng backend riêng từ đầu.
- Supabase Auth + JWT + **Row Level Security (RLS)** cho phép kiểm soát quyền rất tốt theo vai trò admin/editor/viewer.
- Supabase Storage phù hợp để lưu ảnh sản phẩm, banner, media assets, và còn có access control bằng RLS.
- Với nhu cầu của bạn, dữ liệu có quan hệ rõ ràng: danh mục → sản phẩm → biến thể khối lượng → ảnh → dinh dưỡng → section nội dung. Đây là bài toán quan hệ điển hình, PostgreSQL phù hợp hơn NoSQL.

### Khi nào không cần PostgreSQL?

Chỉ khi bạn muốn làm một site cực nhỏ, gần như landing page tĩnh, ít cập nhật, không có media workflow, không có phân quyền, và chấp nhận sửa tay trong code. Nhưng với nhu cầu “thêm/xóa/sửa toàn bộ nội dung, menu, sản phẩm”, thì **PostgreSQL là lựa chọn đúng**.

---

## 4) Kiến trúc triển khai khuyến nghị

## 4.1 Kiến trúc tổng thể

- **Frontend public**: Next.js hiện tại trên Vercel
- **Admin app**: cùng repo, route `/admin`, hoặc subdomain riêng `admin.domain.com`
- **Database**: Supabase Postgres
- **Auth**: Supabase Auth
- **Media**: Supabase Storage
- **Data API**: Supabase auto-generated REST API hoặc `supabase-js`
- **Business logic đặc biệt**: Supabase Edge Functions / Postgres functions nếu cần
- **AI / Vibe Coding / MCP**: dùng **Supabase MCP** để Codex/Cursor/Claude có thể đọc schema, hỗ trợ migration, rà policy, và hiểu project tốt hơn

### 4.2 Nên làm admin cùng repo hay repo riêng?

Khuyến nghị cho giai đoạn hiện tại:

- **Cùng repo** với frontend
- Tạo route group riêng: `app/(admin)/admin/...`
- Dùng cùng design system, cùng env, cùng deployment pipeline

Lợi ích:

- Triển khai nhanh
- Dễ tái dùng component
- Dễ giữ đồng bộ types giữa public site và admin
- Dễ cho vibe coding vì Codex nhìn được toàn bộ project context

Chỉ tách repo nếu sau này admin quá lớn hoặc có team riêng.

---

## 5) Layout UI admin đề xuất

## 5.1 Mục tiêu UI

Giao diện cần:

- Dễ dùng với người không kỹ thuật
- Chuyên nghiệp
- Responsive
- Tối ưu cho CRUD số lượng lớn
- Có cảm giác “CMS + storefront admin”, không quá nặng kiểu ERP

Thiết kế nên bám các nguyên tắc dashboard như: giảm tải nhận thức, giữ nhất quán, responsive theo breakpoint và đặt thông tin quan trọng ở vùng ưu tiên nhìn.

## 5.2 Layout khuyến nghị

### Desktop

- **Sidebar trái cố định**
  - Dashboard
  - Products
  - Categories
  - Pages
  - Homepage Sections
  - Media Library
  - Site Settings
  - Users & Roles
  - Orders (ẩn hoặc bật sau)

- **Topbar**
  - Search global
  - Nút “Create new”
  - Notification
  - Account menu

- **Main content**
  - Breadcrumb
  - Page title
  - Action bar
  - Filter row
  - Table / cards / form detail

### Tablet

- Sidebar chuyển thành **collapsible drawer**
- Bảng dài chuyển sang card/table hybrid

### Mobile

- Bottom-safe layout
- Sidebar thành drawer
- Ưu tiên card list thay vì table quá rộng
- Sticky save bar dưới cùng cho form edit

## 5.3 Màu sắc và phong cách

Gợi ý phong cách:

- Nền sáng: `#F8FAFC`
- Card trắng
- Border nhẹ `slate-200`
- Accent xanh đậm hoặc xanh olive nhẹ để hợp chủ đề thực phẩm premium
- Font sạch: Inter / Geist / Plus Jakarta Sans
- Radius vừa phải: `12px–16px`
- Shadow mỏng, tránh quá “template”

## 5.4 Các màn admin cần có

### A. Dashboard

Hiển thị:

- Tổng số sản phẩm
- Tổng số danh mục
- Số trang nội dung
- Số ảnh media
- Sản phẩm mới cập nhật gần đây
- Quick actions

### B. Products

- List products
- Search theo tên/slug
- Filter theo category / active / featured
- Sort theo updated_at / created_at / order
- Bulk delete / bulk activate / bulk feature

### C. Product Editor

Tabs đề xuất:

- General
- Pricing & Variants
- Nutrition
- Benefits
- Images
- SEO
- Publish

### D. Categories

- CRUD danh mục
- Kéo thả thứ tự hiển thị
- Icon/ảnh đại diện danh mục nếu muốn

### E. Pages

- About page
- Homepage sections
- Footer content
- Contact info
- Legal pages nếu sau này cần

### F. Media Library

- Upload ảnh
- Gắn tag
- Xem ảnh nào đang được dùng ở đâu

### G. Site Settings

- Brand name
- Hotline
- Email
- Address
- Social links
- Default SEO
- Logo / favicon

### H. Users & Roles

- Admin
- Editor
- Viewer

---

## 6) Data model khuyến nghị

Bên dưới là mô hình đủ tốt để chạy web hiện tại và mở rộng sau này.

## 6.1 Bảng chính

### `categories`

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `products`

```sql
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  featured boolean not null default false,
  is_active boolean not null default true,
  hero_badge text,
  hero_cta_text text,
  hero_cta_link text,
  prep_time_minutes int,
  calories_per_default_serving int,
  cover_image_path text,
  seo_title text,
  seo_description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `product_variants`

Dùng cho các lựa chọn như `200G`, `500G`, `1KG`.

```sql
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  weight_grams int,
  sku text,
  price numeric(12,2),
  compare_at_price numeric(12,2),
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `product_nutrition`

```sql
create table public.product_nutrition (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  calories int,
  protein_g numeric(8,2),
  carbs_g numeric(8,2),
  fat_g numeric(8,2),
  fiber_g numeric(8,2),
  serving_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_variant_id)
);
```

### `product_benefits`

```sql
create table public.product_benefits (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
```

### `product_images`

```sql
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
```

### `pages`

Quản lý trang tĩnh như About.

```sql
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  page_type text not null default 'static',
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `page_sections`

Quản lý từng section trong trang chủ / about.

```sql
create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  title text,
  subtitle text,
  content jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `site_settings`

```sql
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

### `profiles`

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 6.2 Nếu sau này mở bán thật

Bổ sung:

- `orders`
- `order_items`
- `customers`
- `coupons`
- `reviews`

Hiện tại chưa bắt buộc.

---

## 7) Mapping website hiện tại → database

## 7.1 Menu điều hướng hiện tại

Website hiện có 3 mục chính: `Trang chủ`, `Thực đơn`, `Về chúng tôi`. Cách đúng là **không hardcode lâu dài** trong code, mà đưa vào cấu hình DB.

### Đề xuất bảng phụ: `navigation_items`

```sql
create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  location text not null, -- header / footer
  label text not null,
  href text not null,
  target text default '_self',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Seed gợi ý

- `header`: Trang chủ → `/`
- `header`: Thực đơn → `/menu`
- `header`: Về chúng tôi → `/about`
- `footer`: Trang chủ → `/`
- `footer`: Thực đơn → `/menu`
- `footer`: Về chúng tôi → `/about`

Nguồn menu hiện tại:

## 7.2 Danh mục hiện tại

Các danh mục hiện thấy:

- Gà
- Bò
- Heo
- Hải sản
- Gia vị

Map thẳng vào bảng `categories`. Nguồn:

## 7.3 Sản phẩm hiện tại

Trang menu hiện có ít nhất các sản phẩm:

- Ức Gà Ướp
- Bò Thượng Hạng
- Sườn Nướng BBQ
- Cá Hồi Cam
- Gà Ướp Tỏi Thảo Mộc
- Bò Wagyu
- Heo Mật Ong
- Tôm Teriyaki
- Hỗn Hợp Gia Vị Đặc Biệt
- Gia Vị Paprika Hun Khói

Map vào bảng `products`, kèm `product_variants`, `product_nutrition`, `product_images`, `product_benefits`. Nguồn:

## 7.4 About page hiện tại

Map như sau:

- `pages.slug = about`
- Các section:
  - mission
  - ingredients
  - nutrition
  - sustainability
  - convenience

Dùng `page_sections.content` dạng JSONB để linh hoạt. Nguồn:

## 7.5 Footer hiện tại

Đưa vào `site_settings` hoặc `navigation_items` + `site_settings`:

- `contact.phone`
- `contact.email`
- `contact.address`
- `brand.name`
- `brand.tagline`

Nguồn:

---

## 8) Supabase mapping chi tiết

## 8.1 Service mapping

### Postgres

Dùng cho:

- categories
- products
- product_variants
- product_nutrition
- product_benefits
- product_images metadata
- pages
- page_sections
- navigation_items
- site_settings
- profiles

Supabase docs xác nhận mỗi project là một Postgres database đầy đủ, có table view, SQL editor và backup managed.

### Auth

Dùng cho:

- Đăng nhập admin
- Role-based access
- Session và JWT
- Kết nối RLS với dữ liệu app

Supabase Auth hỗ trợ nhiều phương thức đăng nhập, dùng JWT và tích hợp RLS để kiểm soát truy cập dữ liệu theo hàng.

### Storage

Dùng cho:

- Ảnh sản phẩm
- Banner trang chủ
- Ảnh section About
- Logo / favicon
- OpenGraph images nếu cần

Supabase Storage hỗ trợ bucket, access control, CDN, image optimization và RLS-based permissions. Bucket có public/private model, private là mặc định.

### Data API

Dùng cho:

- CRUD admin nhanh
- Tạo list/filter/sort từ frontend admin
- Không cần dựng custom CRUD API cho hầu hết bảng

Supabase auto-generate REST API trực tiếp từ schema DB và API này phản ánh ngay khi schema thay đổi.

### Edge Functions

Dùng khi cần:

- Revalidate cache frontend
- Resize/optimize image workflow đặc biệt
- Webhook đồng bộ
- Import/export phức tạp
- AI enrichment nội dung

---

## 9) Bucket strategy cho media

Khuyến nghị tạo các bucket sau:

### `product-images`

- Ảnh cover sản phẩm
- Ảnh gallery sản phẩm

### `page-media`

- Hero banner
- About images
- CTA background

### `brand-assets`

- Logo
- Favicon
- OpenGraph images

## Access model khuyến nghị

- `brand-assets`: public
- `product-images`: public
- `page-media`: public hoặc private + signed URL nếu bạn muốn kiểm soát chặt

Supabase bucket có 2 access model là public và private; private bucket mặc định cần RLS hoặc signed URL để tải file.

---

## 10) Role & permission model

## 10.1 Vai trò

### `admin`

- Full CRUD mọi bảng
- Quản lý user
- Quản lý settings
- Quản lý media

### `editor`

- CRUD products, pages, media
- Không được quản lý users
- Không được đổi cấu hình hệ thống nhạy cảm

### `viewer`

- Chỉ xem dashboard và preview content

## 10.2 Cách triển khai

Dùng:

- `auth.users`
- bảng `profiles` chứa `role`
- RLS policy dựa trên role

Ví dụ helper function:

```sql
create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;
```

Ví dụ policy đọc:

```sql
alter table public.products enable row level security;

create policy "products readable by authenticated users"
on public.products
for select
using (auth.uid() is not null);
```

Ví dụ policy ghi cho admin/editor:

```sql
create policy "products writable by admin or editor"
on public.products
for all
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));
```

Supabase docs nhấn mạnh RLS là lớp bảo vệ quan trọng, kết hợp với Auth/JWT để kiểm soát dữ liệu end-to-end.

---

## 11) MCP mapping cho Supabase

Đây là phần quan trọng để vibe coding hiệu quả.

## 11.1 MCP là gì trong ngữ cảnh này?

Supabase có tài liệu chính thức cho **Model Context Protocol (MCP)**, mô tả đây là chuẩn để kết nối AI tools với Supabase để AI assistant có thể tương tác với project của bạn.

Supabase docs cũng có hướng dẫn:

- dùng MCP với Supabase hosted
- build MCP server riêng bằng Edge Functions + `mcp-lite`
- dùng Supabase Auth OAuth 2.1 để xác thực AI agents với user hiện có của bạn

## 11.2 MCP strategy khuyến nghị cho dự án này

### Giai đoạn 1: dùng Supabase hosted MCP để hỗ trợ phát triển

Khuyến nghị:

- Kết nối Codex/Cursor/Claude với **Supabase MCP** ở môi trường dev/staging
- Bật **project-scoped access**
- Ưu tiên **read-only** nếu đang cho AI phân tích schema, generate types, đề xuất migrations
- Chỉ dùng full write access khi bạn thật sự cần cho AI apply migration trực tiếp

Supabase docs cho hosted MCP hiển thị có thể scope vào project, có option read-only, và server URL mặc định là `https://mcp.supabase.com/mcp`.

### Giai đoạn 2: nếu cần AI tool riêng cho nội bộ

Bạn có thể build **MCP server riêng** trên Supabase Edge Functions bằng `mcp-lite`. Cách này phù hợp khi muốn cho AI gọi tool custom như:

- publish homepage
- revalidate page cache
- duplicate product
- bulk import products CSV
- generate nutrition summary
- sync images alt text

Supabase docs cho biết `mcp-lite` chạy được trên Supabase Edge Functions và có lợi thế zero cold starts, global distribution, direct database access, type safety.

## 11.3 MCP mapping thực tế cho project MealFit

### AI nên được phép đọc những gì

- Schema các bảng
- Quan hệ giữa categories / products / variants / pages
- RLS policies
- Storage buckets structure
- SQL migrations
- Type definitions

### AI chỉ nên ghi những gì trong dev/staging

- Tạo migration
- Seed dữ liệu giả
- Tạo view / function
- Sửa RLS policies sau khi bạn review

### AI không nên được phép ghi trực tiếp ở production

- Drop table
- Delete hàng loạt
- Rewrite policy không kiểm soát
- Ghi đè storage objects hàng loạt

## 11.4 MCP auth mapping

Supabase docs về MCP Authentication nói bạn có thể tận dụng Supabase Auth OAuth 2.1 để AI agents xác thực bằng user base hiện có, auto discovery, dynamic client registration, và quan trọng là **RLS hiện có vẫn áp dụng cho MCP clients**.

### Ý nghĩa thực tế

Nếu sau này bạn có AI admin assistant nội bộ, bạn không cần làm auth riêng. AI agent có thể hoạt động theo đúng quyền của user đăng nhập.

Ví dụ:

- Admin hỏi AI: “Tạo thêm danh mục Hải sản cao cấp” → AI được phép vì user là admin
- Editor hỏi AI: “Xoá user khác” → AI bị chặn vì RLS / permission không cho phép

## 11.5 Khuyến nghị môi trường MCP

### Development

- MCP: full access có kiểm soát
- Seed data giả
- Allow migration assist

### Staging

- MCP: read-only hoặc limited write
- Cho AI review schema, policy, performance, content consistency

### Production

- MCP: read-only là mặc định
- Mọi migration phải qua CI/CD hoặc manual review

### Self-hosted cảnh báo

Supabase docs nói self-hosted MCP server hiện không nên expose ra Internet và cần bảo vệ bằng VPN hoặc SSH tunnel.

---

## 12) Frontend implementation plan

## 12.1 Tech stack khuyến nghị

- Next.js 14+
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Table
- TanStack Query
- Supabase JS client

## 12.2 Folder structure đề xuất

```txt
src/
  app/
    (public)/
      page.tsx
      menu/page.tsx
      about/page.tsx
    (admin)/
      admin/
        layout.tsx
        page.tsx
        products/page.tsx
        products/new/page.tsx
        products/[id]/page.tsx
        categories/page.tsx
        pages/page.tsx
        media/page.tsx
        settings/page.tsx
  components/
    admin/
      sidebar.tsx
      topbar.tsx
      page-header.tsx
      data-table.tsx
      status-badge.tsx
    products/
      product-form.tsx
      product-variants-form.tsx
      nutrition-form.tsx
      media-picker.tsx
    cms/
      page-section-editor.tsx
  lib/
    supabase/
      client.ts
      server.ts
      queries.ts
    auth/
      guards.ts
    utils/
  types/
    database.ts
    cms.ts
    product.ts
```

## 12.3 UI component checklist

- `AdminShell`
- `SidebarNav`
- `CommandSearch`
- `EntityTable`
- `EntityFilters`
- `ConfirmDeleteDialog`
- `RichTextEditor`
- `ImageUploader`
- `SortableList`
- `VariantRepeater`
- `SeoFields`
- `PublishPanel`

---

## 13) Query model khuyến nghị

## 13.1 Public site

Public site chỉ cần đọc dữ liệu đã publish:

- categories active
- products active
- featured product cho homepage
- about page sections active
- footer/header items active
- site settings

## 13.2 Admin

Admin cần:

- list đầy đủ có filter/sort/pagination
- edit by id
- optimistic update cẩn trọng
- invalidate query sau save

## 13.3 Có cần Prisma không?

Cho dự án này, **không bắt buộc**.

Bạn có thể đi thẳng với `supabase-js` vì:

- CRUD đơn giản
- API auto-generated từ schema đã đủ mạnh
- ít lớp trừu tượng hơn, hợp vibe coding hơn

Chỉ dùng Prisma nếu:

- bạn muốn backend Node riêng
- cần transaction phức tạp ở server nhiều
- team quen Prisma hơn Supabase query style

---

## 14) Seed dữ liệu khởi tạo

## 14.1 Categories seed

- gà
- bò
- heo
- hải-sản
- gia-vị

## 14.2 Pages seed

- `/about`
- `/homepage`

## 14.3 Site settings seed

```json
{
  "brand": {
    "name": "Meal Prep",
    "tagline": "Thực phẩm chế biến sẵn cao cấp, tẩm ướp hoàn hảo cho lối sống năng động của bạn."
  },
  "contact": {
    "phone": "+84 123 456 789",
    "email": "hello@mealfit.vn",
    "address": "TP. Hồ Chí Minh, Việt Nam"
  }
}
```

Nguồn text hiện tại:

---

## 15) Nội dung cần CMS hóa ngay

## Priority 1

- Navigation header/footer
- Categories
- Product list
- Product detail
- About page sections
- Contact info
- Brand settings
- Product images

## Priority 2

- Homepage hero
- Homepage featured product
- CTA sections
- SEO title/meta description từng trang
- Social links

## Priority 3

- Localization VI/EN
- Reviews/testimonials
- Blog/news
- Promo banners

---

## 16) Responsive behavior chi tiết

## Desktop ≥ 1280px

- Sidebar cố định 260px
- Main content max width lớn
- Table full

## Laptop 1024–1279px

- Sidebar 220px
- Form chia 2 cột

## Tablet 768–1023px

- Sidebar drawer
- Table giảm cột
- Filter bar wrap

## Mobile < 768px

- Card list
- Sticky save bar
- Action menu dạng sheet
- Image picker full width

---

## 17) Bảo mật tối thiểu bắt buộc

- Bật RLS cho mọi bảng public app data
- Không dùng service role key ở client
- Chỉ dùng anon key ở frontend
- Service role chỉ dùng ở server actions / edge functions / CI kín
- Bucket private nếu không cần public
- Review policies trước khi mở production

Supabase docs cho biết API, Auth và Storage đều gắn với RLS / security policy, nên thiết kế quyền đúng ngay từ đầu là rất quan trọng.

---

## 18) Prompt mẫu cho Codex / Cursor

### Prompt 1 – dựng admin shell

```md
Hãy tạo admin shell cho Next.js App Router dùng TypeScript, Tailwind và shadcn/ui.
Yêu cầu:
- route prefix /admin
- layout responsive
- sidebar bên trái, topbar phía trên
- các menu: Dashboard, Products, Categories, Pages, Media, Settings, Users
- desktop sidebar fixed, mobile dùng drawer
- code sạch, tách component rõ ràng
- không dùng mock data cứng trong component, chuẩn bị sẵn interface/types
```

### Prompt 2 – dựng products CRUD với Supabase

```md
Hãy triển khai module Products cho admin dùng supabase-js.
Yêu cầu:
- trang list /admin/products có search, filter category, filter active, sort updated_at desc
- trang create /admin/products/new
- trang edit /admin/products/[id]
- bảng dữ liệu products, categories, product_variants, product_nutrition, product_images, product_benefits theo schema đã mô tả
- dùng React Hook Form + Zod
- có component VariantRepeater cho 200G/500G/1KG
- có upload ảnh lên bucket product-images
- có nút save draft / publish
- viết code production-oriented, chia nhỏ component
```

### Prompt 3 – CMS hóa About page

```md
Hãy triển khai module Pages + Page Sections để quản lý trang About.
Yêu cầu:
- bảng pages và page_sections từ Supabase
- page_sections.content dùng JSONB
- UI editor cho nhiều section với sort_order
- hỗ trợ bật/tắt section
- preview nội dung trước khi publish
- route /admin/pages và /admin/pages/[id]
```

### Prompt 4 – guard phân quyền

```md
Hãy tạo auth guard cho /admin dùng Supabase Auth.
Yêu cầu:
- chỉ user authenticated mới vào /admin
- role nằm ở bảng profiles.role
- admin được full access
- editor chỉ sửa products/pages/media
- viewer chỉ được xem
- viết helper currentUserRole và guard component/server util rõ ràng
```

---

## 19) Roadmap triển khai thực tế

## Phase 1 – Foundation

- Tạo Supabase project
- Tạo schema bảng cốt lõi
- Tạo bucket media
- Tạo auth + profiles + roles
- Bật RLS
- Dựng admin shell

## Phase 2 – Core CMS

- Products CRUD
- Categories CRUD
- Pages CRUD
- Homepage/About sections
- Site settings

## Phase 3 – Polishing

- SEO fields
- Media library tốt hơn
- Slug auto generation
- Reorder drag-drop
- Preview & publish flow

## Phase 4 – AI workflow

- Kết nối Supabase MCP ở dev/staging
- Cho AI đọc schema và hỗ trợ migration
- Tạo custom MCP tools nếu cần bulk import / publish / revalidate

---

## 20) Đề xuất cuối cùng

### Nên làm ngay

- Dùng **Supabase + PostgreSQL**
- Dùng **Supabase Auth** cho admin login
- Dùng **Supabase Storage** cho ảnh
- Dùng **RLS** cho role-based access
- Dùng **Supabase MCP** ở dev/staging để hỗ trợ vibe coding
- Dùng admin route trong cùng repo Next.js hiện tại

### Không nên làm ngay

- Dựng backend riêng phức tạp từ đầu
- Tách microservices
- Dùng nhiều nguồn dữ liệu song song
- Cho AI write thẳng vào production database

---

## 21) Nguồn tham khảo

- Website MealFit hiện tại: trang chủ, menu, about
- Supabase Database overview
- Supabase Data REST API
- Supabase Auth
- Supabase Row Level Security
- Supabase Storage + access control + buckets
- Supabase MCP docs


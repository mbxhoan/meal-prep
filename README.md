# MealFit Ops

MealFit Ops là nền tảng vận hành cho mô hình Meal Prep, xây bằng Next.js App Router + Supabase. Ứng dụng kết hợp storefront công khai và khu quản trị nội bộ để quản lý thực đơn, đơn hàng, tồn kho, giá vốn, báo cáo và phân quyền.

## Tính Năng Chính

- Giao diện công khai: trang chủ 3D với carousel sản phẩm, trang thực đơn, trang chi tiết sản phẩm, trang giới thiệu, chuyển ngôn ngữ Việt / Anh, và layout responsive cho desktop / tablet / mobile.
- Khu quản trị: dashboard tổng quan, danh mục nền tảng, quản lý thực đơn, tồn kho, đơn hàng, báo cáo và phân quyền.
- Tồn kho: theo dõi mặt hàng, lô, hạn sử dụng, FEFO, phiếu nhập, phiếu xuất, điều chỉnh kho và sổ giao dịch.
- Đơn hàng: tạo đơn, snapshot giá bán và giá vốn, bill chốt đơn, trạng thái đơn, thanh toán và lịch sử thay đổi trạng thái.
- Báo cáo và xuất dữ liệu: xuất Excel cho danh sách và báo cáo ngay trên giao diện.
- An toàn nghiệp vụ: RBAC, audit log, soft delete / status-driven flow, và nguyên tắc snapshot để lịch sử không tự đổi theo master hiện tại.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth + Supabase PostgreSQL
- Three.js, React Three Fiber, Drei
- GSAP
- react-icons
- Vercel Analytics và Speed Insights

## Cấu Trúc Dự Án

```text
src/
  app/                 Routes public và admin
  config/              Content, translations, product data
  features/
    admin/             UI và logic cho khu quản trị
    inventory/         Tồn kho, phiếu nhập/xuất, FEFO
    master-data/       Danh mục nền tảng
    sales/             Hóa đơn, snapshot giá, thanh toán
    navigation/        Header / menu công khai
    product-showcase/  Trang chủ và chi tiết sản phẩm
    carousel/          3D carousel
    ice-cubes/         Hiệu ứng trang chủ
  lib/                 Service, actions, validation, types
  shared/              Context, hooks, component dùng chung
supabase/              Migrations và seed
docs/development/      Tài liệu nghiệp vụ và SOP
```

## Chạy Dự Án

1. Cài dependencies.

```bash
yarn install
```

2. Tạo file `.env.local` từ mẫu.

```bash
cp docs/init/05_env_example.txt .env.local
```

3. Điền biến môi trường Supabase.

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
# hoặc NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=YOUR_SUPABASE_KEY
```

4. Áp dụng schema / migrations trong `supabase/migrations/` vào project Supabase của bạn. Nếu muốn dữ liệu mẫu, nạp thêm `supabase/seed.sql`.
5. Chạy ứng dụng.

```bash
yarn dev
```

6. Mở trình duyệt tại `http://localhost:3000` cho storefront công khai và `http://localhost:3000/admin/login` cho khu quản trị.

## Script Hữu Ích

- `yarn dev`
- `yarn build`
- `yarn start`
- `yarn lint`

## Route Chính

- `/` - trang chủ công khai
- `/menu` - danh sách thực đơn
- `/product/[slug]` - trang chi tiết sản phẩm
- `/about` - giới thiệu
- `/admin` - dashboard quản trị
- `/admin/master-data` - danh mục nền tảng
- `/admin/menu` - quản lý thực đơn
- `/admin/inventory` - tồn kho
- `/admin/orders` - danh sách đơn hàng
- `/admin/orders/new` - tạo đơn mới
- `/admin/analytics` - báo cáo
- `/admin/settings/roles` - phân quyền

## Tài Liệu Nghiệp Vụ

- `docs/development/README.md`
- `docs/development/PRODUCT_SCOPE.md`
- `docs/development/BUSINESS_RULES.md`
- `docs/development/ORDER_PRICING_COST_RULES.md`
- `docs/development/INVENTORY_FEFO_RULES.md`
- `docs/development/SCHEMA_SPEC.md`
- `docs/development/RBAC.md`

## Ghi Chú

- Nếu Supabase chưa được cấu hình, khu quản trị sẽ chuyển sang chế độ demo để bạn xem giao diện và luồng thao tác.
- Giao diện công khai hỗ trợ chuyển ngôn ngữ Việt / Anh qua thanh điều hướng.

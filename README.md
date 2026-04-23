# MealFit Sales Admin

Bộ starter repo này dành cho phần mềm nội bộ MealFit, tập trung đúng phạm vi đã chốt:

- quản lý danh mục món
- quản lý biến thể trọng lượng + giá vốn + giá bán
- quản lý combo
- quản lý khách hàng
- quản lý nhân viên bán
- quản lý đơn hàng
- in bill
- import Excel master data đầu kỳ

Repo được thiết kế để **mở ra là có thể chạy UI ngay**, kể cả khi chưa nối Supabase. Khi chưa có database, app sẽ dùng **demo fallback data** để bạn xem giao diện và luồng màn hình. Khi có đủ biến môi trường và đã migrate DB, app sẽ đọc dữ liệu thật.

## Stack

- Next.js App Router
- React
- Supabase Postgres
- Excel import bằng `xlsx`
- Validation bằng `zod`

## Yêu cầu môi trường

Next.js hiện yêu cầu tối thiểu Node.js 20.9 cho quá trình cài đặt/chạy local. App Router là kiến trúc router mặc định phù hợp cho repo này. Supabase hiện khuyến nghị dùng `@supabase/ssr` cùng `@supabase/supabase-js`, và không dùng song song với bộ auth helpers cũ. citeturn574478search0turn574478search3turn574478search4turn503869search0turn198176search17

## Khởi động nhanh

```bash
cp .env.example .env.local
npm install
npm run dev
```

Mở `http://localhost:3000`

## Nếu muốn chạy với Supabase thật

### 1) Tạo project Supabase
Lấy các biến:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2) Chạy migration
Copy file trong:
- `supabase/migrations/0001_init.sql`

vào SQL Editor hoặc dùng Supabase CLI.

Supabase hỗ trợ workflow local/dev bằng CLI + Docker, và có tài liệu chính thức cho local development cũng như generate type. citeturn574478search13turn574478search7

### 3) Seed dữ liệu mẫu
Chạy:
- `supabase/seed.sql`

### 4) Import master data bằng Excel
Có 2 cách:

#### Cách A — qua giao diện web
Vào:
- `/imports/master-data`

Tải file `.xlsx` theo template.

#### Cách B — qua CLI
```bash
npm run import:master -- /absolute/path/to/mealfit_import_template.xlsx
```

## Cấu trúc thư mục

```text
app/
  api/
  combos/
  customers/
  employees/
  imports/master-data/
  orders/
  products/
components/
docs/
lib/
resources/
scripts/
supabase/
AGENTS.md
```

## Thứ tự import master data

```text
product_categories
-> products
-> product_variants
-> combos
-> combo_items
-> customers
-> employees
```

## Các sheet Excel được hỗ trợ

- `product_categories`
- `products`
- `product_variants`
- `combos`
- `combo_items`
- `customers`
- `employees`

## Đường dẫn tài liệu nên đọc trước

- `AGENTS.md`
- `docs/01-repo-architecture.md`
- `docs/03-import-flow.md`
- `docs/06-codex-prompts.md`

## Ghi chú triển khai thật

Bản starter này ưu tiên:
- cấu trúc repo rõ
- import dữ liệu đầu kỳ tốt
- UI quản trị gọn, dễ vận hành
- tránh phụ thuộc thư viện UI nặng

Khi đưa vào production, nên làm tiếp:
- auth + role chi tiết
- audit log
- soft delete chuẩn
- bill PDF chuẩn mẫu thương hiệu
- test coverage cho import và order calculations

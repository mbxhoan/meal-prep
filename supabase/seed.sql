-- MealFit local/dev seed
-- Seed accounts:
-- 1. sysadmin@mealfit.vn / Mealfit@123!
-- 2. admin@mealfit.vn    / Mealfit@123!
-- 3. staff@mealfit.vn    / Mealfit@123!

-- -----------------------------------------------------------------------------
-- Auth users + profiles
-- -----------------------------------------------------------------------------
with seed_accounts as (
  select *
  from (
    values
      (
        '90000000-0000-0000-0000-000000000001'::uuid,
        'sysadmin@mealfit.vn'::text,
        'MealFit System Admin'::text,
        'system_admin'::text
      ),
      (
        '90000000-0000-0000-0000-000000000002'::uuid,
        'admin@mealfit.vn'::text,
        'MealFit Shop Owner'::text,
        'shop_owner'::text
      ),
      (
        '90000000-0000-0000-0000-000000000003'::uuid,
        'staff@mealfit.vn'::text,
        'MealFit Staff'::text,
        'staff'::text
      )
  ) as t(id, email, full_name, app_role)
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  email_change_token_current,
  email_change_confirm_status,
  is_sso_user,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  sa.id,
  'authenticated',
  'authenticated',
  sa.email,
  extensions.crypt('Mealfit@123!', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object('full_name', sa.full_name),
  false,
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  0,
  false,
  false
from seed_accounts sa
on conflict (id) do update
set instance_id = excluded.instance_id,
    aud = excluded.aud,
    role = excluded.role,
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    recovery_sent_at = excluded.recovery_sent_at,
    last_sign_in_at = excluded.last_sign_in_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    is_super_admin = excluded.is_super_admin,
    updated_at = now(),
    confirmation_token = excluded.confirmation_token,
    email_change = excluded.email_change,
    email_change_token_new = excluded.email_change_token_new,
    recovery_token = excluded.recovery_token,
    email_change_token_current = excluded.email_change_token_current,
    email_change_confirm_status = excluded.email_change_confirm_status,
    is_sso_user = excluded.is_sso_user,
    is_anonymous = excluded.is_anonymous;

with seed_accounts as (
  select *
  from (
    values
      (
        '90000000-0000-0000-0000-000000000001'::uuid,
        'sysadmin@mealfit.vn'::text,
        'MealFit System Admin'::text,
        'system_admin'::text
      ),
      (
        '90000000-0000-0000-0000-000000000002'::uuid,
        'admin@mealfit.vn'::text,
        'MealFit Shop Owner'::text,
        'shop_owner'::text
      ),
      (
        '90000000-0000-0000-0000-000000000003'::uuid,
        'staff@mealfit.vn'::text,
        'MealFit Staff'::text,
        'staff'::text
      )
  ) as t(id, email, full_name, app_role)
)
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  sa.id,
  sa.id,
  jsonb_build_object(
    'sub',
    sa.id::text,
    'email',
    sa.email,
    'email_verified',
    true,
    'phone_verified',
    false
  ),
  'email',
  sa.email,
  now(),
  now(),
  now()
from seed_accounts sa
on conflict (id) do update
set identity_data = excluded.identity_data,
    provider = excluded.provider,
    provider_id = excluded.provider_id,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();

with seed_accounts as (
  select *
  from (
    values
      (
        '90000000-0000-0000-0000-000000000001'::uuid,
        'sysadmin@mealfit.vn'::text,
        'MealFit System Admin'::text,
        'system_admin'::text
      ),
      (
        '90000000-0000-0000-0000-000000000002'::uuid,
        'admin@mealfit.vn'::text,
        'MealFit Shop Owner'::text,
        'shop_owner'::text
      ),
      (
        '90000000-0000-0000-0000-000000000003'::uuid,
        'staff@mealfit.vn'::text,
        'MealFit Staff'::text,
        'staff'::text
      )
  ) as t(id, email, full_name, app_role)
)
insert into public.profiles (id, email, full_name, role)
select
  sa.id,
  sa.email,
  sa.full_name,
  sa.app_role
from seed_accounts sa
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;

-- -----------------------------------------------------------------------------
-- Menus
-- -----------------------------------------------------------------------------
insert into public.navigation_menus (id, name, location, description)
values
  ('11111111-1111-1111-1111-111111111111', 'Main Header', 'header-main', 'Main header navigation'),
  ('22222222-2222-2222-2222-222222222222', 'Footer Main', 'footer-main', 'Footer quick links')
on conflict (id) do update
set name = excluded.name,
    location = excluded.location,
    description = excluded.description;

insert into public.navigation_items (id, menu_id, label, href, page_slug, sort_order, is_visible)
values
  ('21111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Trang chủ', '/', 'home', 1, true),
  ('21111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Thực đơn', '/menu', 'menu', 2, true),
  ('21111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Về chúng tôi', '/about', 'about', 3, true),
  ('22222222-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Trang chủ', '/', 'home', 1, true),
  ('22222222-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'Thực đơn', '/menu', 'menu', 2, true),
  ('22222222-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222222', 'Về chúng tôi', '/about', 'about', 3, true)
on conflict (id) do update
set menu_id = excluded.menu_id,
    label = excluded.label,
    href = excluded.href,
    page_slug = excluded.page_slug,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible;

-- -----------------------------------------------------------------------------
-- Site settings
-- -----------------------------------------------------------------------------
insert into public.site_settings (key, value_json, is_public, description)
values
  ('brand', '{"name":"MEAL FIT","tagline":"Meal prep premium với cost profile và quản trị vận hành tập trung."}', true, 'Brand identity'),
  ('contact', '{"phone":"+84 123 456 789","email":"hello@mealfit.vn","address":"TP. Hồ Chí Minh, Việt Nam"}', true, 'Public contact info'),
  ('hero', '{"featured_product_slug":"marinated-chicken","cta_label":"Đặt Hàng Ngay","scroll_label":"Cuộn Xuống"}', true, 'Homepage hero settings'),
  ('seo_defaults', '{"title":"MealFit - Premium Meal Prep Selection","description":"Premium meal prep products for a healthy, active lifestyle."}', true, 'Default SEO')
on conflict (key) do update
set value_json = excluded.value_json,
    is_public = excluded.is_public,
    description = excluded.description;

-- -----------------------------------------------------------------------------
-- Pages
-- -----------------------------------------------------------------------------
insert into public.pages (id, slug, title, excerpt, meta_title, meta_description, is_published)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'home', 'Trang chủ', 'Homepage', 'MealFit - Premium Meal Prep Selection', 'Premium meal prep products for a healthy, active lifestyle.', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'menu', 'Thực đơn', 'Full menu', 'Thực Đơn | MealFit', 'Khám phá bộ sưu tập đầy đủ các sản phẩm meal prep cao cấp của chúng tôi', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'about', 'Về chúng tôi', 'About us', 'Về Chúng Tôi | MealFit', 'Từ Bếp Của Chúng Tôi Đến Bàn Ăn Của Bạn', true)
on conflict (id) do update
set slug = excluded.slug,
    title = excluded.title,
    excerpt = excluded.excerpt,
    meta_title = excluded.meta_title,
    meta_description = excluded.meta_description,
    is_published = excluded.is_published;

insert into public.page_sections (id, page_id, section_key, section_type, title, subtitle, body, image_url, button_label, button_href, sort_order, data_json)
values
  ('1aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'hero', 'hero', 'Ức Gà Ướp Signature', 'Premium Meal Prep', 'Thưởng thức phần thịt được tẩm ướp hoàn hảo, dồi dào protein và hương vị hảo hạng. Dành cho những người sành ăn muốn tối đa hoá hương vị mà không tốn công chuẩn bị.', '/assets/products/chicken_nobg.png', 'Đặt Hàng Ngay', '/menu', 1, '{"variant_labels":["500 G","200 G","1 KG"]}'),
  ('1bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'menu-intro', 'content', 'Thực Đơn', null, 'Khám phá bộ sưu tập đầy đủ các sản phẩm meal prep cao cấp của chúng tôi', null, null, null, 1, '{}'),
  ('1ccccccc-cccc-cccc-cccc-ccccccccccc1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'about-hero', 'content', 'Từ Bếp Của Chúng Tôi Đến Bàn Ăn Của Bạn', null, 'Tại MealFit, chúng tôi tin rằng ăn uống lành mạnh không có nghĩa là phải hy sinh hương vị hay dành hàng giờ trong bếp.', null, null, null, 1, '{}'),
  ('1ccccccc-cccc-cccc-cccc-ccccccccccc2', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'mission', 'content', 'Sứ Mệnh', null, 'Cách mạng hóa cách mọi người ăn uống bằng cách cung cấp thịt ướp sẵn chất lượng nhà hàng, sẵn sàng nấu trong vài phút.', null, null, null, 2, '{}'),
  ('1ccccccc-cccc-cccc-cccc-ccccccccccc3', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ingredients', 'feature-grid', 'Nguyên Liệu Tươi', null, 'Chúng tôi sử dụng nguyên liệu cao cấp, trồng tại địa phương và không bao giờ dùng chất bảo quản nhân tạo.', null, null, null, 3, '{}'),
  ('1ccccccc-cccc-cccc-cccc-ccccccccccc4', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'nutrition', 'feature-grid', 'Cân Bằng Dinh Dưỡng', null, 'Mỗi sản phẩm được thiết kế cẩn thận để cung cấp lượng dinh dưỡng tối ưu.', null, null, null, 4, '{}'),
  ('1ccccccc-cccc-cccc-cccc-ccccccccccc5', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'sustainability', 'feature-grid', 'Không Lãng Phí', null, 'Bao bì của chúng tôi có thể tái chế 100% và chúng tôi giảm thiểu lãng phí thực phẩm trong chuỗi cung ứng.', null, null, null, 5, '{}'),
  ('1ccccccc-cccc-cccc-cccc-ccccccccccc6', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'convenience', 'feature-grid', 'Tiện Lợi', null, 'Từ tủ lạnh đến bàn ăn chỉ trong 15 phút. Meal prep không cần prep.', null, 'Thực Đơn →', '/menu', 6, '{}')
on conflict (id) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    body = excluded.body,
    image_url = excluded.image_url,
    button_label = excluded.button_label,
    button_href = excluded.button_href,
    sort_order = excluded.sort_order,
    data_json = excluded.data_json;

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------
insert into public.categories (id, name, slug, sort_order, is_active)
values
  ('c1000000-0000-0000-0000-000000000001', 'Gà', 'ga', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Bò', 'bo', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Heo', 'heo', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Hải sản', 'hai-san', 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'Gia vị', 'gia-vi', 5, true)
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------
insert into public.products (id, category_id, name, slug, short_description, description, main_image_url, is_featured, is_published, sort_order)
values
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Ức Gà Ướp Signature', 'marinated-chicken', 'Thịt gà tẩm ướp giàu protein.', 'Thưởng thức phần thịt được tẩm ướp hoàn hảo, dồi dào protein và hương vị hảo hạng. Dành cho những người sành ăn muốn tối đa hoá hương vị mà không tốn công chuẩn bị.', '/assets/products/chicken_nobg.png', true, true, 1),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Bò Thượng Hạng', 'prime-beef', 'Thịt bò premium mềm và đậm đà.', 'Lựa chọn cao cấp cho bữa ăn mạnh mẽ, giàu đạm, ít công chuẩn bị.', '/assets/products/beef_nobg.png', false, true, 2),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'Sườn Nướng BBQ', 'bbq-ribs', 'Sườn heo nướng BBQ vị đậm đà.', 'Phần sườn đậm vị sốt BBQ, phù hợp cho bữa tối nhanh chóng.', '/assets/products/ribs_nobg.png', false, true, 3),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'Cá Hồi Cam', 'orange-salmon', 'Cá hồi tươi vị cam thanh nhẹ.', 'Kết hợp vị béo của cá hồi với sốt cam tươi mới.', '/assets/products/salmon_nobg.png', false, true, 4),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'Gà Ướp Tỏi Thảo Mộc', 'garlic-herb-chicken', 'Gà ướp tỏi và thảo mộc thơm dịu.', 'Mềm, thơm, phù hợp cho bữa ăn hằng ngày ít dầu mỡ.', '/assets/products/chicken_nobg.png', false, true, 5),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'Bò Wagyu', 'wagyu-beef', 'Thịt bò wagyu cao cấp.', 'Lựa chọn đặc biệt cho người muốn trải nghiệm thịt bò mềm béo.', '/assets/products/beef_nobg.png', false, true, 6),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003', 'Heo Mật Ong', 'honey-pork', 'Thịt heo sốt mật ong cân bằng vị ngọt.', 'Lớp glaze mật ong hài hòa, dễ ăn và hợp khẩu vị đa số.', '/assets/products/ribs_nobg.png', false, true, 7),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', 'Tôm Teriyaki', 'teriyaki-shrimp', 'Tôm sốt teriyaki chuẩn vị.', 'Hải sản nhanh gọn, đậm vị, nhiều protein.', '/assets/products/shrimps1.jpg', false, true, 8),
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', 'Hỗn Hợp Gia Vị Đặc Biệt', 'special-spice-mix', 'Gia vị trộn sẵn độc quyền.', 'Hỗn hợp gia vị dùng để nâng tầm món nướng và áp chảo.', '/assets/products/spices_nobg.png', false, true, 9),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000005', 'Gia Vị Paprika Hun Khói', 'smoked-paprika', 'Paprika hun khói đậm đà.', 'Tăng chiều sâu hương vị cho các món thịt và rau củ.', '/assets/products/spices_nobg.png', false, true, 10)
on conflict (id) do update
set category_id = excluded.category_id,
    name = excluded.name,
    slug = excluded.slug,
    short_description = excluded.short_description,
    description = excluded.description,
    main_image_url = excluded.main_image_url,
    is_featured = excluded.is_featured,
    is_published = excluded.is_published,
    sort_order = excluded.sort_order;

insert into public.product_variants (
  id,
  product_id,
  label,
  weight_in_grams,
  price,
  compare_at_price,
  packaging_cost,
  labor_cost,
  overhead_cost,
  is_default,
  is_active,
  calories,
  protein,
  carbs,
  fat,
  fiber,
  sort_order
)
values
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', '200 G', 200, 79000, null, 2500, 6000, 3500, false, true, 330, 62.0, 0.0, 7.2, 0.0, 1),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', '500 G', 500, 159000, null, 2800, 8500, 4500, true, true, 825, 155.0, 0.0, 18.0, 0.0, 2),
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', '1 KG', 1000, 299000, null, 3500, 12000, 7000, false, true, 1650, 310.0, 0.0, 36.0, 0.0, 3),
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', '500 G', 500, 249000, null, 2800, 9500, 5000, true, true, 1250, 105.0, 0.0, 82.0, 0.0, 1),
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', '500 G', 500, 189000, null, 2600, 7800, 4200, true, true, 1450, 70.0, 18.0, 110.0, 0.0, 1),
  ('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000004', '500 G', 500, 269000, null, 2800, 8200, 4600, true, true, 1040, 100.0, 12.0, 68.0, 0.0, 1),
  ('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000005', '500 G', 500, 169000, null, 2700, 7800, 4200, true, true, 900, 148.0, 2.0, 20.0, 0.0, 1),
  ('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000006', '500 G', 500, 399000, null, 3000, 10500, 7000, true, true, 1650, 95.0, 0.0, 135.0, 0.0, 1),
  ('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000007', '500 G', 500, 159000, null, 2600, 7200, 3900, true, true, 1300, 90.0, 24.0, 88.0, 0.0, 1),
  ('e1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000008', '500 G', 500, 219000, null, 2800, 7900, 4300, true, true, 725, 120.0, 20.0, 14.0, 0.0, 1),
  ('e1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000009', '100 G', 100, 59000, null, 1200, 2000, 1000, true, true, 15, 0.2, 2.0, 0.2, 1.0, 1),
  ('e1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000010', '100 G', 100, 49000, null, 1200, 1800, 900, true, true, 20, 0.9, 4.0, 0.8, 2.0, 1)
on conflict (id) do update
set product_id = excluded.product_id,
    label = excluded.label,
    weight_in_grams = excluded.weight_in_grams,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    packaging_cost = excluded.packaging_cost,
    labor_cost = excluded.labor_cost,
    overhead_cost = excluded.overhead_cost,
    is_default = excluded.is_default,
    is_active = excluded.is_active,
    calories = excluded.calories,
    protein = excluded.protein,
    carbs = excluded.carbs,
    fat = excluded.fat,
    fiber = excluded.fiber,
    sort_order = excluded.sort_order;

insert into public.product_benefits (id, product_id, title, sort_order)
values
  ('b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Giàu Protein', 1),
  ('b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Ít Chất Béo', 2),
  ('b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'Hỗ Trợ Phục Hồi Cơ', 3),
  ('b1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'Bữa Ăn Nhanh Chóng', 4),
  ('b1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004', 'Giàu Omega 3', 1),
  ('b1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000008', 'Nhiều Protein', 1)
on conflict (id) do update
set product_id = excluded.product_id,
    title = excluded.title,
    sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Inventory
-- -----------------------------------------------------------------------------
insert into public.inventory_items (
  id,
  name,
  sku,
  unit,
  current_quantity,
  reorder_point,
  average_unit_cost,
  last_purchase_cost,
  supplier_name,
  notes,
  is_active
)
values
  ('f1000000-0000-0000-0000-000000000001', 'Ức gà tươi', 'INV-CHICKEN-BREAST', 'g', 20000, 5000, 92, 95, 'Fresh Poultry Co.', 'Nguyên liệu chính cho các menu gà.', true),
  ('f1000000-0000-0000-0000-000000000002', 'Thăn bò', 'INV-BEEF-SIRLOIN', 'g', 9000, 3000, 210, 218, 'Prime Cuts VN', 'Dùng cho bò áp chảo và wagyu.', true),
  ('f1000000-0000-0000-0000-000000000003', 'Sườn heo', 'INV-PORK-RIBS', 'g', 11000, 3500, 128, 132, 'Bếp Heo Việt', 'Nguyên liệu chính cho BBQ ribs.', true),
  ('f1000000-0000-0000-0000-000000000004', 'Phi lê cá hồi', 'INV-SALMON-FILLET', 'g', 8500, 2500, 245, 252, 'Nordic Seafood', 'Cá hồi premium.', true),
  ('f1000000-0000-0000-0000-000000000005', 'Tôm bóc vỏ', 'INV-SHRIMP-PEELED', 'g', 9500, 2200, 180, 185, 'Seafood Hub', 'Cho các món tôm.', true),
  ('f1000000-0000-0000-0000-000000000006', 'Sốt ướp signature', 'INV-SIGNATURE-MARINADE', 'g', 3200, 800, 38, 39, 'MealFit Internal Kitchen', 'Base sauce cho nhiều món.', true),
  ('f1000000-0000-0000-0000-000000000007', 'Sốt tỏi thảo mộc', 'INV-GARLIC-HERB-SAUCE', 'g', 2100, 600, 42, 43, 'MealFit Internal Kitchen', 'Cho gà thảo mộc.', true),
  ('f1000000-0000-0000-0000-000000000008', 'Sốt mật ong', 'INV-HONEY-GLAZE', 'g', 2400, 700, 36, 38, 'MealFit Internal Kitchen', 'Cho heo mật ong.', true),
  ('f1000000-0000-0000-0000-000000000009', 'Sốt teriyaki', 'INV-TERIYAKI-SAUCE', 'g', 2600, 700, 40, 42, 'MealFit Internal Kitchen', 'Cho tôm teriyaki.', true),
  ('f1000000-0000-0000-0000-000000000010', 'Gia vị signature blend', 'INV-SIGNATURE-SPICE', 'g', 1800, 500, 180, 185, 'Spice Lab', 'Cho spice mix 100g.', true),
  ('f1000000-0000-0000-0000-000000000011', 'Paprika hun khói', 'INV-SMOKED-PAPRIKA', 'g', 1400, 400, 160, 165, 'Spice Lab', 'Cho smoked paprika 100g.', true),
  ('f1000000-0000-0000-0000-000000000012', 'Túi hút chân không', 'INV-VACUUM-PACK', 'pcs', 300, 60, 2200, 2200, 'PackPro', 'Chi phí đóng gói tham chiếu.', true)
on conflict (id) do update
set name = excluded.name,
    sku = excluded.sku,
    unit = excluded.unit,
    current_quantity = excluded.current_quantity,
    reorder_point = excluded.reorder_point,
    average_unit_cost = excluded.average_unit_cost,
    last_purchase_cost = excluded.last_purchase_cost,
    supplier_name = excluded.supplier_name,
    notes = excluded.notes,
    is_active = excluded.is_active;

insert into public.recipe_components (id, variant_id, inventory_item_id, quantity_per_unit, wastage_pct)
values
  ('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 200, 4),
  ('a1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000006', 18, 2),
  ('a1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', 500, 4),
  ('a1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000006', 35, 2),
  ('a1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000001', 1000, 4),
  ('a1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000006', 65, 2),
  ('a1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000002', 500, 6),
  ('a1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000006', 22, 2),
  ('a1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000003', 500, 5),
  ('a1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000006', 28, 2),
  ('a1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000004', 500, 4),
  ('a1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000006', 24, 2),
  ('a1000000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000007', 'f1000000-0000-0000-0000-000000000001', 500, 4),
  ('a1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000007', 'f1000000-0000-0000-0000-000000000007', 30, 2),
  ('a1000000-0000-0000-0000-000000000015', 'e1000000-0000-0000-0000-000000000008', 'f1000000-0000-0000-0000-000000000002', 500, 7),
  ('a1000000-0000-0000-0000-000000000016', 'e1000000-0000-0000-0000-000000000008', 'f1000000-0000-0000-0000-000000000006', 18, 2),
  ('a1000000-0000-0000-0000-000000000017', 'e1000000-0000-0000-0000-000000000009', 'f1000000-0000-0000-0000-000000000003', 500, 5),
  ('a1000000-0000-0000-0000-000000000018', 'e1000000-0000-0000-0000-000000000009', 'f1000000-0000-0000-0000-000000000008', 32, 2),
  ('a1000000-0000-0000-0000-000000000019', 'e1000000-0000-0000-0000-000000000010', 'f1000000-0000-0000-0000-000000000005', 500, 3),
  ('a1000000-0000-0000-0000-000000000020', 'e1000000-0000-0000-0000-000000000010', 'f1000000-0000-0000-0000-000000000009', 28, 2),
  ('a1000000-0000-0000-0000-000000000021', 'e1000000-0000-0000-0000-000000000011', 'f1000000-0000-0000-0000-000000000010', 100, 1),
  ('a1000000-0000-0000-0000-000000000022', 'e1000000-0000-0000-0000-000000000012', 'f1000000-0000-0000-0000-000000000011', 100, 1)
on conflict (id) do update
set variant_id = excluded.variant_id,
    inventory_item_id = excluded.inventory_item_id,
    quantity_per_unit = excluded.quantity_per_unit,
    wastage_pct = excluded.wastage_pct;

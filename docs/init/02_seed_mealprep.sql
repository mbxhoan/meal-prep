-- MealFit Admin CMS - Seed Data
-- Run after 01_schema_supabase.sql

-- -----------------------------------------------------------------------------
-- Menus
-- -----------------------------------------------------------------------------
insert into public.navigation_menus (id, name, location, description)
values
  ('11111111-1111-1111-1111-111111111111', 'Main Header', 'header-main', 'Main header navigation'),
  ('22222222-2222-2222-2222-222222222222', 'Footer Main', 'footer-main', 'Footer quick links')
on conflict (id) do nothing;

insert into public.navigation_items (menu_id, label, href, page_slug, sort_order, is_visible)
values
  ('11111111-1111-1111-1111-111111111111', 'Trang chủ', '/', 'home', 1, true),
  ('11111111-1111-1111-1111-111111111111', 'Thực đơn', '/menu', 'menu', 2, true),
  ('11111111-1111-1111-1111-111111111111', 'Về chúng tôi', '/about', 'about', 3, true),
  ('22222222-2222-2222-2222-222222222222', 'Trang chủ', '/', 'home', 1, true),
  ('22222222-2222-2222-2222-222222222222', 'Thực đơn', '/menu', 'menu', 2, true),
  ('22222222-2222-2222-2222-222222222222', 'Về chúng tôi', '/about', 'about', 3, true);

-- -----------------------------------------------------------------------------
-- Site settings
-- -----------------------------------------------------------------------------
insert into public.site_settings (key, value_json, is_public, description)
values
  ('brand', '{"name":"MEAL FIT","tagline":"Thực phẩm chế biến sẵn cao cấp, tẩm ướp hoàn hảo cho lối sống năng động của bạn."}', true, 'Brand identity'),
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
on conflict (id) do nothing;

insert into public.page_sections (page_id, section_key, section_type, title, subtitle, body, image_url, button_label, button_href, sort_order, data_json)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'hero', 'hero', 'Ức Gà Ướp', 'Premium Meal Prep', 'Thưởng thức phần thịt được tẩm ướp hoàn hảo, dồi dào protein và hương vị hảo hạng. Dành cho những người sành ăn muốn tối đa hoá hương vị mà không tốn công chuẩn bị.', '/images/demo/hero-marinated-chicken.png', 'Đặt Hàng Ngay', '/menu', 1, '{"variant_labels":["500 G","200 G","1 KG"]}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'menu-intro', 'content', 'Thực Đơn', null, 'Khám phá bộ sưu tập đầy đủ các sản phẩm meal prep cao cấp của chúng tôi', null, null, null, 1, '{}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'about-hero', 'content', 'Từ Bếp Của Chúng Tôi Đến Bàn Ăn Của Bạn', null, 'Tại Meal Prep, chúng tôi tin rằng ăn uống lành mạnh không có nghĩa là phải hy sinh hương vị hay dành hàng giờ trong bếp.', null, null, null, 1, '{}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'mission', 'content', 'Sứ Mệnh', null, 'Cách mạng hóa cách mọi người ăn uống bằng cách cung cấp thịt ướp sẵn chất lượng nhà hàng, sẵn sàng nấu trong vài phút.', null, null, null, 2, '{}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ingredients', 'feature-grid', 'Nguyên Liệu Tươi', null, 'Chúng tôi sử dụng nguyên liệu cao cấp, trồng tại địa phương và không bao giờ dùng chất bảo quản nhân tạo.', null, null, null, 3, '{}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'nutrition', 'feature-grid', 'Cân Bằng Dinh Dưỡng', null, 'Mỗi sản phẩm được thiết kế cẩn thận để cung cấp lượng dinh dưỡng tối ưu.', null, null, null, 4, '{}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'sustainability', 'feature-grid', 'Không Lãng Phí', null, 'Bao bì của chúng tôi có thể tái chế 100% và chúng tôi giảm thiểu lãng phí thực phẩm trong chuỗi cung ứng.', null, null, null, 5, '{}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'convenience', 'feature-grid', 'Tiện Lợi', null, 'Từ tủ lạnh đến bàn ăn chỉ trong 15 phút. Meal prep không cần prep.', null, 'Thực Đơn →', '/menu', 6, '{}')
on conflict (page_id, section_key) do update
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
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------
insert into public.products (id, category_id, name, slug, short_description, description, main_image_url, is_featured, is_published, sort_order)
values
  ('p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Ức Gà Ướp', 'marinated-chicken', 'Thịt gà tẩm ướp giàu protein.', 'Thưởng thức phần thịt được tẩm ướp hoàn hảo, dồi dào protein và hương vị hảo hạng. Dành cho những người sành ăn muốn tối đa hoá hương vị mà không tốn công chuẩn bị.', '/images/demo/products/marinated-chicken.png', true, true, 1),
  ('p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Bò Thượng Hạng', 'prime-beef', 'Thịt bò premium mềm và đậm đà.', 'Lựa chọn cao cấp cho bữa ăn mạnh mẽ, giàu đạm, ít công chuẩn bị.', '/images/demo/products/prime-beef.png', false, true, 2),
  ('p1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'Sườn Nướng BBQ', 'bbq-ribs', 'Sườn heo nướng BBQ vị đậm đà.', 'Phần sườn đậm vị sốt BBQ, phù hợp cho bữa tối nhanh chóng.', '/images/demo/products/bbq-ribs.png', false, true, 3),
  ('p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'Cá Hồi Cam', 'orange-salmon', 'Cá hồi tươi vị cam thanh nhẹ.', 'Kết hợp vị béo của cá hồi với sốt cam tươi mới.', '/images/demo/products/orange-salmon.png', false, true, 4),
  ('p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'Gà Ướp Tỏi Thảo Mộc', 'garlic-herb-chicken', 'Gà ướp tỏi và thảo mộc thơm dịu.', 'Mềm, thơm, phù hợp cho bữa ăn hằng ngày ít dầu mỡ.', '/images/demo/products/garlic-herb-chicken.png', false, true, 5),
  ('p1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'Bò Wagyu', 'wagyu-beef', 'Thịt bò wagyu cao cấp.', 'Lựa chọn đặc biệt cho người muốn trải nghiệm thịt bò mềm béo.', '/images/demo/products/wagyu-beef.png', false, true, 6),
  ('p1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003', 'Heo Mật Ong', 'honey-pork', 'Thịt heo sốt mật ong cân bằng vị ngọt.', 'Lớp glaze mật ong hài hòa, dễ ăn và hợp khẩu vị đa số.', '/images/demo/products/honey-pork.png', false, true, 7),
  ('p1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', 'Tôm Teriyaki', 'teriyaki-shrimp', 'Tôm sốt teriyaki chuẩn vị.', 'Hải sản nhanh gọn, đậm vị, nhiều protein.', '/images/demo/products/teriyaki-shrimp.png', false, true, 8),
  ('p1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', 'Hỗn Hợp Gia Vị Đặc Biệt', 'special-spice-mix', 'Gia vị trộn sẵn độc quyền.', 'Hỗn hợp gia vị dùng để nâng tầm món nướng và áp chảo.', '/images/demo/products/special-spice-mix.png', false, true, 9),
  ('p1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000005', 'Gia Vị Paprika Hun Khói', 'smoked-paprika', 'Paprika hun khói đậm đà.', 'Tăng chiều sâu hương vị cho các món thịt và rau củ.', '/images/demo/products/smoked-paprika.png', false, true, 10)
on conflict (id) do nothing;

-- Variants for featured chicken
insert into public.product_variants (product_id, label, weight_in_grams, price, is_default, is_active, calories, protein, carbs, fat, fiber, sort_order)
values
  ('p1000000-0000-0000-0000-000000000001', '200 G', 200, 79000, false, true, 330, 62.0, 0.0, 7.2, 0.0, 1),
  ('p1000000-0000-0000-0000-000000000001', '500 G', 500, 159000, true, true, 825, 155.0, 0.0, 18.0, 0.0, 2),
  ('p1000000-0000-0000-0000-000000000001', '1 KG', 1000, 299000, false, true, 1650, 310.0, 0.0, 36.0, 0.0, 3),

  ('p1000000-0000-0000-0000-000000000002', '500 G', 500, 249000, true, true, 1250, 105.0, 0.0, 82.0, 0.0, 1),
  ('p1000000-0000-0000-0000-000000000003', '500 G', 500, 189000, true, true, 1450, 70.0, 18.0, 110.0, 0.0, 1),
  ('p1000000-0000-0000-0000-000000000004', '500 G', 500, 269000, true, true, 1040, 100.0, 12.0, 68.0, 0.0, 1),
  ('p1000000-0000-0000-0000-000000000005', '500 G', 500, 169000, true, true, 900, 148.0, 2.0, 20.0, 0.0, 1),
  ('p1000000-0000-0000-0000-000000000006', '500 G', 500, 399000, true, true, 1650, 95.0, 0.0, 135.0, 0.0, 1),
  ('p1000000-0000-0000-0000-000000000007', '500 G', 500, 159000, true, true, 1300, 90.0, 24.0, 88.0, 0.0, 1),
  ('p1000000-0000-0000-0000-000000000008', '500 G', 500, 219000, true, true, 725, 120.0, 20.0, 14.0, 0.0, 1),
  ('p1000000-0000-0000-0000-000000000009', '100 G', 100, 59000, true, true, 15, 0.2, 2.0, 0.2, 1.0, 1),
  ('p1000000-0000-0000-0000-000000000010', '100 G', 100, 49000, true, true, 20, 0.9, 4.0, 0.8, 2.0, 1);

insert into public.product_benefits (product_id, title, sort_order)
values
  ('p1000000-0000-0000-0000-000000000001', 'Giàu Protein', 1),
  ('p1000000-0000-0000-0000-000000000001', 'Ít Chất Béo', 2),
  ('p1000000-0000-0000-0000-000000000001', 'Hỗ Trợ Phục Hồi Cơ', 3),
  ('p1000000-0000-0000-0000-000000000001', 'Bữa Ăn Nhanh Chóng', 4);

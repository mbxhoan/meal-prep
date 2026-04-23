insert into public.product_categories (category_code, name, sort_order)
values
  ('CAT-CHICKEN', 'Ức gà', 1),
  ('CAT-PORK', 'Heo', 2),
  ('CAT-SHRIMP', 'Tôm', 3)
on conflict (category_code) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

insert into public.customers (customer_code, name, phone, address)
values
  ('CUS-0001', 'Nguyễn Minh Anh', '0909123456', 'Thủ Đức, TP.HCM'),
  ('CUS-0002', 'Trần Thu Hà', '0909456789', 'Quận 7, TP.HCM')
on conflict (customer_code) do update
set name = excluded.name,
    phone = excluded.phone,
    address = excluded.address;

insert into public.employees (employee_code, name, phone)
values
  ('EMP-0001', 'Hoàng My', '0911000111'),
  ('EMP-0002', 'Khánh Linh', '0911222333')
on conflict (employee_code) do update
set name = excluded.name,
    phone = excluded.phone;

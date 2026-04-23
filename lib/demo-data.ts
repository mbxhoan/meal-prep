export const demoKpis = {
  products: 26,
  variants: 52,
  combos: 8,
  customers: 132,
  employees: 5,
  ordersToday: 14,
  revenueToday: 4285000,
  unpaidOrders: 3
};

export const demoCategories = [
  { id: 'cat-1', category_code: 'CAT-CHICKEN', name: 'Ức gà', is_active: true },
  { id: 'cat-2', category_code: 'CAT-PORK', name: 'Heo', is_active: true },
  { id: 'cat-3', category_code: 'CAT-SHRIMP', name: 'Tôm', is_active: true }
];

export const demoProducts = [
  { id: 'prd-1', product_code: 'PRD-UCG-CJ', product_name: 'Ức gà cajun', category_name: 'Ức gà', variants_count: 3, is_active: true },
  { id: 'prd-2', product_code: 'PRD-UCG-ST', product_name: 'Ức gà sả chanh', category_name: 'Ức gà', variants_count: 2, is_active: true },
  { id: 'prd-3', product_code: 'PRD-HEO-TB', product_name: 'Nạc heo tây bắc', category_name: 'Heo', variants_count: 2, is_active: true },
  { id: 'prd-4', product_code: 'PRD-TOM-GT', product_name: 'Tôm gừng tỏi', category_name: 'Tôm', variants_count: 2, is_active: true }
];

export const demoCombos = [
  { id: 'com-1', combo_code: 'COM-KEEPFIT', combo_name: 'Combo giữ dáng', sale_price: 159000, items_count: 3, is_active: true },
  { id: 'com-2', combo_code: 'COM-PROTEIN', combo_name: 'Combo protein cao', sale_price: 189000, items_count: 3, is_active: true },
  { id: 'com-3', combo_code: 'COM-LEAN', combo_name: 'Combo lean clean', sale_price: 149000, items_count: 2, is_active: true }
];

export const demoCustomers = [
  { id: 'cus-1', customer_code: 'CUS-0001', name: 'Nguyễn Minh Anh', phone: '0909123456', address: 'Thủ Đức, TP.HCM', total_orders: 8, total_spent: 1280000, is_active: true },
  { id: 'cus-2', customer_code: 'CUS-0002', name: 'Trần Thu Hà', phone: '0909456789', address: 'Quận 7, TP.HCM', total_orders: 5, total_spent: 840000, is_active: true },
  { id: 'cus-3', customer_code: 'CUS-0003', name: 'Lê Quốc Việt', phone: '0935000111', address: 'Biên Hoà, Đồng Nai', total_orders: 2, total_spent: 320000, is_active: true }
];

export const demoEmployees = [
  { id: 'emp-1', employee_code: 'EMP-0001', name: 'Hoàng My', phone: '0911000111', total_orders: 12, total_revenue: 3240000, is_active: true },
  { id: 'emp-2', employee_code: 'EMP-0002', name: 'Khánh Linh', phone: '0911222333', total_orders: 9, total_revenue: 2140000, is_active: true },
  { id: 'emp-3', employee_code: 'EMP-0003', name: 'Minh Tuấn', phone: '0911444555', total_orders: 6, total_revenue: 1680000, is_active: true }
];

export const demoOrders = [
  {
    id: 'ord-1',
    order_code: 'DH-20260423-001',
    order_date: '2026-04-23',
    customer_name: 'Nguyễn Minh Anh',
    employee_name: 'Hoàng My',
    subtotal_amount: 189000,
    shipping_fee: 15000,
    discount_amount: 10000,
    total_amount: 194000,
    amount_paid: 194000,
    order_status: 'confirmed',
    payment_status: 'paid',
    delivery_status: 'preparing'
  },
  {
    id: 'ord-2',
    order_code: 'DH-20260423-002',
    order_date: '2026-04-23',
    customer_name: 'Trần Thu Hà',
    employee_name: 'Khánh Linh',
    subtotal_amount: 149000,
    shipping_fee: 20000,
    discount_amount: 0,
    total_amount: 169000,
    amount_paid: 50000,
    order_status: 'confirmed',
    payment_status: 'partial',
    delivery_status: 'shipping'
  },
  {
    id: 'ord-3',
    order_code: 'DH-20260423-003',
    order_date: '2026-04-23',
    customer_name: 'Lê Quốc Việt',
    employee_name: 'Minh Tuấn',
    subtotal_amount: 98000,
    shipping_fee: 0,
    discount_amount: 0,
    total_amount: 98000,
    amount_paid: 0,
    order_status: 'draft',
    payment_status: 'unpaid',
    delivery_status: 'pending'
  }
];

export const demoVariants = [
  { variant_code: 'VAR-UCG-CJ-100G', label: 'Ức gà cajun 100g', sale_price: 52000, cost_price: 31000 },
  { variant_code: 'VAR-UCG-CJ-150G', label: 'Ức gà cajun 150g', sale_price: 69000, cost_price: 42000 },
  { variant_code: 'VAR-TOM-GT-100G', label: 'Tôm gừng tỏi 100g', sale_price: 65000, cost_price: 42000 },
  { variant_code: 'VAR-HEO-TB-150G', label: 'Nạc heo tây bắc 150g', sale_price: 59000, cost_price: 36000 }
];

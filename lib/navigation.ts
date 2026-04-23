export const navigationItems = [
  { href: '/', label: 'Tổng quan', description: 'Dashboard & tiến độ triển khai' },
  { href: '/products', label: 'Món hàng', description: 'Món cha + biến thể trọng lượng' },
  { href: '/combos', label: 'Combo', description: 'Combo và thành phần combo' },
  { href: '/customers', label: 'Khách hàng', description: 'Danh bạ khách mua' },
  { href: '/employees', label: 'Nhân viên', description: 'Nhân viên bán / giới thiệu' },
  { href: '/orders', label: 'Đơn hàng', description: 'Đơn bán hàng & bill' },
  { href: '/orders/new', label: 'Tạo đơn', description: 'Form mẫu cho flow bán hàng' },
  { href: '/imports/master-data', label: 'Nạp Excel', description: 'Import master data đầu kỳ' }
] as const;

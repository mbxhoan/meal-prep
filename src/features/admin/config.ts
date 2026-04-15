export const ADMIN_SIMPLE_MODE = true;

export type AdminGuideConfig = {
  storageKey: string;
  title: string;
  summary: string;
  steps: string[];
  actionHref: string;
  actionLabel: string;
};

export function getAdminGuideConfig(pathname: string): AdminGuideConfig | null {
  if (pathname === "/admin") {
    return {
      storageKey: "mealfit-admin-guide-dashboard-v2",
      title: "Bắt đầu trong 1 phút",
      summary: "Chỉ cần nhìn 4 chỗ: Món hàng, Đơn hàng, Doanh thu và Danh mục.",
      steps: [
        "Mở Món hàng nếu có món mới hoặc cần sửa giá.",
        "Mở Đơn hàng để tạo bill và chốt trạng thái.",
        "Mở Doanh thu để xem tiền trong ngày.",
        "Mở Danh mục khi cần sửa khách hàng hoặc nhân viên.",
      ],
      actionHref: "/admin/orders/new",
      actionLabel: "Tạo đơn",
    };
  }

  if (pathname === "/admin/menu" || pathname.startsWith("/admin/menu/")) {
    return {
      storageKey: "mealfit-admin-guide-menu-v3",
      title: "Món và combo",
      summary: "Món giữ giá riêng, combo ghép nhiều món và có thể sao chép nhanh.",
      steps: [
        "Nhập tên món, chọn nhóm và nhập ít nhất 1 loại có giá.",
        "Vào phần combo để ghép nhiều món vào cùng một gói.",
        "Bấm sao chép nếu muốn tạo combo mới từ combo cũ rất nhanh.",
      ],
      actionHref: "/admin/menu/new",
      actionLabel: "Thêm món",
    };
  }

  if (pathname === "/admin/orders" || pathname.startsWith("/admin/orders/")) {
    return {
      storageKey: "mealfit-admin-guide-orders-v2",
      title: "Tạo đơn và ra bill",
      summary: "Nhập khách, chọn món, rồi lưu để giữ giá của đơn.",
      steps: [
        "Chọn khách và thêm món.",
        "Rà giảm giá, phí ship và ghi chú.",
        "Lưu đơn để ra bill và đổi trạng thái khi cần.",
      ],
      actionHref: "/admin/orders/new",
      actionLabel: "Tạo đơn",
    };
  }

  if (pathname === "/admin/master-data" || pathname.startsWith("/admin/master-data/")) {
    return {
      storageKey: "mealfit-admin-guide-master-data-v2",
      title: "Danh mục dùng chung",
      summary: "Sửa các dữ liệu nền như khách hàng, nhân viên và danh mục món.",
      steps: [
        "Mở đúng nhóm cần sửa.",
        "Thêm hoặc đổi thông tin ngắn gọn.",
        "Lưu xong quay lại Món hàng hoặc Đơn hàng.",
      ],
      actionHref: "/admin/master-data",
      actionLabel: "Mở danh mục",
    };
  }

  return null;
}

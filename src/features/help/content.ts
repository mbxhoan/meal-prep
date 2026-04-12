export type HelpQuickStartStep = {
  title: string;
  description: string;
};

export type HelpRule = {
  title: string;
  description: string;
};

export type HelpRoleGuide = {
  roleCode: "system_admin" | "shop_admin" | "employee";
  roleLabel: string;
  scope: string;
  responsibilities: string[];
};

export type HelpTip = {
  title: string;
  description: string;
};

export const helpQuickStartSteps: HelpQuickStartStep[] = [
  {
    title: "Thêm món",
    description: "Mở Món hàng để nhập tên, nhóm và giá bán.",
  },
  {
    title: "Tạo đơn",
    description: "Mở Đơn hàng để chọn khách, món, giảm giá và phí ship.",
  },
  {
    title: "Xem tiền",
    description: "Mở Doanh thu để xem tiền trong ngày.",
  },
];

export const helpGuardrails: HelpRule[] = [
  {
    title: "Đơn đã lưu giữ nguyên giá",
    description: "Giá của đơn không tự đổi theo bảng giá mới.",
  },
  {
    title: "Món lưu là dùng ngay",
    description: "Sửa giá món xong, đơn mới sẽ lấy giá mới đó.",
  },
  {
    title: "Chỉ làm đúng màn mình cần",
    description: "Không cần mở phần kho, danh mục hay quyền nếu chưa dùng tới.",
  },
];

export const helpRoleGuides: HelpRoleGuide[] = [
  {
    roleCode: "system_admin",
    roleLabel: "Quản trị hệ thống",
    scope: "Quản lý toàn hệ thống.",
    responsibilities: ["Mở khóa shop.", "Xem lỗi và hỗ trợ."],
  },
  {
    roleCode: "shop_admin",
    roleLabel: "Quản lý shop",
    scope: "Điều hành shop hằng ngày.",
    responsibilities: ["Thêm món.", "Tạo đơn.", "Xem doanh thu."],
  },
  {
    roleCode: "employee",
    roleLabel: "Nhân viên",
    scope: "Làm việc theo quyền được giao.",
    responsibilities: ["Nhập đơn.", "Ghi tiền.", "Đổi trạng thái khi cần."],
  },
];

export const helpNeedHelpTips: HelpTip[] = [
  {
    title: "Không thấy món",
    description: "Mở Món hàng và kiểm tra món đang ở trạng thái dùng.",
  },
  {
    title: "Sai giá",
    description: "Mở lại đơn để xem giá đã lưu, không tự sửa theo bảng giá mới.",
  },
  {
    title: "Không biết bấm gì",
    description: "Mở popup hướng dẫn ở góc phải dưới hoặc quay về dashboard.",
  },
];

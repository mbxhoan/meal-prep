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
  guardrails: string[];
};

export type HelpPlaybookSection = {
  title: string;
  summary: string;
  steps: string[];
};

export type HelpChecklistSection = {
  title: string;
  items: string[];
};

export type HelpTroubleshootingItem = {
  title: string;
  symptom: string;
  cause: string[];
  fix: string[];
};

export const helpQuickStartSteps: HelpQuickStartStep[] = [
  {
    title: "Đăng nhập đúng shop",
    description: "Kiểm tra user, shop và quyền.",
  },
  {
    title: "Xem dashboard",
    description: "Nhìn đơn chờ, tồn thấp và lô cận HSD.",
  },
  {
    title: "Biết 5 khu vực",
    description: "Danh mục, bán hàng, kho, báo cáo, quyền.",
  },
  {
    title: "Rà trước khi lưu",
    description: "Kiểm tra giá, tồn, FEFO và log.",
  },
];

export const helpGuardrails: HelpRule[] = [
  {
    title: "Snapshot giá",
    description: "Đơn chốt không tự đổi theo bảng giá mới.",
  },
  {
    title: "Movement là nguồn sự thật của tồn",
    description: "Tồn chỉ đổi qua phiếu hoặc movement.",
  },
  {
    title: "FEFO",
    description: "Hàng có HSD ưu tiên lô gần hết hạn.",
  },
  {
    title: "Audit log bắt buộc",
    description: "Sửa, xóa, duyệt và override đều phải có log.",
  },
];

export const helpRoleGuides: HelpRoleGuide[] = [
  {
    roleCode: "system_admin",
    roleLabel: "Quản trị hệ thống",
    scope: "Quản lý toàn hệ thống.",
    responsibilities: ["Tạo và khóa shop.", "Xem log và xử lý sự cố dữ liệu."],
    guardrails: ["Không dùng cho tác nghiệp ngày.", "Không sửa thay shop admin nếu không cần."],
  },
  {
    roleCode: "shop_admin",
    roleLabel: "Quản lý shop",
    scope: "Vận hành trong shop được gán.",
    responsibilities: [
      "Quản lý master data và bảng giá.",
      "Tạo, sửa khách, hàng, menu và phiếu kho.",
      "Duyệt override khi cần.",
    ],
    guardrails: ["Bill cũ không đổi theo master mới.", "Tồn phải đi qua chứng từ."],
  },
  {
    roleCode: "employee",
    roleLabel: "Nhân viên",
    scope: "Tác nghiệp theo quyền được cấp.",
    responsibilities: [
      "Tạo khách, tạo đơn và gửi bill.",
      "Nhập / xuất kho nếu được cấp quyền.",
      "Làm theo quy trình đã duyệt.",
    ],
    guardrails: ["Không xóa chứng từ đã post.", "Không bypass FEFO nếu chưa có quyền.", "Không dùng chung tài khoản."],
  },
];

export const helpDailyPlaybook: HelpPlaybookSection[] = [
  {
    title: "Mở ngày",
    summary: "Xem cảnh báo trước khi làm.",
    steps: ["Xem đơn chờ, đơn chưa thu và lô cận HSD.", "Kiểm tra phiếu nháp và lịch giao."],
  },
  {
    title: "Nhập kho",
    summary: "Nhập rồi mới ghi sổ.",
    steps: ["Tạo phiếu, chọn kho và nhà cung cấp.", "Nhập lô, HSD, số lượng và giá vốn.", "Ghi sổ rồi kiểm tra tồn."],
  },
  {
    title: "Tạo đơn",
    summary: "Dùng snapshot giá.",
    steps: ["Chọn khách, thêm món và số lượng.", "Rà giảm giá, phí và ghi chú.", "Khách đồng ý thì chốt."],
  },
  {
    title: "Xuất kho",
    summary: "Luôn xem FEFO trước.",
    steps: ["Xem lô gợi ý theo FEFO.", "Đổi lô thì ghi lý do.", "Đối chiếu tồn sau xuất."],
  },
  {
    title: "Cuối ngày",
    summary: "Chốt việc còn dang dở.",
    steps: ["Rà đơn chưa thu và phiếu nháp.", "Rà override và tồn thấp.", "Xem doanh thu và lãi trong ngày."],
  },
];

export const helpChecklists: HelpChecklistSection[] = [
  {
    title: "Checklist mở đầu ngày",
    items: ["Đúng shop", "Đã xem dashboard", "Đã xem lô cận HSD", "Đã xem đơn chờ"],
  },
  {
    title: "Checklist trước khi gửi bill",
    items: ["Khách đúng", "Món, số lượng đúng", "Giá và giảm giá đúng", "Phí và ghi chú đủ"],
  },
  {
    title: "Checklist trước khi post phiếu nhập",
    items: ["Kho đúng", "Item đúng", "Số lượng đúng", "Giá vốn và lô đúng", "Có HSD thì đã nhập"],
  },
  {
    title: "Checklist trước khi post phiếu xuất",
    items: ["Đúng đơn hoặc lý do", "Đã xem gợi ý FEFO", "Số lượng không vượt tồn", "Override thì có lý do"],
  },
  {
    title: "Checklist cuối ngày",
    items: ["Không còn phiếu nháp", "Đã rà đơn chưa thu", "Đã rà lô cận HSD", "Đã rà override"],
  },
];

export const helpTroubleshootingItems: HelpTroubleshootingItem[] = [
  {
    title: "Đơn cũ bị đổi giá",
    symptom: "Bill cũ ra giá mới.",
    cause: ["Đọc động từ bảng giá.", "Đã refresh trên đơn chốt."],
    fix: ["Dùng snapshot.", "Không vá bill cũ.", "Override nếu cần."],
  },
  {
    title: "Tồn kho sai",
    symptom: "Tồn không khớp.",
    cause: ["Có phiếu nháp.", "Chỉnh tay tồn.", "Movement trùng."],
    fix: ["Đối chiếu sổ kho.", "Dùng phiếu điều chỉnh.", "Không sửa trực tiếp tồn."],
  },
  {
    title: "FEFO lấy lô khác",
    symptom: "Kho lấy lô khác gợi ý.",
    cause: ["Đã override gợi ý."],
    fix: ["Chỉ override khi có quyền.", "Bắt buộc ghi lý do.", "Lưu log."],
  },
  {
    title: "Nhập thiếu HSD",
    symptom: "Phiếu nhập thiếu dữ liệu.",
    cause: ["Item có HSD nhưng chưa nhập.", "Cảnh báo chưa được rà."],
    fix: ["Nhập HSD trước khi ghi sổ.", "Không bỏ qua cảnh báo."],
  },
  {
    title: "Barcode không nhận",
    symptom: "Có mã nhưng hệ thống không nhận.",
    cause: ["Barcode chưa gắn đúng.", "Sai shop hoặc kho.", "Scanner thêm ký tự lạ."],
    fix: ["Kiểm tra master.", "Chọn đúng shop / kho.", "Làm sạch ký tự thừa."],
  },
  {
    title: "Hết hàng vẫn confirm",
    symptom: "Đơn vượt tồn mà vẫn đi tiếp.",
    cause: ["Policy cho phép override.", "Cảnh báo chưa chặn đúng chỗ."],
    fix: ["Hiển thị cảnh báo rõ.", "Chỉ tiếp tục khi có lý do.", "Lưu log."],
  },
];

export const helpRbacSummary = [
  {
    title: "Nguồn sự thật quyền",
    description: "Quyền thật đến từ role, permission và user_shop_roles.",
  },
  {
    title: "Phạm vi truy cập",
    description: "User thường chỉ thấy shop của mình.",
  },
  {
    title: "Nguyên tắc hệ thống",
    description: "Một số thao tác đi qua RPC để giữ RLS và log.",
  },
];

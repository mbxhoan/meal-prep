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
    title: "Đăng nhập và kiểm tra shop",
    description:
      "Xác nhận đúng tài khoản, đúng shop và đúng menu quyền trước khi thao tác.",
  },
  {
    title: "Đọc dashboard đầu ngày",
    description:
      "Xem đơn chờ xử lý, đơn chưa thanh toán, lô cận HSD và tồn thấp.",
  },
  {
    title: "Nhớ 5 khu vực chính",
    description:
      "Danh mục nền tảng, bán hàng, tồn kho, báo cáo và quản trị / nhật ký hệ thống.",
  },
  {
    title: "Tự kiểm tra 4 câu hỏi",
    description:
      "Đây là master data hay giao dịch, có ảnh hưởng giá lịch sử, có ảnh hưởng tồn và có audit log hay không?",
  },
];

export const helpGuardrails: HelpRule[] = [
  {
    title: "Snapshot giá",
    description:
      "Đơn đã gửi hoặc đã chốt dùng giá chụp tại thời điểm tạo đơn, không tự đổi theo bảng giá mới.",
  },
  {
    title: "Movement là nguồn sự thật của tồn",
    description:
      "Mọi thay đổi kho phải đi qua phiếu nhập, phiếu xuất, phiếu điều chỉnh hoặc bút toán tương đương.",
  },
  {
    title: "FEFO là mặc định",
    description:
      "Hàng có HSD phải ưu tiên lô gần hết hạn nhất còn tồn, trừ khi có override và lý do rõ ràng.",
  },
  {
    title: "Audit log bắt buộc",
    description:
      "Thao tác tạo, sửa, xóa, duyệt, chốt, hủy, override giá và override tồn đều phải lưu lịch sử.",
  },
];

export const helpRoleGuides: HelpRoleGuide[] = [
  {
    roleCode: "system_admin",
    roleLabel: "Quản trị hệ thống",
    scope: "Quản lý toàn hệ thống đa shop.",
    responsibilities: [
      "Tạo, khóa shop và quản lý mapping user, role, permission.",
      "Xem audit log toàn hệ thống và xử lý sự cố dữ liệu có kiểm soát.",
      "Cấu hình nền cho chính sách dữ liệu và bảo mật.",
    ],
    guardrails: [
      "Không dùng cho tác nghiệp bán hàng hàng ngày.",
      "Không chỉnh nghiệp vụ thay shop admin nếu không thật sự cần.",
    ],
  },
  {
    roleCode: "shop_admin",
    roleLabel: "Quản lý shop",
    scope: "Vận hành nghiệp vụ trong phạm vi shop được gán.",
    responsibilities: [
      "Quản lý master data của shop, bảng giá hiện hành và user trong shop.",
      "Tạo / sửa khách hàng, hàng hóa, menu, phiếu nhập, phiếu xuất và điều chỉnh kho.",
      "Duyệt ngoại lệ có kiểm soát như override giá hoặc override FEFO.",
    ],
    guardrails: [
      "Bill cũ không được tự đổi giá theo master mới.",
      "Tồn kho phải đi qua chứng từ, không sửa tay vào số tồn.",
    ],
  },
  {
    roleCode: "employee",
    roleLabel: "Nhân viên",
    scope: "Tác nghiệp hàng ngày theo quyền được cấp.",
    responsibilities: [
      "Tạo khách hàng, tạo đơn nháp, thêm món, gửi bill và theo dõi thanh toán.",
      "Nhập / xuất kho nếu được cấp quyền và scan barcode hàng hoặc barcode lô.",
      "Làm việc theo quy trình đã duyệt thay vì tự đổi giá hoặc đổi lô cảm tính.",
    ],
    guardrails: [
      "Không xóa chứng từ đã post.",
      "Không bypass FEFO nếu chưa có quyền và lý do.",
      "Không dùng chung tài khoản với người khác.",
    ],
  },
];

export const helpDailyPlaybook: HelpPlaybookSection[] = [
  {
    title: "Mở ngày làm việc",
    summary: "Bắt đầu bằng dashboard để thấy rủi ro trước khi thao tác.",
    steps: [
      "Xem đơn chưa xử lý, đơn chưa thanh toán, lô cận HSD / hết hạn và tồn thấp.",
      "Kiểm tra phiếu nhập hoặc giao hàng dự kiến trong ngày.",
    ],
  },
  {
    title: "Nhập kho hàng mới",
    summary: "Dùng khi nhận nguyên liệu, bao bì, gia vị hoặc thành phẩm nhập kho.",
    steps: [
      "Tạo phiếu nhập, chọn kho nhận và chọn nhà cung cấp hoặc nguồn nhập.",
      "Với item theo lô, nhập mã lô, NSX, HSD, số lượng và đơn giá vốn.",
      "Post phiếu và kiểm tra tồn theo lô sau khi ghi sổ.",
    ],
  },
  {
    title: "Tạo đơn bán",
    summary: "Dùng snapshot giá ngay khi đơn được tạo.",
    steps: [
      "Chọn khách hoặc tạo khách mới, tạo đơn nháp rồi thêm món / biến thể / số lượng.",
      "Kiểm tra giảm giá, phí giao hàng và ghi chú trước khi gửi bill.",
      "Khi khách đã đồng ý, chuyển sang trạng thái gửi hoặc xác nhận và không refresh giá nữa.",
    ],
  },
  {
    title: "Xuất kho cho đơn",
    summary: "Luôn kiểm tra gợi ý FEFO trước khi post.",
    steps: [
      "Mở phiếu xuất liên kết với đơn và xem lô gợi ý theo FEFO.",
      "Nếu đổi lô, nhập lý do override và post phiếu.",
      "Đối chiếu lại tồn sau xuất để chắc chắn movement đã ghi nhận đúng.",
    ],
  },
  {
    title: "Cuối ngày",
    summary: "Chốt những thứ còn dang dở trước khi hết ca.",
    steps: [
      "Kiểm tra đơn chưa thanh toán, phiếu nháp chưa post và lô cận HSD.",
      "Rà các thao tác override giá, override FEFO và điều chỉnh tồn.",
      "Chốt doanh thu và gross profit snapshot trong ngày.",
    ],
  },
];

export const helpChecklists: HelpChecklistSection[] = [
  {
    title: "Checklist mở đầu ngày",
    items: [
      "Đã chọn đúng shop",
      "Đã xem dashboard cảnh báo",
      "Đã kiểm tra lô cận HSD / hết hạn",
      "Đã kiểm tra đơn chờ xử lý",
      "Đã kiểm tra phiếu nhập / xuất nháp",
    ],
  },
  {
    title: "Checklist trước khi gửi bill",
    items: [
      "Khách hàng đúng",
      "Món / biến thể / số lượng đúng",
      "Giá và giảm giá đúng",
      "Phí giao hàng đúng",
      "Ghi chú đơn hàng đã đủ",
      "Trạng thái đơn còn là nháp",
    ],
  },
  {
    title: "Checklist trước khi post phiếu nhập",
    items: [
      "Kho đúng",
      "Item đúng",
      "Số lượng đúng",
      "Đơn giá vốn đúng",
      "Mã lô đúng",
      "HSD đã nhập nếu item có HSD",
    ],
  },
  {
    title: "Checklist trước khi post phiếu xuất",
    items: [
      "Phiếu xuất liên kết đúng đơn hoặc lý do",
      "FEFO suggestion đã được kiểm tra",
      "Lô chọn đúng",
      "Số lượng xuất không vượt tồn khả dụng",
      "Override có reason nếu không dùng lô FEFO",
    ],
  },
  {
    title: "Checklist cuối ngày",
    items: [
      "Không còn phiếu nháp quên xử lý",
      "Đã rà đơn chưa thanh toán",
      "Đã rà đơn hủy / hoàn",
      "Đã rà lô cận HSD",
      "Đã rà log override giá / FEFO / điều chỉnh tồn",
    ],
  },
];

export const helpTroubleshootingItems: HelpTroubleshootingItem[] = [
  {
    title: "Đơn cũ bị đổi giá sau khi sửa bảng giá",
    symptom: "Bill cũ hiển thị giá mới.",
    cause: [
      "Order item chưa lưu snapshot mà vẫn đọc động từ bảng giá.",
      "User refresh giá trên đơn đã gửi hoặc đã chốt.",
    ],
    fix: [
      "Luôn lấy giá từ snapshot của đơn đã gửi / chốt / đã thanh toán.",
      "Không sửa master price để vá bill cũ.",
      "Nếu cần, xử lý bằng flow override có log.",
    ],
  },
  {
    title: "Tồn kho sai",
    symptom: "Tổng tồn không khớp với thực tế.",
    cause: [
      "Có phiếu nhập / xuất còn ở trạng thái nháp.",
      "Có ai chỉnh tay tồn hoặc post movement trùng.",
      "Có movement bị hủy nhưng chưa reverse đúng.",
    ],
    fix: [
      "Đối chiếu movement ledger trước.",
      "Nếu cần chỉnh, dùng phiếu điều chỉnh có reason.",
      "Không update trực tiếp cột tồn.",
    ],
  },
  {
    title: "FEFO gợi ý lô A nhưng kho lấy lô B",
    symptom: "Lô thực tế khác lô được hệ thống gợi ý.",
    cause: ["User đã override gợi ý mặc định."],
    fix: [
      "Chỉ cho phép khi user có quyền override.",
      "Bắt buộc ghi lý do.",
      "Audit log phải lưu lô gợi ý, lô thực tế và lý do.",
    ],
  },
  {
    title: "Nhập thiếu HSD",
    symptom: "Phiếu nhập không đủ dữ liệu để chạy FEFO.",
    cause: [
      "Item expirable nhưng chưa nhập hạn sử dụng.",
      "Policy cho phép warning nhưng thao tác chưa được ghi chú đầy đủ.",
    ],
    fix: [
      "Chặn post nếu item có HSD mà thiếu dữ liệu, trừ khi policy cho phép.",
      "Hiển thị cảnh báo rõ ràng cho người dùng.",
    ],
  },
  {
    title: "Quét barcode không ra item hoặc lô",
    symptom: "Scanner trả về mã nhưng hệ thống không nhận diện.",
    cause: [
      "Barcode thuộc item hay lot chưa được gắn đúng.",
      "User đang ở sai shop hoặc sai kho.",
      "Scanner thêm ký tự lạ hoặc line break.",
    ],
    fix: [
      "Kiểm tra barcode đã tồn tại trong master hoặc lô chưa.",
      "Xác nhận đúng shop / kho / mode quét.",
      "Làm sạch ký tự lạ từ scanner nếu cần.",
    ],
  },
  {
    title: "Hết hàng nhưng vẫn confirm được",
    symptom: "Đơn vượt tồn khả dụng nhưng vẫn sang bước tiếp theo.",
    cause: [
      "Policy cho phép backorder hoặc override.",
      "Cảnh báo tồn không đủ chưa được chặn đúng chỗ.",
    ],
    fix: [
      "Hiển thị cảnh báo tồn không đủ rõ ràng.",
      "Chỉ cho tiếp tục nếu policy cho phép và có reason.",
      "Log lại lý do nếu vẫn tiếp tục.",
    ],
  },
];

export const helpRbacSummary = [
  {
    title: "Nguồn sự thật quyền",
    description:
      "Quyền thật đến từ role, permission, role_permissions và user_shop_roles; snapshot role trong profile chỉ để hiển thị.",
  },
  {
    title: "Phạm vi truy cập",
    description:
      "User thường chỉ truy cập dữ liệu cùng shop_id, còn system_admin có thể đi qua nhiều shop theo cấu hình.",
  },
  {
    title: "Nguyên tắc hệ thống",
    description:
      "Một số thao tác cần SQL helper hoặc RPC để đảm bảo RLS, audit log và trạng thái hợp lệ.",
  },
];

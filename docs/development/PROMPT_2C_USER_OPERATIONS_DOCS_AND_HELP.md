# PROMPT_2C_USER_OPERATIONS_DOCS_AND_HELP.md

Sau khi Phase 0 và Prompt 2B hoàn tất, hãy đọc:
- AGENTS.md
- docs/USER_ONBOARDING_GUIDE.md
- docs/ROLE_BASED_OPERATIONS_SOP.md
- docs/DAILY_OPERATIONS_PLAYBOOK.md
- docs/OPERATIONAL_CHECKLISTS.md
- docs/TROUBLESHOOTING_AND_EXCEPTION_HANDLING.md
- docs/RBAC.md

Mục tiêu:
Xây nền cho **hướng dẫn sử dụng trong app** để user mới vào có thể hiểu quy trình và ít thao tác sai hơn.

Hãy thực hiện:
1. tạo một module hoặc khu vực `Help / SOP / Getting Started` trong app
2. tạo ít nhất các trang hoặc route nội bộ:
   - Getting Started
   - Role-based SOP
   - Daily Operations
   - Checklists
   - Troubleshooting
3. các trang này trước mắt có thể là nội dung tĩnh từ markdown hoặc constants, nhưng phải tách cấu trúc rõ để sau này đổi thành CMS/in-app docs được
4. thêm các empty state / helper text ngắn ở các module chính:
   - Sales Orders
   - Inventory Receipts
   - Inventory Issues
   - Lots / FEFO
   - Customers
   - Items
5. helper text phải bám đúng nghiệp vụ trong docs, ví dụ:
   - đơn đã sent/confirmed không auto refresh giá
   - hàng có HSD phải đi FEFO
   - tồn kho không sửa tay
6. chỉ build phần docs/help foundation, không build tour phức tạp hay chatbot
7. thêm quyền xem help cho mọi role đã đăng nhập

Yêu cầu output:
- route tree và component tree cho phần Help
- implementation tối thiểu để nội bộ có thể dùng ngay
- không làm nặng UI
- docs nào cần mapping thành page thì liệt kê rõ

Nguyên tắc:
- nội dung phải rõ, ngắn, hữu ích cho user mới
- không chôn business rule quan trọng chỉ trong docs dev
- không làm lệch rule gốc trong AGENTS.md

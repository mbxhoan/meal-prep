# PROMPT_4B_USER_GUIDED_WORKFLOWS_AND_GUARDRAILS.md

Chạy prompt này sau khi đã có nền Sales core hoặc Inventory core cơ bản.

Hãy đọc:
- AGENTS.md
- docs/BUSINESS_RULES.md
- docs/ORDER_PRICING_COST_RULES.md
- docs/INVENTORY_FEFO_RULES.md
- docs/USER_ONBOARDING_GUIDE.md
- docs/ROLE_BASED_OPERATIONS_SOP.md
- docs/DAILY_OPERATIONS_PLAYBOOK.md
- docs/OPERATIONAL_CHECKLISTS.md
- docs/TROUBLESHOOTING_AND_EXCEPTION_HANDLING.md

Mục tiêu:
Biến các quy trình vận hành thành **guardrails trong UI**, giúp user mới thao tác đúng ngay trong app.

Hãy thực hiện:
1. thêm step labels / status hints / confirm dialogs ở các flow quan trọng:
   - tạo đơn
   - gửi bill
   - confirm đơn
   - tạo phiếu nhập
   - post phiếu nhập
   - tạo phiếu xuất
   - allocate FEFO
   - post phiếu xuất
2. với các thao tác rủi ro, hiển thị warning rõ:
   - đơn đã sent/confirmed sẽ không tự refresh giá
   - override FEFO cần lý do
   - điều chỉnh tồn cần lý do
   - item expirable phải có HSD khi nhập
3. thêm checklist UI trước khi confirm/post nếu phù hợp
4. thêm timeline / activity log ngắn trong detail page nếu dữ liệu đã có
5. giữ implementation non-breaking, không làm phức tạp hơn mức cần thiết

Yêu cầu output:
- liệt kê màn nào được tăng guardrail
- component nào mới
- text key / constants nào nên tách riêng
- phần nào cần defer vì chưa có module nền

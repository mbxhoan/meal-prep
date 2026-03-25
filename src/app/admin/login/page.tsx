import { LoginForm } from "@/features/admin/components";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const reason = Array.isArray(resolvedSearchParams.reason)
    ? resolvedSearchParams.reason[0]
    : resolvedSearchParams.reason;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(244,114,32,0.12),_transparent_32%),linear-gradient(180deg,_#f6f7f1_0%,_#eef2e7_56%,_#f6f1e7_100%)] px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="rounded-[40px] border border-white/60 bg-[#18352d] p-8 text-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.85)] md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Trung tâm điều hành MealFit
          </p>
          <h1 className="mt-5 max-w-xl text-lg font-semibold tracking-tight md:text-[20px]">
            Quản lý tồn kho, đơn hàng, doanh thu và lợi nhuận gộp từ một nơi.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/72">
            Bảng điều khiển này tập trung vào 4 luồng chính: lưu giá vốn nguyên
            liệu, ghép công thức cho từng món, tạo đơn để hệ thống tự tính giá
            vốn và theo dõi tồn kho sau bán hàng.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-medium">1. Tồn kho và giá vốn bình quân</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Ghi nhập kho, điều chỉnh và hao hụt ngay trên bảng điều khiển kho.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-medium">2. Biên tập thực đơn có ảnh đại diện</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Chỉnh ảnh đại diện, giá bán và hồ sơ chi phí của từng biến thể.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-medium">3. Tạo đơn tự tính giá vốn</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Chốt đơn xong là có doanh thu, tổng giá vốn và lợi nhuận gộp ngay.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-medium">4. Báo cáo theo ngày</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Theo dõi biên lợi nhuận và mặt hàng nào đang mang nhiều lợi
                nhuận nhất.
              </p>
            </div>
          </div>
        </div>

        <LoginForm reason={reason} />
      </div>
    </div>
  );
}

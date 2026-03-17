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
            MealFit Control Tower
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
            Quản lý tồn kho, đơn hàng, doanh thu và gross profit từ một nơi.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/72">
            Admin này tập trung vào 4 flow chính: lưu cost nguyên liệu, map recipe
            cho từng menu, tạo đơn để hệ thống tự tính COGS và theo dõi tồn kho sau
            bán hàng.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
              <p className="text-sm font-medium">1. Tồn kho và cost bình quân</p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Ghi nhập kho, điều chỉnh và hao hụt ngay trên dashboard kho.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
              <p className="text-sm font-medium">2. Menu editor có ảnh đại diện</p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Chỉnh ảnh thumbnail, giá bán và cost profile của từng variant.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
              <p className="text-sm font-medium">3. Order builder tự tính COGS</p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Chốt đơn xong là có revenue, total cost và gross profit ngay.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
              <p className="text-sm font-medium">4. Analytics theo ngày</p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Theo dõi margin và SKU nào đang mang nhiều lợi nhuận nhất.
              </p>
            </div>
          </div>
        </div>

        <LoginForm reason={reason} />
      </div>
    </div>
  );
}

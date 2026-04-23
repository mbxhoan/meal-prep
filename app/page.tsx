import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { getDashboardMetrics } from '@/lib/repository/orders';
import { toCurrency } from '@/lib/utils';

export default async function HomePage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="MealFit nội bộ"
        title="Dashboard khởi động nhanh"
        description="Repo starter này đã có sẵn cấu trúc module, migration, import Excel master data và UI quản trị cơ bản để bạn giao dev triển khai tiếp rất nhanh."
        actions={
          <div className="header-actions-inline">
            <Link href="/imports/master-data" className="primary-button">
              Nạp Excel master data
            </Link>
            <Link href="/orders/new" className="secondary-button">
              Xem form tạo đơn
            </Link>
          </div>
        }
      />

      <section className="stats-grid">
        <StatCard label="Món hàng" value={String(metrics.products)} description="Món cha đang quản lý" />
        <StatCard label="Biến thể" value={String(metrics.variants)} description="Mức trọng lượng bán thực tế" />
        <StatCard label="Combo" value={String(metrics.combos)} description="Sản phẩm bán dạng combo" />
        <StatCard label="Khách hàng" value={String(metrics.customers)} description="Master data khách" />
        <StatCard label="Nhân viên" value={String(metrics.employees)} description="Nhân viên bán hàng" />
        <StatCard label="Đơn hôm nay" value={String(metrics.ordersToday)} description="Số đơn trong ngày" tone="success" />
        <StatCard label="Doanh thu hôm nay" value={toCurrency(metrics.revenueToday)} description="Tổng tiền sau ship/giảm giá" tone="success" />
        <StatCard label="Đơn chưa thanh toán" value={String(metrics.unpaidOrders)} description="Cần follow-up" tone="warning" />
      </section>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <p className="section-title">Go-live checklist</p>
            <p className="muted">Những bước nên làm ngay sau khi clone repo.</p>
          </div>
        </div>

        <ul className="checklist">
          <li>Tạo project Supabase và điền `.env.local`.</li>
          <li>Chạy `supabase/migrations/0001_init.sql`.</li>
          <li>Seed dữ liệu hoặc import từ file Excel đầu kỳ.</li>
          <li>Rà lại mã món, mã combo, mã khách, mã nhân viên theo chuẩn code.</li>
          <li>Khoá mẫu bill, trạng thái đơn hàng và quy tắc tính tiền.</li>
        </ul>
      </section>
    </div>
  );
}

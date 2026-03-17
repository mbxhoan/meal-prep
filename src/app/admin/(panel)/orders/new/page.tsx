import { OrderBuilder, PageHeader } from "@/features/admin/components";
import { getMenuProducts } from "@/lib/admin/service";

export default async function AdminNewOrderPage() {
  const products = await getMenuProducts();

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="New order"
        title="Tạo đơn và cho hệ thống tự tính"
        description="Order builder lấy giá bán và cost profile từ menu editor. Khi bấm lưu, payload sẽ insert vào orders và order_items; phần còn lại để Supabase trigger tự tính doanh thu, COGS, gross profit và có thể trừ kho."
      />

      <OrderBuilder products={products} />
    </div>
  );
}

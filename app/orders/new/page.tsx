import { OrderForm } from '@/components/forms/order-form';
import { PageHeader } from '@/components/ui/page-header';
import { getOrderFormData } from '@/lib/repository/orders';

export default async function NewOrderPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, formData] = await Promise.all([searchParams, getOrderFormData()]);

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Transactions"
        title="Tạo đơn hàng"
        description="Tạo đơn bán hàng với nhiều món lẻ hoặc combo, lưu snapshot giá tại thời điểm bán."
      />

      <OrderForm
        customers={formData.customers}
        employees={formData.employees}
        variants={formData.variants}
        combos={formData.combos}
        hasLiveDatabase={formData.hasLiveDatabase}
        error={params.error}
      />
    </div>
  );
}

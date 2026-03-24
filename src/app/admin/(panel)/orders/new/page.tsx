import { OrderBuilder } from "@/features/admin/components";
import { getSalesOrderBuilderData } from "@/lib/sales/service";

export default async function AdminNewOrderPage() {
  const builderData = await getSalesOrderBuilderData();

  return (
    <div className="space-y-5 pb-8">
      <OrderBuilder products={builderData.products} />
    </div>
  );
}

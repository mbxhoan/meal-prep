import { OrderBuilder } from "@/features/admin/components";
import { getMenuProducts } from "@/lib/admin/service";

export default async function AdminNewOrderPage() {
  const products = await getMenuProducts();

  return (
    <div className="space-y-5 pb-8">
      <OrderBuilder products={products} />
    </div>
  );
}

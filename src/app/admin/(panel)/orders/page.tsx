import { OrdersListPanel } from "@/features/admin/components/OrdersListPanel";
import { getOrders } from "@/lib/admin/service";

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return <OrdersListPanel orders={orders} />;
}

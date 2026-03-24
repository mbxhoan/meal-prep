import { notFound, redirect } from "next/navigation";
import { SalesOrderBill } from "@/features/sales/components/SalesOrderBill";
import { getAdminContext } from "@/lib/admin/service";
import { getSalesOrderById } from "@/lib/sales/service";

export default async function AdminOrderBillPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const context = await getAdminContext();

  if (
    !context.permissions.includes("sales.bill.read") &&
    !context.permissions.includes("sales.order.read")
  ) {
    redirect("/admin/orders");
  }

  const order = await getSalesOrderById(orderId);

  if (!order) {
    notFound();
  }

  const canRefreshPrice = context.permissions.includes("sales.order.refresh_price");
  const canUpdateStatus =
    context.permissions.includes("sales.order.update_draft") ||
    context.permissions.includes("sales.order.send") ||
    context.permissions.includes("sales.order.confirm") ||
    context.permissions.includes("sales.order.cancel");
  const canRecordPayment = context.permissions.includes("sales.payment.record");

  return (
    <div className="space-y-5 pb-8">
      <SalesOrderBill
        order={order}
        canRefreshPrice={canRefreshPrice}
        canUpdateStatus={canUpdateStatus}
        canRecordPayment={canRecordPayment}
      />
    </div>
  );
}

import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import {
  PageHeader,
  StatusPill,
  statusTone,
} from "@/features/admin/components";
import { formatCurrency, formatDate, formatPercent } from "@/lib/admin/format";
import { getOrders } from "@/lib/admin/service";

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Orders"
        title="Đơn hàng và lời lãi theo từng đơn"
        description="Mỗi đơn được lưu cùng revenue, COGS và gross profit. Khi order có status confirmed hoặc completed, hệ thống có thể tự trừ tồn kho theo recipe."
        action={
          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Tạo đơn
            <FaArrowRight className="text-xs" />
          </Link>
        }
      />

      <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="overflow-hidden rounded-[26px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Đơn</th>
                <th className="px-4 py-3 font-medium">Khách</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">COGS</th>
                <th className="px-4 py-3 font-medium">Profit</th>
                <th className="px-4 py-3 font-medium">Margin</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{order.orderNumber}</p>
                    <p className="mt-1 text-slate-500">{formatDate(order.orderedAt)}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-800">{order.customerName}</p>
                    <p className="mt-1 text-slate-500">{order.salesChannel}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {order.items.length} lines
                  </td>
                  <td className="px-4 py-4 align-top font-medium text-slate-900">
                    {formatCurrency(order.totalRevenue)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {formatCurrency(order.totalCogs)}
                  </td>
                  <td className="px-4 py-4 align-top font-medium text-emerald-700">
                    {formatCurrency(order.grossProfit)}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-500">
                    {formatPercent(order.grossMargin)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill
                      label={order.status}
                      tone={statusTone(order.status)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

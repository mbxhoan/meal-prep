import {
  ExportExcelButton,
  PageHeader,
} from "@/features/admin/components";
import { formatCurrency } from "@/lib/admin/format";
import { getOrders } from "@/lib/admin/service";

function sumPayments(order: (Awaited<ReturnType<typeof getOrders>>)[number]) {
  return (order.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);
}

export default async function AdminAnalyticsPage() {
  const orders = await getOrders();
  const validOrders = orders.filter((order) => order.paymentStatus !== "void");
  const totalOrders = validOrders.length;
  const totalRevenue = validOrders.reduce(
    (sum, order) => sum + (order.totalAmount ?? order.totalRevenue),
    0,
  );
  const shippingTotal = validOrders.reduce((sum, order) => sum + order.shippingFee, 0);
  const realRevenue = totalRevenue - shippingTotal;
  const totalCogs = validOrders.reduce((sum, order) => sum + order.totalCogs, 0);
  const grossProfit = validOrders.reduce((sum, order) => sum + order.grossProfit, 0);
  const paidTotal = validOrders.reduce((sum, order) => sum + sumPayments(order), 0);
  const receivableTotal = validOrders.reduce(
    (sum, order) => sum + Math.max((order.totalAmount ?? order.totalRevenue) - sumPayments(order), 0),
    0,
  );

  const summaryRows = [
    { key: "Tổng đơn", value: String(totalOrders) },
    { key: "Tổng doanh thu", value: formatCurrency(totalRevenue) },
    { key: "Doanh thu thực", value: formatCurrency(realRevenue) },
    { key: "Tổng vốn", value: formatCurrency(totalCogs) },
    { key: "Lợi nhuận", value: formatCurrency(grossProfit) },
    { key: "Đã thanh toán", value: formatCurrency(paidTotal) },
    { key: "Còn phải thu", value: formatCurrency(receivableTotal) },
    { key: "Tổng phí ship", value: formatCurrency(shippingTotal) },
  ];

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        eyebrow="Báo cáo"
        title="Doanh thu"
        description="Bảng tổng hợp theo kiểu sheet, chỉ giữ số chính để dễ đọc."
        action={
          <ExportExcelButton
            filename={`tong-hop-doanh-thu-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Tổng hợp"
            title="Xuất Excel tổng hợp"
            columns={[
              { key: "chỉ_số", label: "Chỉ số" },
              { key: "giá_trị", label: "Giá trị" },
            ]}
            rows={summaryRows.map((row) => ({
              chỉ_số: row.key,
              giá_trị: row.value,
            }))}
          />
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryRows.map((row) => (
          <div
            key={row.key}
            className="rounded-[22px] border border-white/70 bg-white/90 p-3.5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              {row.key}
            </p>
            <p className="mt-1.5 text-base font-semibold text-slate-900">
              {row.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Tổng hợp
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Bảng số chính
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">
              Số liệu này lấy từ các đơn đang hoạt động, không tính đơn hủy.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Chỉ số</th>
                <th className="px-4 py-3 font-medium">Giá trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {summaryRows.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-3 text-slate-700">{row.key}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

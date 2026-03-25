import {
  ExportExcelButton,
  StatusPill,
} from "@/features/admin/components";
import { formatCurrency, formatPercent } from "@/lib/admin/format";
import { getAnalytics, getOrders } from "@/lib/admin/service";

function formatSalesChannelLabel(channel: string) {
  switch (channel) {
    case "website":
      return "Trang web";
    case "facebook":
      return "Facebook";
    case "zalo":
      return "Zalo";
    case "store":
      return "Cửa hàng";
    case "grab":
      return "Grab / ứng dụng";
    case "manual":
      return "Thủ công";
    default:
      return channel;
  }
}

export default async function AdminAnalyticsPage() {
  const [analytics, orders] = await Promise.all([getAnalytics(), getOrders()]);
  const totalRevenue = analytics.reduce((sum, point) => sum + point.revenue, 0);
  const totalProfit = analytics.reduce((sum, point) => sum + point.profit, 0);
  const totalCogs = analytics.reduce((sum, point) => sum + point.cogs, 0);
  const peakRevenue = Math.max(...analytics.map((point) => point.revenue), 1);

  const channelMap = new Map<string, { revenue: number; orders: number }>();

  for (const order of orders) {
    if (order.status === "draft" || order.status === "cancelled") {
      continue;
    }

    const current = channelMap.get(order.salesChannel);
    channelMap.set(order.salesChannel, {
      revenue: (current?.revenue ?? 0) + order.totalRevenue,
      orders: (current?.orders ?? 0) + 1,
    });
  }

  const channels = [...channelMap.entries()].sort(
    (left, right) => right[1].revenue - left[1].revenue,
  );
  const exportRows = analytics.map((point) => ({
    ngày: point.date,
    doanh_thu: formatCurrency(point.revenue),
    giá_vốn: formatCurrency(point.cogs),
    lợi_nhuận: formatCurrency(point.profit),
    số_đơn: point.orders,
  }));

  return (
    <div className="space-y-4 pb-8">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Báo cáo
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Doanh thu và lợi nhuận theo ngày
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Tóm tắt 7 ngày gần nhất theo doanh thu, giá vốn và biên lợi nhuận.
          </p>
        </div>
        <ExportExcelButton
          filename={`bao-cao-doanh-thu-${new Date().toISOString().slice(0, 10)}`}
          sheetName="Báo cáo doanh thu"
          title="Xuất Excel báo cáo doanh thu"
          columns={[
            { key: "ngày", label: "Ngày" },
            { key: "doanh_thu", label: "Doanh thu" },
            { key: "giá_vốn", label: "Giá vốn" },
            { key: "lợi_nhuận", label: "Lợi nhuận" },
            { key: "số_đơn", label: "Số đơn" },
          ]}
          rows={exportRows}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Doanh thu 7 ngày
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Giá vốn 7 ngày
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrency(totalCogs)}
          </p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Biên lợi nhuận 7 ngày
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatPercent(totalRevenue > 0 ? totalProfit / totalRevenue : 0)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Hiệu suất theo ngày
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Doanh thu so với lợi nhuận
          </h2>

          <div className="mt-6 space-y-4">
            {analytics.map((point) => {
              const revenueWidth = `${Math.max((point.revenue / peakRevenue) * 100, 8)}%`;
              const profitWidth = `${Math.max((point.profit / peakRevenue) * 100, 4)}%`;

              return (
                <div key={point.date} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{point.date}</span>
                    <span>{point.orders} đơn</span>
                  </div>
                  <div className="rounded-full bg-slate-100 p-1">
                    <div
                      className="h-5 rounded-full bg-[#18352d]"
                      style={{ width: revenueWidth }}
                    />
                  </div>
                  <div className="rounded-full bg-slate-100 p-1">
                    <div
                      className="h-4 rounded-full bg-emerald-400"
                      style={{ width: profitWidth }}
                    />
                  </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                      Doanh thu {formatCurrency(point.revenue)}
                    </span>
                    <span className="font-medium text-emerald-700">
                      Lợi nhuận {formatCurrency(point.profit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Cơ cấu kênh bán
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Kênh nào đang mang doanh thu
          </h2>

          <div className="mt-6 space-y-4">
            {channels.map(([channel, summary], index) => (
              <div
                key={channel}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{formatSalesChannelLabel(channel)}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {summary.orders} đơn trong 7 ngày
                    </p>
                  </div>
                  <StatusPill
                    label={`Hạng ${index + 1}`}
                    tone={index === 0 ? "accent" : "muted"}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>Doanh thu</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(summary.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

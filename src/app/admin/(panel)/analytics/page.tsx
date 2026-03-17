import { PageHeader, StatusPill } from "@/features/admin/components";
import { formatCurrency, formatPercent } from "@/lib/admin/format";
import { getAnalytics, getOrders } from "@/lib/admin/service";

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

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Analytics"
        title="Doanh thu và lợi nhuận theo ngày"
        description="Trang này giúp nhìn rõ sau khi nhập cost mới thì margin đang thay đổi thế nào theo ngày và theo từng kênh bán."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Revenue 7d
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            COGS 7d
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {formatCurrency(totalCogs)}
          </p>
        </div>
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Margin 7d
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {formatPercent(totalRevenue > 0 ? totalProfit / totalRevenue : 0)}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Daily performance
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Revenue vs profit theo ngày
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
                      Revenue {formatCurrency(point.revenue)}
                    </span>
                    <span className="font-medium text-emerald-700">
                      Profit {formatCurrency(point.profit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
            Channel mix
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Kênh nào đang mang doanh thu
          </h2>

          <div className="mt-6 space-y-4">
            {channels.map(([channel, summary], index) => (
              <div
                key={channel}
                className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{channel}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {summary.orders} đơn trong 7 ngày
                    </p>
                  </div>
                  <StatusPill
                    label={`Top ${index + 1}`}
                    tone={index === 0 ? "accent" : "muted"}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>Revenue</span>
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

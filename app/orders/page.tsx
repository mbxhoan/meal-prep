import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { listOrders } from '@/lib/repository/orders';
import { formatDate } from '@/lib/format';
import { toCurrency } from '@/lib/utils';
import { deleteOrderAction, updateOrderStatusesAction } from './actions';

function toneForStatus(value: string) {
  if (['paid', 'confirmed', 'completed', 'delivered'].includes(value)) return 'success';
  if (['unpaid', 'cancelled', 'failed'].includes(value)) return 'danger';
  return 'warning';
}

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; orderStatus?: string; error?: string }>;
}) {
  const params = await searchParams;
  const rows = await listOrders(params);

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Transactions"
        title="Đơn hàng"
        description="Danh sách đơn bán hàng, tổng tiền, thanh toán và giao hàng."
        actions={
          <div className="header-actions-inline">
            <Link href="/orders/new" className="primary-button">
              Tạo đơn mới
            </Link>
          </div>
        }
      />

      {params.error ? <div className="alert alert-danger">Không thể thao tác vì chưa cấu hình Supabase.</div> : null}

      <form className="filter-bar">
        <input name="q" defaultValue={params.q} className="text-input" placeholder="Tìm theo mã đơn, khách hoặc nhân viên..." />
        <select name="orderStatus" defaultValue={params.orderStatus} className="text-input">
          <option value="">Tất cả trạng thái đơn</option>
          <option value="draft">draft</option>
          <option value="confirmed">confirmed</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button className="primary-button" type="submit">
          Lọc dữ liệu
        </button>
      </form>

      <DataTable
        rows={rows}
        columns={[
          { key: 'order_code', header: 'Mã đơn' },
          {
            key: 'order_date',
            header: 'Ngày',
            render: (item) => formatDate(item.order_date)
          },
          { key: 'customer_name', header: 'Khách hàng' },
          { key: 'employee_name', header: 'Nhân viên' },
          {
            key: 'shipper_name',
            header: 'Shipper',
            render: (item) => (
              <span>
                {item.shipper_name || '-'}
                {item.shipper_phone ? <span className="muted"> · {item.shipper_phone}</span> : null}
              </span>
            )
          },
          {
            key: 'subtotal_amount',
            header: 'Tạm tính',
            render: (item) => toCurrency(item.subtotal_amount)
          },
          {
            key: 'shipping_fee',
            header: 'Ship',
            render: (item) => toCurrency(item.shipping_fee)
          },
          {
            key: 'discount_amount',
            header: 'Giảm giá',
            render: (item) => toCurrency(item.discount_amount)
          },
          {
            key: 'total_amount',
            header: 'Tổng',
            render: (item) => toCurrency(item.total_amount)
          },
          {
            key: 'order_status',
            header: 'Đơn',
            render: (item) => <Badge tone={toneForStatus(item.order_status) as 'success' | 'warning' | 'danger'}>{item.order_status}</Badge>
          },
          {
            key: 'payment_status',
            header: 'Thanh toán',
            render: (item) => <Badge tone={toneForStatus(item.payment_status) as 'success' | 'warning' | 'danger'}>{item.payment_status}</Badge>
          },
          {
            key: 'delivery_status',
            header: 'Giao hàng',
            render: (item) => <Badge tone={toneForStatus(item.delivery_status) as 'success' | 'warning' | 'danger'}>{item.delivery_status}</Badge>
          },
          {
            key: 'status_actions',
            header: 'Cập nhật',
            render: (item) => (
              <form action={updateOrderStatusesAction} className="status-form">
                <input type="hidden" name="id" value={item.id} />
                <select name="order_status" defaultValue={item.order_status} className="text-input status-select">
                  <option value="draft">draft</option>
                  <option value="confirmed">confirmed</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <select name="payment_status" defaultValue={item.payment_status} className="text-input status-select">
                  <option value="unpaid">unpaid</option>
                  <option value="partial">partial</option>
                  <option value="paid">paid</option>
                </select>
                <select name="delivery_status" defaultValue={item.delivery_status} className="text-input status-select">
                  <option value="pending">pending</option>
                  <option value="preparing">preparing</option>
                  <option value="shipping">shipping</option>
                  <option value="delivered">delivered</option>
                  <option value="failed">failed</option>
                </select>
                <button type="submit" className="secondary-button compact-button">
                  Lưu
                </button>
              </form>
            )
          },
          {
            key: 'delete',
            header: 'Xóa',
            render: (item) => (
              <form action={deleteOrderAction}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="danger-button compact-button">
                  Xóa
                </button>
              </form>
            )
          }
        ]}
      />
    </div>
  );
}

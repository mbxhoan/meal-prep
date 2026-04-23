import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { listCustomers } from '@/lib/repository/customers';
import { toCurrency } from '@/lib/utils';

export default async function CustomersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const rows = await listCustomers(params);

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Master data"
        title="Khách hàng"
        description="Danh bạ khách mua để gắn vào đơn hàng, bill và lịch sử mua hàng."
      />

      <form className="filter-bar">
        <input name="q" defaultValue={params.q} className="text-input" placeholder="Tìm theo mã, tên hoặc điện thoại..." />
        <button className="primary-button" type="submit">
          Lọc dữ liệu
        </button>
      </form>

      <DataTable
        rows={rows}
        columns={[
          { key: 'customer_code', header: 'Mã khách' },
          { key: 'name', header: 'Tên khách' },
          { key: 'phone', header: 'Điện thoại' },
          { key: 'address', header: 'Địa chỉ' },
          { key: 'total_orders', header: 'Số đơn' },
          {
            key: 'total_spent',
            header: 'Tổng chi',
            render: (item) => toCurrency(item.total_spent)
          },
          {
            key: 'is_active',
            header: 'Trạng thái',
            render: (item) => <Badge tone={item.is_active ? 'success' : 'danger'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>
          }
        ]}
      />
    </div>
  );
}

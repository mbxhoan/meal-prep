import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { listEmployees } from '@/lib/repository/employees';
import { toCurrency } from '@/lib/utils';

export default async function EmployeesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const rows = await listEmployees(params);

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Master data"
        title="Nhân viên"
        description="Nhân viên bán / giới thiệu đơn hàng."
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
          { key: 'employee_code', header: 'Mã NV' },
          { key: 'name', header: 'Tên nhân viên' },
          { key: 'phone', header: 'Điện thoại' },
          { key: 'total_orders', header: 'Số đơn' },
          {
            key: 'total_revenue',
            header: 'Doanh số',
            render: (item) => toCurrency(item.total_revenue)
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

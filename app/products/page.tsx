import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { listProducts } from '@/lib/repository/products';

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const rows = await listProducts(params);

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Master data"
        title="Món hàng"
        description="Quản lý món cha. Mỗi món có thể có nhiều biến thể trọng lượng và bảng giá riêng."
        actions={
          <div className="header-actions-inline">
            <Link href="/imports/master-data" className="secondary-button">
              Import Excel
            </Link>
          </div>
        }
      />

      <form className="filter-bar">
        <input name="q" defaultValue={params.q} className="text-input" placeholder="Tìm theo mã hoặc tên món..." />
        <input name="category" defaultValue={params.category} className="text-input" placeholder="Lọc theo nhóm món..." />
        <button className="primary-button" type="submit">
          Lọc dữ liệu
        </button>
      </form>

      <DataTable
        rows={rows}
        columns={[
          { key: 'product_code', header: 'Mã món' },
          { key: 'product_name', header: 'Tên món' },
          { key: 'category_name', header: 'Nhóm món' },
          { key: 'variants_count', header: 'Số biến thể' },
          {
            key: 'is_active',
            header: 'Trạng thái',
            render: (item) => <Badge tone={item.is_active ? 'success' : 'danger'}>{item.is_active ? 'Đang bán' : 'Ngưng'}</Badge>
          }
        ]}
      />
    </div>
  );
}

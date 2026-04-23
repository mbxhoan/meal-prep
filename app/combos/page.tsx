import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { listCombos } from '@/lib/repository/combos';
import { toCurrency } from '@/lib/utils';

export default async function CombosPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const rows = await listCombos(params);

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Master data"
        title="Combo"
        description="Combo là sản phẩm bán gộp nhiều món/trọng lượng với giá bán rẻ hơn mua lẻ."
      />

      <form className="filter-bar">
        <input name="q" defaultValue={params.q} className="text-input" placeholder="Tìm theo mã hoặc tên combo..." />
        <button className="primary-button" type="submit">
          Lọc dữ liệu
        </button>
      </form>

      <DataTable
        rows={rows}
        columns={[
          { key: 'combo_code', header: 'Mã combo' },
          { key: 'combo_name', header: 'Tên combo' },
          { key: 'items_count', header: 'Số thành phần' },
          {
            key: 'sale_price',
            header: 'Giá bán',
            render: (item) => toCurrency(item.sale_price)
          },
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

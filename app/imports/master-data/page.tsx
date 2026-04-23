import Link from 'next/link';
import { UploadMasterDataForm } from '@/components/forms/upload-master-data-form';
import { PageHeader } from '@/components/ui/page-header';

const requiredSheets = [
  'product_categories',
  'products',
  'product_variants',
  'combos',
  'combo_items',
  'customers',
  'employees'
];

export default function ImportMasterDataPage() {
  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Operations"
        title="Nạp Excel master data"
        description="Upload workbook để nạp dữ liệu danh mục đầu kỳ. Route import sẽ validate trước, sau đó mới upsert vào database."
        actions={
          <div className="header-actions-inline">
            <Link href="/mealfit_import_template.xlsx" className="secondary-button">
              Tải template trong repo
            </Link>
          </div>
        }
      />

      <div className="two-col-grid">
        <section className="content-card stack-md">
          <p className="section-title">Sheet cần có</p>
          <ol className="ordered-list">
            {requiredSheets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>

          <div className="note-box">
            <p className="section-title">Rule quan trọng</p>
            <ul className="checklist compact">
              <li>Import theo thứ tự chuẩn trong docs.</li>
              <li>Không xoá dữ liệu cũ nếu file không chứa record đó.</li>
              <li>Combo item phải resolve được tới variant.</li>
              <li>Nếu thiếu `variant_code`, hệ thống sẽ thử tự generate từ product + weight.</li>
            </ul>
          </div>
        </section>

        <UploadMasterDataForm />
      </div>
    </div>
  );
}

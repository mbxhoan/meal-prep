import { PageHeader } from '@/components/ui/page-header';
import { demoCombos, demoCustomers, demoEmployees, demoVariants } from '@/lib/demo-data';
import { toCurrency } from '@/lib/utils';

export default function NewOrderPage() {
  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Transactions"
        title="Form mẫu tạo đơn hàng"
        description="Đây là form khung để dev tiếp tục triển khai CRUD thật. Cấu trúc field đã bám đúng nghiệp vụ đã chốt."
      />

      <div className="two-col-grid">
        <section className="content-card stack-md">
          <p className="section-title">1. Thông tin đầu đơn</p>

          <label className="field">
            <span>Khách hàng</span>
            <select className="text-input">
              {demoCustomers.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Nhân viên bán</span>
            <select className="text-input">
              {demoEmployees.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Địa chỉ giao</span>
            <input className="text-input" defaultValue="Thủ Đức, TP.HCM" />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Phí ship</span>
              <input className="text-input" defaultValue="15000" />
            </label>
            <label className="field">
              <span>Giảm giá</span>
              <input className="text-input" defaultValue="10000" />
            </label>
          </div>

          <label className="field">
            <span>Ghi chú</span>
            <textarea className="text-area" defaultValue="Gọi khách trước khi giao." />
          </label>
        </section>

        <section className="content-card stack-md">
          <p className="section-title">2. Dòng hàng</p>

          <div className="line-item-card">
            <div className="line-top">
              <strong>Món lẻ</strong>
              <span className="muted">line_type = product_variant</span>
            </div>
            <select className="text-input">
              {demoVariants.map((item) => (
                <option key={item.variant_code}>
                  {item.label} - {toCurrency(item.sale_price)}
                </option>
              ))}
            </select>
            <input className="text-input" defaultValue="1" />
          </div>

          <div className="line-item-card">
            <div className="line-top">
              <strong>Combo</strong>
              <span className="muted">line_type = combo</span>
            </div>
            <select className="text-input">
              {demoCombos.map((item) => (
                <option key={item.combo_code}>
                  {item.combo_name} - {toCurrency(item.sale_price)}
                </option>
              ))}
            </select>
            <input className="text-input" defaultValue="1" />
          </div>

          <div className="bill-summary">
            <div className="summary-row">
              <span>Tạm tính</span>
              <strong>{toCurrency(189000)}</strong>
            </div>
            <div className="summary-row">
              <span>Giảm giá</span>
              <strong>{toCurrency(10000)}</strong>
            </div>
            <div className="summary-row">
              <span>Phí ship</span>
              <strong>{toCurrency(15000)}</strong>
            </div>
            <div className="summary-row total-row">
              <span>Tổng thanh toán</span>
              <strong>{toCurrency(194000)}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { createOrderAction } from '@/app/orders/actions';
import type { OrderComboOption, OrderCustomerOption, OrderEmployeeOption, OrderVariantOption } from '@/lib/repository/orders';
import { toCurrency, toNumber } from '@/lib/utils';

type OrderLine = {
  key: string;
  lineType: 'product_variant' | 'combo';
  itemId: string;
  qty: number;
};

function makeLine(lineType: OrderLine['lineType'], itemId: string): OrderLine {
  return {
    key: `${lineType}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    lineType,
    itemId,
    qty: 1
  };
}

function currentItem(
  line: OrderLine,
  variants: OrderVariantOption[],
  combos: OrderComboOption[]
) {
  if (line.lineType === 'product_variant') {
    return variants.find((item) => item.id === line.itemId);
  }

  return combos.find((item) => item.id === line.itemId);
}

export function OrderForm({
  customers,
  employees,
  variants,
  combos,
  hasLiveDatabase,
  error
}: {
  customers: OrderCustomerOption[];
  employees: OrderEmployeeOption[];
  variants: OrderVariantOption[];
  combos: OrderComboOption[];
  hasLiveDatabase: boolean;
  error?: string;
}) {
  const firstCustomer = customers[0];
  const [customerId, setCustomerId] = useState(firstCustomer?.id ?? '');
  const [phone, setPhone] = useState(firstCustomer?.phone ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(firstCustomer?.address ?? '');
  const [shippingFee, setShippingFee] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [lines, setLines] = useState<OrderLine[]>([
    makeLine('product_variant', variants[0]?.id ?? ''),
    makeLine('combo', combos[0]?.id ?? '')
  ].filter((item) => item.itemId));

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const item = currentItem(line, variants, combos);
        return sum + (item?.sale_price ?? 0) * line.qty;
      }, 0),
    [combos, lines, variants]
  );
  const shipping = Math.max(toNumber(shippingFee), 0);
  const discount = Math.max(toNumber(discountAmount), 0);
  const total = Math.max(subtotal - discount, 0) + shipping;

  function updateLine(key: string, patch: Partial<OrderLine>) {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        const nextLineType = patch.lineType ?? line.lineType;
        const fallbackItemId = nextLineType === 'product_variant' ? variants[0]?.id ?? '' : combos[0]?.id ?? '';
        return {
          ...line,
          ...patch,
          itemId: patch.lineType && patch.lineType !== line.lineType ? fallbackItemId : patch.itemId ?? line.itemId,
          qty: Math.max(toNumber(patch.qty ?? line.qty), 1)
        };
      })
    );
  }

  function addLine(lineType: OrderLine['lineType']) {
    const itemId = lineType === 'product_variant' ? variants[0]?.id ?? '' : combos[0]?.id ?? '';
    if (!itemId) return;
    setLines((current) => [...current, makeLine(lineType, itemId)]);
  }

  function removeLine(key: string) {
    setLines((current) => current.filter((line) => line.key !== key));
  }

  return (
    <form action={createOrderAction} className="stack-lg">
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {!hasLiveDatabase ? (
        <div className="alert alert-warning">Đang dùng demo data. Cần cấu hình Supabase để lưu đơn hàng thật.</div>
      ) : null}

      <div className="order-layout">
        <section className="content-card stack-md">
          <p className="section-title">1. Thông tin đầu đơn</p>

          <div className="form-row">
            <label className="field">
              <span>Khách hàng</span>
              <select
                name="customer_id"
                className="text-input"
                value={customerId}
                onChange={(event) => {
                  const nextCustomer = customers.find((item) => item.id === event.target.value);
                  setCustomerId(event.target.value);
                  setPhone(nextCustomer?.phone ?? '');
                  setDeliveryAddress(nextCustomer?.address ?? '');
                }}
              >
                {customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Nhân viên bán</span>
              <select name="employee_id" className="text-input" defaultValue={employees[0]?.id ?? ''}>
                {employees.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>SĐT khách</span>
              <input name="phone" className="text-input" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <label className="field">
              <span>Địa chỉ giao</span>
              <input
                name="delivery_address"
                className="text-input"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Shipper</span>
              <input name="shipper_name" className="text-input" placeholder="Không bắt buộc" />
            </label>
            <label className="field">
              <span>SĐT shipper</span>
              <input name="shipper_phone" className="text-input" placeholder="Không bắt buộc" />
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Phí ship</span>
              <input
                name="shipping_fee"
                className="text-input"
                inputMode="numeric"
                value={shippingFee}
                onChange={(event) => setShippingFee(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Giảm giá</span>
              <input
                name="discount_amount"
                className="text-input"
                inputMode="numeric"
                value={discountAmount}
                onChange={(event) => setDiscountAmount(event.target.value)}
              />
            </label>
          </div>

          <div className="form-row three-cols">
            <label className="field">
              <span>Trạng thái đơn</span>
              <select name="order_status" className="text-input" defaultValue="confirmed">
                <option value="draft">draft</option>
                <option value="confirmed">confirmed</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </label>
            <label className="field">
              <span>Thanh toán</span>
              <select name="payment_status" className="text-input" defaultValue="unpaid">
                <option value="unpaid">unpaid</option>
                <option value="partial">partial</option>
                <option value="paid">paid</option>
              </select>
            </label>
            <label className="field">
              <span>Giao hàng</span>
              <select name="delivery_status" className="text-input" defaultValue="pending">
                <option value="pending">pending</option>
                <option value="preparing">preparing</option>
                <option value="shipping">shipping</option>
                <option value="delivered">delivered</option>
                <option value="failed">failed</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Ghi chú</span>
            <textarea name="note" className="text-area" />
          </label>
        </section>

        <section className="content-card stack-md">
          <div className="content-card-header">
            <p className="section-title">2. Dòng hàng</p>
            <div className="header-actions-inline">
              <button type="button" className="secondary-button compact-button" onClick={() => addLine('product_variant')}>
                + Món
              </button>
              <button type="button" className="secondary-button compact-button" onClick={() => addLine('combo')}>
                + Combo
              </button>
            </div>
          </div>

          <div className="order-lines">
            {lines.map((line, index) => {
              const items = line.lineType === 'product_variant' ? variants : combos;
              const item = currentItem(line, variants, combos);
              const lineTotal = (item?.sale_price ?? 0) * line.qty;

              return (
                <div key={line.key} className="order-line-row">
                  <input type="hidden" name="line_type" value={line.lineType} />
                  <input type="hidden" name="item_id" value={line.itemId} />
                  <input type="hidden" name="qty" value={line.qty} />

                  <div className="line-index">{index + 1}</div>
                  <select
                    className="text-input line-type-select"
                    value={line.lineType}
                    onChange={(event) => updateLine(line.key, { lineType: event.target.value as OrderLine['lineType'] })}
                  >
                    <option value="product_variant">Món lẻ</option>
                    <option value="combo">Combo</option>
                  </select>
                  <select className="text-input line-item-select" value={line.itemId} onChange={(event) => updateLine(line.key, { itemId: event.target.value })}>
                    {items.map((option) => (
                      <option key={option.id} value={option.id}>
                        {'combo_name' in option ? option.combo_name : option.label} - {toCurrency(option.sale_price)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="text-input line-qty-input"
                    inputMode="numeric"
                    value={line.qty}
                    onChange={(event) => updateLine(line.key, { qty: toNumber(event.target.value) })}
                  />
                  <strong className="line-total">{toCurrency(lineTotal)}</strong>
                  <button type="button" className="icon-button" onClick={() => removeLine(line.key)} aria-label="Xóa dòng hàng">
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bill-summary">
            <div className="summary-row">
              <span>Tạm tính</span>
              <strong>{toCurrency(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Giảm giá</span>
              <strong>{toCurrency(discount)}</strong>
            </div>
            <div className="summary-row">
              <span>Phí ship</span>
              <strong>{toCurrency(shipping)}</strong>
            </div>
            <div className="summary-row total-row">
              <span>Tổng thanh toán</span>
              <strong>{toCurrency(total)}</strong>
            </div>
          </div>

          <button className="primary-button submit-button" type="submit" disabled={!hasLiveDatabase || lines.length === 0}>
            Tạo đơn hàng
          </button>
        </section>
      </div>
    </form>
  );
}

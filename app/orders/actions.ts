'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminClient } from '@/lib/supabase/admin';
import { toNumber } from '@/lib/utils';

const orderStatuses = ['draft', 'confirmed', 'completed', 'cancelled'];
const paymentStatuses = ['unpaid', 'partial', 'paid'];
const deliveryStatuses = ['pending', 'preparing', 'shipping', 'delivered', 'failed'];

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function relatedOne<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function getDateParts() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const orderDate = formatter.format(new Date());
  return {
    orderDate,
    codeDate: orderDate.replace(/-/g, '')
  };
}

function redirectWithNewOrderError(message: string): never {
  redirect(`/orders/new?error=${encodeURIComponent(message)}`);
}

export async function createOrderAction(formData: FormData) {
  const client = getAdminClient();
  if (!client) redirectWithNewOrderError('Chưa cấu hình Supabase nên chưa thể lưu đơn thật.');

  const lineTypes = formData.getAll('line_type').map((item) => String(item));
  const itemIds = formData.getAll('item_id').map((item) => String(item));
  const qtyValues = formData.getAll('qty').map((item) => toNumber(item));
  const lines = lineTypes
    .map((lineType, index) => ({
      lineType,
      itemId: itemIds[index] ?? '',
      qty: qtyValues[index] > 0 ? qtyValues[index] : 1
    }))
    .filter((item) => ['product_variant', 'combo'].includes(item.lineType) && item.itemId);

  if (lines.length === 0) redirectWithNewOrderError('Đơn hàng cần ít nhất một dòng món hoặc combo.');

  const variantIds = lines.filter((item) => item.lineType === 'product_variant').map((item) => item.itemId);
  const comboIds = lines.filter((item) => item.lineType === 'combo').map((item) => item.itemId);

  const [variantsResult, combosResult] = await Promise.all([
    variantIds.length > 0
      ? client
          .from('product_variants')
          .select('id, variant_code, weight_label, sale_price, cost_price, products(product_name)')
          .in('id', variantIds)
      : Promise.resolve({ data: [], error: null }),
    comboIds.length > 0
      ? client
          .from('combos')
          .select('id, combo_code, combo_name, sale_price, cost_price, combo_items(qty, product_variants(variant_code, weight_label, sale_price, cost_price, products(product_name)))')
          .in('id', comboIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (variantsResult.error || combosResult.error) {
    redirectWithNewOrderError('Không đọc được dữ liệu món/combo để lưu snapshot giá.');
  }

  const variants = new Map(
    (variantsResult.data ?? []).map((item) => {
      const product = relatedOne(item.products as { product_name?: string } | { product_name?: string }[] | null);
      const productName = product?.product_name ?? '';
      return [
        item.id,
        {
          name: productName,
          weightLabel: item.weight_label ?? '',
          salePrice: Number(item.sale_price ?? 0),
          costPrice: Number(item.cost_price ?? 0)
        }
      ];
    })
  );

  const combos = new Map(
    (combosResult.data ?? []).map((item) => [
      item.id,
      {
        name: item.combo_name,
        salePrice: Number(item.sale_price ?? 0),
        costPrice: Number(item.cost_price ?? 0),
        detail: Array.isArray(item.combo_items)
          ? item.combo_items.map((comboItem) => {
              const variant = relatedOne(
                comboItem.product_variants as
                  | {
                      weight_label?: string;
                      sale_price?: number;
                      cost_price?: number;
                      products?: { product_name?: string } | { product_name?: string }[] | null;
                    }
                  | Array<{
                      weight_label?: string;
                      sale_price?: number;
                      cost_price?: number;
                      products?: { product_name?: string } | { product_name?: string }[] | null;
                    }>
                  | null
              );
              const product = relatedOne(variant?.products);
              return {
                name: [product?.product_name ?? '', variant?.weight_label ?? ''].filter(Boolean).join(' '),
                qty: Number(comboItem.qty ?? 0),
                sale_price: Number(variant?.sale_price ?? 0),
                cost_price: Number(variant?.cost_price ?? 0)
              };
            })
          : []
      }
    ])
  );

  const orderItems = lines.map((line, index) => {
    if (line.lineType === 'product_variant') {
      const variant = variants.get(line.itemId);
      if (!variant) redirectWithNewOrderError('Một dòng món lẻ không còn tồn tại.');
      const lineSubtotal = variant.salePrice * line.qty;
      const lineCostTotal = variant.costPrice * line.qty;
      return {
        line_type: 'product_variant',
        product_variant_id: line.itemId,
        combo_id: null,
        item_name_snapshot: variant.name,
        weight_label_snapshot: variant.weightLabel,
        combo_detail_snapshot: [],
        qty: line.qty,
        unit_price: variant.salePrice,
        cost_price: variant.costPrice,
        line_subtotal: lineSubtotal,
        line_cost_total: lineCostTotal,
        line_profit_total: lineSubtotal - lineCostTotal,
        sort_order: index + 1
      };
    }

    const combo = combos.get(line.itemId);
    if (!combo) redirectWithNewOrderError('Một dòng combo không còn tồn tại.');
    const lineSubtotal = combo.salePrice * line.qty;
    const lineCostTotal = combo.costPrice * line.qty;
    return {
      line_type: 'combo',
      product_variant_id: null,
      combo_id: line.itemId,
      item_name_snapshot: combo.name,
      weight_label_snapshot: '',
      combo_detail_snapshot: combo.detail,
      qty: line.qty,
      unit_price: combo.salePrice,
      cost_price: combo.costPrice,
      line_subtotal: lineSubtotal,
      line_cost_total: lineCostTotal,
      line_profit_total: lineSubtotal - lineCostTotal,
      sort_order: index + 1
    };
  });

  const subtotalAmount = orderItems.reduce((sum, item) => sum + item.line_subtotal, 0);
  const shippingFee = Math.max(toNumber(formData.get('shipping_fee')), 0);
  const discountAmount = Math.max(toNumber(formData.get('discount_amount')), 0);
  const totalAmount = Math.max(subtotalAmount - discountAmount, 0) + shippingFee;
  const { orderDate, codeDate } = getDateParts();
  const orderCode = `DH-${codeDate}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  const { data: order, error: orderError } = await client
    .from('sales_orders')
    .insert({
      order_code: orderCode,
      order_date: orderDate,
      customer_id: getString(formData, 'customer_id') || null,
      employee_id: getString(formData, 'employee_id') || null,
      delivery_address: getString(formData, 'delivery_address'),
      phone: getString(formData, 'phone'),
      shipper_name: getString(formData, 'shipper_name'),
      shipper_phone: getString(formData, 'shipper_phone'),
      shipping_fee: shippingFee,
      discount_type: 'amount',
      discount_value: discountAmount,
      discount_amount: discountAmount,
      subtotal_amount: subtotalAmount,
      total_amount: totalAmount,
      amount_paid: Math.max(toNumber(formData.get('amount_paid')), 0),
      order_status: orderStatuses.includes(getString(formData, 'order_status')) ? getString(formData, 'order_status') : 'confirmed',
      payment_status: paymentStatuses.includes(getString(formData, 'payment_status')) ? getString(formData, 'payment_status') : 'unpaid',
      delivery_status: deliveryStatuses.includes(getString(formData, 'delivery_status')) ? getString(formData, 'delivery_status') : 'pending',
      note: getString(formData, 'note')
    })
    .select('id')
    .single();

  if (orderError || !order) redirectWithNewOrderError('Không lưu được đầu đơn hàng.');

  const { error: itemsError } = await client.from('sales_order_items').insert(
    orderItems.map((item) => ({
      ...item,
      sales_order_id: order.id
    }))
  );

  if (itemsError) redirectWithNewOrderError('Đã tạo đầu đơn nhưng chưa lưu được dòng hàng.');

  revalidatePath('/orders');
  redirect('/orders');
}

export async function updateOrderStatusesAction(formData: FormData) {
  const client = getAdminClient();
  if (!client) redirect('/orders?error=missing-db');

  const id = getString(formData, 'id');
  const orderStatus = getString(formData, 'order_status');
  const paymentStatus = getString(formData, 'payment_status');
  const deliveryStatus = getString(formData, 'delivery_status');

  if (!id) redirect('/orders?error=missing-id');

  await client
    .from('sales_orders')
    .update({
      order_status: orderStatuses.includes(orderStatus) ? orderStatus : 'draft',
      payment_status: paymentStatuses.includes(paymentStatus) ? paymentStatus : 'unpaid',
      delivery_status: deliveryStatuses.includes(deliveryStatus) ? deliveryStatus : 'pending'
    })
    .eq('id', id);

  revalidatePath('/orders');
  redirect('/orders');
}

export async function deleteOrderAction(formData: FormData) {
  const client = getAdminClient();
  if (!client) redirect('/orders?error=missing-db');

  const id = getString(formData, 'id');
  if (id) await client.from('sales_orders').delete().eq('id', id);

  revalidatePath('/orders');
  redirect('/orders');
}

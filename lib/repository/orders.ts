import { demoOrders, demoKpis } from '@/lib/demo-data';
import { getAdminClient } from '@/lib/supabase/admin';

type OrderRow = {
  id: string;
  order_code: string;
  order_date: string;
  customer_name: string;
  employee_name: string;
  subtotal_amount: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  order_status: string;
  payment_status: string;
  delivery_status: string;
};

export async function listOrders(params?: { q?: string; orderStatus?: string }) {
  const client = getAdminClient();
  const q = params?.q?.trim().toLowerCase() ?? '';
  const orderStatus = params?.orderStatus?.trim().toLowerCase() ?? '';

  if (client) {
    const { data, error } = await client
      .from('sales_orders')
      .select('id, order_code, order_date, subtotal_amount, shipping_fee, discount_amount, total_amount, amount_paid, order_status, payment_status, delivery_status, customers(name), employees(name)')
      .order('order_date', { ascending: false });

    if (!error && data) {
      const mapped: OrderRow[] = data.map((row) => ({
        id: row.id,
        order_code: row.order_code,
        order_date: row.order_date,
        customer_name: Array.isArray(row.customers) ? '' : row.customers?.name ?? '',
        employee_name: Array.isArray(row.employees) ? '' : row.employees?.name ?? '',
        subtotal_amount: row.subtotal_amount,
        shipping_fee: row.shipping_fee,
        discount_amount: row.discount_amount,
        total_amount: row.total_amount,
        amount_paid: row.amount_paid,
        order_status: row.order_status,
        payment_status: row.payment_status,
        delivery_status: row.delivery_status
      }));

      return mapped.filter((item) => {
        const hitSearch =
          !q ||
          item.order_code.toLowerCase().includes(q) ||
          item.customer_name.toLowerCase().includes(q) ||
          item.employee_name.toLowerCase().includes(q);

        const hitStatus = !orderStatus || item.order_status.toLowerCase() === orderStatus;
        return hitSearch && hitStatus;
      });
    }
  }

  return demoOrders.filter((item) => {
    const hitSearch =
      !q ||
      item.order_code.toLowerCase().includes(q) ||
      item.customer_name.toLowerCase().includes(q) ||
      item.employee_name.toLowerCase().includes(q);
    const hitStatus = !orderStatus || item.order_status.toLowerCase() === orderStatus;
    return hitSearch && hitStatus;
  });
}

export async function getDashboardMetrics() {
  const client = getAdminClient();

  if (!client) return demoKpis;

  const [{ count: products }, { count: variants }, { count: combos }, { count: customers }, { count: employees }] =
    await Promise.all([
      client.from('products').select('*', { head: true, count: 'exact' }),
      client.from('product_variants').select('*', { head: true, count: 'exact' }),
      client.from('combos').select('*', { head: true, count: 'exact' }),
      client.from('customers').select('*', { head: true, count: 'exact' }),
      client.from('employees').select('*', { head: true, count: 'exact' })
    ]);

  return {
    ...demoKpis,
    products: products ?? demoKpis.products,
    variants: variants ?? demoKpis.variants,
    combos: combos ?? demoKpis.combos,
    customers: customers ?? demoKpis.customers,
    employees: employees ?? demoKpis.employees
  };
}

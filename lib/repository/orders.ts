import { demoCombos, demoCustomers, demoEmployees, demoKpis, demoOrders, demoVariants } from '@/lib/demo-data';
import { getAdminClient } from '@/lib/supabase/admin';

export type OrderRow = {
  id: string;
  order_code: string;
  order_date: string;
  customer_name: string;
  employee_name: string;
  shipper_name: string;
  shipper_phone: string;
  subtotal_amount: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  order_status: string;
  payment_status: string;
  delivery_status: string;
};

export type OrderCustomerOption = {
  id: string;
  name: string;
  phone: string;
  address: string;
};

export type OrderEmployeeOption = {
  id: string;
  name: string;
};

export type OrderVariantOption = {
  id: string;
  variant_code: string;
  label: string;
  product_name: string;
  weight_label: string;
  sale_price: number;
  cost_price: number;
};

export type OrderComboOption = {
  id: string;
  combo_code: string;
  combo_name: string;
  sale_price: number;
  cost_price: number;
  base_sale_price: number;
};

export type OrderFormData = {
  customers: OrderCustomerOption[];
  employees: OrderEmployeeOption[];
  variants: OrderVariantOption[];
  combos: OrderComboOption[];
  hasLiveDatabase: boolean;
};

function relatedOne<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function listOrders(params?: { q?: string; orderStatus?: string }) {
  const client = getAdminClient();
  const q = params?.q?.trim().toLowerCase() ?? '';
  const orderStatus = params?.orderStatus?.trim().toLowerCase() ?? '';

  if (client) {
    const { data, error } = await client
      .from('sales_orders')
      .select('id, order_code, order_date, subtotal_amount, shipping_fee, discount_amount, total_amount, amount_paid, order_status, payment_status, delivery_status, shipper_name, shipper_phone, customers(name), employees(name)')
      .order('order_date', { ascending: false });

    if (!error && data) {
      const mapped: OrderRow[] = data.map((row) => ({
        id: row.id,
        order_code: row.order_code,
        order_date: row.order_date,
        customer_name: relatedOne(row.customers as { name?: string } | { name?: string }[] | null)?.name ?? '',
        employee_name: relatedOne(row.employees as { name?: string } | { name?: string }[] | null)?.name ?? '',
        shipper_name: row.shipper_name ?? '',
        shipper_phone: row.shipper_phone ?? '',
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

export async function getOrderFormData(): Promise<OrderFormData> {
  const client = getAdminClient();

  if (client) {
    const [customersResult, employeesResult, variantsResult, combosResult] = await Promise.all([
      client.from('customers').select('id, name, phone, address').eq('is_active', true).order('name', { ascending: true }),
      client.from('employees').select('id, name').eq('is_active', true).order('name', { ascending: true }),
      client
        .from('product_variants')
        .select('id, variant_code, weight_label, sale_price, cost_price, products(product_name)')
        .eq('is_active', true)
        .order('variant_code', { ascending: true }),
      client
        .from('combos')
        .select('id, combo_code, combo_name, sale_price, cost_price, base_sale_price')
        .eq('is_active', true)
        .order('combo_name', { ascending: true })
    ]);

    if (!customersResult.error && !employeesResult.error && !variantsResult.error && !combosResult.error) {
      return {
        customers: (customersResult.data ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          phone: item.phone ?? '',
          address: item.address ?? ''
        })),
        employees: (employeesResult.data ?? []).map((item) => ({
          id: item.id,
          name: item.name
        })),
        variants: (variantsResult.data ?? []).map((item) => {
          const product = relatedOne(item.products as { product_name?: string } | { product_name?: string }[] | null);
          const productName = product?.product_name ?? '';
          return {
            id: item.id,
            variant_code: item.variant_code,
            label: [productName, item.weight_label].filter(Boolean).join(' '),
            product_name: productName,
            weight_label: item.weight_label ?? '',
            sale_price: Number(item.sale_price ?? 0),
            cost_price: Number(item.cost_price ?? 0)
          };
        }),
        combos: (combosResult.data ?? []).map((item) => ({
          id: item.id,
          combo_code: item.combo_code,
          combo_name: item.combo_name,
          sale_price: Number(item.sale_price ?? 0),
          cost_price: Number(item.cost_price ?? 0),
          base_sale_price: Number(item.base_sale_price ?? 0)
        })),
        hasLiveDatabase: true
      };
    }
  }

  return {
    customers: demoCustomers.map((item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone,
      address: item.address
    })),
    employees: demoEmployees.map((item) => ({
      id: item.id,
      name: item.name
    })),
    variants: demoVariants.map((item) => ({
      id: item.id,
      variant_code: item.variant_code,
      label: item.label,
      product_name: item.product_name,
      weight_label: item.weight_label,
      sale_price: item.sale_price,
      cost_price: item.cost_price
    })),
    combos: demoCombos.map((item) => ({
      id: item.id,
      combo_code: item.combo_code,
      combo_name: item.combo_name,
      sale_price: item.sale_price,
      cost_price: item.cost_price,
      base_sale_price: item.base_sale_price
    })),
    hasLiveDatabase: false
  };
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

import { demoCustomers } from '@/lib/demo-data';
import { getAdminClient } from '@/lib/supabase/admin';

type CustomerRow = {
  id: string;
  customer_code: string;
  name: string;
  phone: string;
  address: string;
  total_orders: number;
  total_spent: number;
  is_active: boolean;
};

export async function listCustomers(params?: { q?: string }) {
  const client = getAdminClient();
  const q = params?.q?.trim().toLowerCase() ?? '';

  if (client) {
    const { data, error } = await client
      .from('customers')
      .select('id, customer_code, name, phone, address, is_active')
      .order('name', { ascending: true });

    if (!error && data) {
      const mapped: CustomerRow[] = data.map((row) => ({
        id: row.id,
        customer_code: row.customer_code,
        name: row.name,
        phone: row.phone ?? '',
        address: row.address ?? '',
        total_orders: 0,
        total_spent: 0,
        is_active: row.is_active
      }));

      return mapped.filter((item) => {
        return (
          !q ||
          item.customer_code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q)
        );
      });
    }
  }

  return demoCustomers.filter((item) => {
    return !q || item.customer_code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.phone.toLowerCase().includes(q);
  });
}

import { demoEmployees } from '@/lib/demo-data';
import { getAdminClient } from '@/lib/supabase/admin';

type EmployeeRow = {
  id: string;
  employee_code: string;
  name: string;
  phone: string;
  total_orders: number;
  total_revenue: number;
  is_active: boolean;
};

export async function listEmployees(params?: { q?: string }) {
  const client = getAdminClient();
  const q = params?.q?.trim().toLowerCase() ?? '';

  if (client) {
    const { data, error } = await client
      .from('employees')
      .select('id, employee_code, name, phone, is_active')
      .order('name', { ascending: true });

    if (!error && data) {
      const mapped: EmployeeRow[] = data.map((row) => ({
        id: row.id,
        employee_code: row.employee_code,
        name: row.name,
        phone: row.phone ?? '',
        total_orders: 0,
        total_revenue: 0,
        is_active: row.is_active
      }));

      return mapped.filter((item) => {
        return !q || item.employee_code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.phone.toLowerCase().includes(q);
      });
    }
  }

  return demoEmployees.filter((item) => !q || item.employee_code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.phone.toLowerCase().includes(q));
}

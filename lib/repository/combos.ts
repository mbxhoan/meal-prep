import { demoCombos } from '@/lib/demo-data';
import { getAdminClient } from '@/lib/supabase/admin';

type ComboRow = {
  id: string;
  combo_code: string;
  combo_name: string;
  cost_price: number;
  base_sale_price: number;
  sale_price: number;
  items_count: number;
  is_active: boolean;
};

export async function listCombos(params?: { q?: string }) {
  const client = getAdminClient();
  const q = params?.q?.trim().toLowerCase() ?? '';

  if (client) {
    const { data, error } = await client
      .from('combos')
      .select('id, combo_code, combo_name, cost_price, base_sale_price, sale_price, is_active, combo_items(id)')
      .order('combo_name', { ascending: true });

    if (!error && data) {
      const mapped: ComboRow[] = data.map((row) => ({
        id: row.id,
        combo_code: row.combo_code,
        combo_name: row.combo_name,
        cost_price: Number(row.cost_price ?? 0),
        base_sale_price: Number(row.base_sale_price ?? 0),
        sale_price: row.sale_price,
        items_count: Array.isArray(row.combo_items) ? row.combo_items.length : 0,
        is_active: row.is_active
      }));

      return mapped.filter((item) => {
        return !q || item.combo_code.toLowerCase().includes(q) || item.combo_name.toLowerCase().includes(q);
      });
    }
  }

  return demoCombos.filter((item) => !q || item.combo_code.toLowerCase().includes(q) || item.combo_name.toLowerCase().includes(q));
}

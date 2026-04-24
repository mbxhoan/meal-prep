import { demoProducts } from '@/lib/demo-data';
import { getAdminClient } from '@/lib/supabase/admin';

type ProductRow = {
  id: string;
  product_code: string;
  product_name: string;
  category_name: string;
  variants_count: number;
  is_active: boolean;
};

function relatedOne<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function listProducts(params?: { q?: string; category?: string }) {
  const client = getAdminClient();
  const q = params?.q?.trim().toLowerCase() ?? '';
  const category = params?.category?.trim().toLowerCase() ?? '';

  if (client) {
    const { data, error } = await client
      .from('products')
      .select('id, product_code, product_name, is_active, product_categories(name), product_variants(id)')
      .order('product_name', { ascending: true });

    if (!error && data) {
      const mapped: ProductRow[] = data.map((row) => ({
        id: row.id,
        product_code: row.product_code,
        product_name: row.product_name,
        category_name: relatedOne(row.product_categories as { name?: string } | { name?: string }[] | null)?.name ?? '',
        variants_count: Array.isArray(row.product_variants) ? row.product_variants.length : 0,
        is_active: row.is_active
      }));

      return mapped.filter((item) => {
        const hitSearch =
          !q ||
          item.product_code.toLowerCase().includes(q) ||
          item.product_name.toLowerCase().includes(q);
        const hitCategory = !category || item.category_name.toLowerCase().includes(category);
        return hitSearch && hitCategory;
      });
    }
  }

  return demoProducts.filter((item) => {
    const hitSearch =
      !q ||
      item.product_code.toLowerCase().includes(q) ||
      item.product_name.toLowerCase().includes(q);
    const hitCategory = !category || item.category_name.toLowerCase().includes(category);
    return hitSearch && hitCategory;
  });
}

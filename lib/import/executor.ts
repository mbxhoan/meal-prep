import type { SupabaseClient } from '@supabase/supabase-js';
import { validateWorkbookRows } from '@/lib/import/validate';
import { parseWorkbookFromBuffer } from '@/lib/import/workbook';
import type { ImportResult, ImportIssue } from '@/lib/import/types';

async function fetchMap<T extends { id: string }>(
  client: SupabaseClient,
  table: string,
  codeColumn: string
) {
  const { data, error } = await client.from(table).select(`id, ${codeColumn}`);
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<Record<string, string>>;
  return new Map(rows.map((row) => [row[codeColumn], row.id]));
}

export async function executeMasterDataImport(client: SupabaseClient, buffer: Buffer): Promise<ImportResult> {
  const workbookRows = parseWorkbookFromBuffer(buffer);
  const { issues, normalized } = validateWorkbookRows(workbookRows);

  if (issues.length > 0) {
    return {
      ok: false,
      summary: {
        sheets: Object.keys(workbookRows).length,
        insertedOrUpdated: 0,
        errors: issues.length
      },
      detail: issues
    };
  }

  const detail: ImportIssue[] = [];
  let insertedOrUpdated = 0;

  const upsertCount = async (promise: PromiseLike<{ error: unknown; count?: number | null }>, fallbackCount: number) => {
    const response = await promise;
    if (response.error) throw response.error;
    insertedOrUpdated += response.count ?? fallbackCount;
  };

  await upsertCount(
    client.from('product_categories').upsert(normalized.categories, { onConflict: 'category_code', count: 'exact' }),
    normalized.categories.length
  );

  const categoryMap = await fetchMap(client, 'product_categories', 'category_code');

  await upsertCount(
    client.from('products').upsert(
      normalized.products.map((item) => ({
        product_code: item.product_code,
        product_name: item.product_name,
        category_id: categoryMap.get(item.category_code) ?? null,
        description: item.description,
        is_active: item.is_active
      })),
      { onConflict: 'product_code', count: 'exact' }
    ),
    normalized.products.length
  );

  const productMap = await fetchMap(client, 'products', 'product_code');

  await upsertCount(
    client.from('product_variants').upsert(
      normalized.variants.map((item) => ({
        variant_code: item.variant_code,
        product_id: productMap.get(item.product_code) ?? null,
        weight_value: item.weight_value,
        weight_unit: item.weight_unit,
        weight_label: item.weight_label,
        cost_price: item.cost_price,
        sale_price: item.sale_price,
        is_active: item.is_active
      })),
      { onConflict: 'variant_code', count: 'exact' }
    ),
    normalized.variants.length
  );

  const variantMap = await fetchMap(client, 'product_variants', 'variant_code');

  await upsertCount(
    client.from('combos').upsert(normalized.combos, { onConflict: 'combo_code', count: 'exact' }),
    normalized.combos.length
  );

  const comboMap = await fetchMap(client, 'combos', 'combo_code');

  const comboItemsPayload = normalized.comboItems.map((item) => {
    let variantId = item.variant_code ? variantMap.get(item.variant_code) : null;

    if (!variantId && item.product_code && item.weight_label) {
      const foundVariant = normalized.variants.find(
        (variant) => variant.product_code === item.product_code && variant.weight_label === item.weight_label
      );
      if (foundVariant) variantId = variantMap.get(foundVariant.variant_code) ?? null;
    }

    return {
      combo_id: comboMap.get(item.combo_code) ?? null,
      product_variant_id: variantId,
      qty: item.qty,
      display_order: item.display_order
    };
  });

  const invalidComboItems = comboItemsPayload
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.combo_id || !item.product_variant_id);

  if (invalidComboItems.length > 0) {
    invalidComboItems.forEach(({ index }) => {
      detail.push({
        sheet: 'combo_items',
        row: index + 2,
        message: 'Could not resolve combo or variant from workbook'
      });
    });

    return {
      ok: false,
      summary: {
        sheets: Object.keys(workbookRows).length,
        insertedOrUpdated,
        errors: detail.length
      },
      detail
    };
  }

  const comboIds = Array.from(new Set(comboItemsPayload.map((item) => item.combo_id)));
  if (comboIds.length > 0) {
    const { error: deleteError } = await client.from('combo_items').delete().in('combo_id', comboIds as string[]);
    if (deleteError) throw deleteError;
  }

  await upsertCount(
    client.from('combo_items').insert(comboItemsPayload, { count: 'exact' }),
    comboItemsPayload.length
  );

  await upsertCount(
    client.from('customers').upsert(normalized.customers, { onConflict: 'customer_code', count: 'exact' }),
    normalized.customers.length
  );

  await upsertCount(
    client.from('employees').upsert(normalized.employees, { onConflict: 'employee_code', count: 'exact' }),
    normalized.employees.length
  );

  return {
    ok: true,
    summary: {
      sheets: Object.keys(workbookRows).length,
      insertedOrUpdated,
      errors: detail.length
    },
    detail
  };
}

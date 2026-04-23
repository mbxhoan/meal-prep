import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

function trimCell(value) {
  return String(value ?? '').trim();
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeBoolean(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'active', 'đang bán'].includes(normalized);
}

function normalizeWeightUnit(value) {
  return trimCell(value).toLowerCase() || 'g';
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();
}

function makeVariantCode(productCode, weightValue, weightUnit) {
  return `VAR-${slugify(productCode).toUpperCase()}-${String(weightValue)}${weightUnit.toUpperCase()}`;
}

function makeWeightLabel(weightValue, weightUnit) {
  return `${weightValue}${weightUnit}`;
}

function parseWorkbook(filePath) {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer);
  const sheets = {};

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: ''
    });

    if (!rows.length) {
      sheets[sheetName] = [];
      return;
    }

    const [headerRow, ...bodyRows] = rows;
    const headers = headerRow.map(normalizeHeader);

    sheets[sheetName] = bodyRows
      .filter((row) => row.some((cell) => trimCell(cell) !== ''))
      .map((row) => {
        const record = {};
        headers.forEach((header, index) => {
          record[header] = row[index] ?? '';
        });
        return record;
      });
  });

  return sheets;
}

async function fetchMap(client, table, codeColumn) {
  const { data, error } = await client.from(table).select(`id, ${codeColumn}`);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row[codeColumn], row.id]));
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npm run import:master -- /absolute/path/to/file.xlsx');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const client = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const workbookRows = parseWorkbook(filePath);

  const categories = (workbookRows.product_categories || []).map((row) => ({
    category_code: trimCell(row.category_code || row.code),
    name: trimCell(row.name || row.category_name),
    sort_order: Number(row.sort_order || 0),
    is_active: safeBoolean(row.is_active || 'true')
  }));

  const products = (workbookRows.products || []).map((row) => ({
    product_code: trimCell(row.product_code || row.code),
    product_name: trimCell(row.product_name || row.name),
    category_code: trimCell(row.category_code),
    description: trimCell(row.description),
    is_active: safeBoolean(row.is_active || 'true')
  }));

  const variants = (workbookRows.product_variants || []).map((row) => {
    const productCode = trimCell(row.product_code);
    const weightValue = Number(row.weight_value || row.weight || 0);
    const weightUnit = normalizeWeightUnit(row.weight_unit);
    return {
      variant_code: trimCell(row.variant_code) || makeVariantCode(productCode, weightValue, weightUnit),
      product_code: productCode,
      weight_value: weightValue,
      weight_unit: weightUnit,
      weight_label: trimCell(row.weight_label) || makeWeightLabel(weightValue, weightUnit),
      cost_price: toNumber(row.cost_price || row.gia_von),
      sale_price: toNumber(row.sale_price || row.gia_ban),
      is_active: safeBoolean(row.is_active || 'true')
    };
  });

  const combos = (workbookRows.combos || []).map((row) => ({
    combo_code: trimCell(row.combo_code || row.code),
    combo_name: trimCell(row.combo_name || row.name),
    sale_price: toNumber(row.sale_price || row.gia_ban),
    note: trimCell(row.note),
    is_active: safeBoolean(row.is_active || 'true')
  }));

  const comboItems = (workbookRows.combo_items || []).map((row) => ({
    combo_code: trimCell(row.combo_code),
    variant_code: trimCell(row.variant_code),
    product_code: trimCell(row.product_code),
    weight_label: trimCell(row.weight_label),
    qty: Number(row.qty || row.quantity || 0),
    display_order: Number(row.display_order || 0)
  }));

  const customers = (workbookRows.customers || []).map((row, index) => ({
    customer_code: trimCell(row.customer_code || row.code) || `CUS-AUTO-${String(index + 1).padStart(4, '0')}`,
    name: trimCell(row.name || row.customer_name),
    phone: trimCell(row.phone),
    address: trimCell(row.address),
    note: trimCell(row.note),
    is_active: safeBoolean(row.is_active || 'true')
  }));

  const employees = (workbookRows.employees || []).map((row, index) => ({
    employee_code: trimCell(row.employee_code || row.code) || `EMP-AUTO-${String(index + 1).padStart(4, '0')}`,
    name: trimCell(row.name || row.employee_name),
    phone: trimCell(row.phone),
    note: trimCell(row.note),
    is_active: safeBoolean(row.is_active || 'true')
  }));

  const countFallback = (response, fallback) => response.count ?? fallback;

  await client.from('product_categories').upsert(categories, { onConflict: 'category_code', count: 'exact' });
  const categoryMap = await fetchMap(client, 'product_categories', 'category_code');

  await client.from('products').upsert(
    products.map((item) => ({
      product_code: item.product_code,
      product_name: item.product_name,
      category_id: categoryMap.get(item.category_code) ?? null,
      description: item.description,
      is_active: item.is_active
    })),
    { onConflict: 'product_code', count: 'exact' }
  );

  const productMap = await fetchMap(client, 'products', 'product_code');

  await client.from('product_variants').upsert(
    variants.map((item) => ({
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
  );

  const variantMap = await fetchMap(client, 'product_variants', 'variant_code');

  await client.from('combos').upsert(combos, { onConflict: 'combo_code', count: 'exact' });
  const comboMap = await fetchMap(client, 'combos', 'combo_code');

  const comboItemsPayload = comboItems.map((item) => {
    let variantId = item.variant_code ? variantMap.get(item.variant_code) : null;
    if (!variantId && item.product_code && item.weight_label) {
      const found = variants.find((variant) => variant.product_code === item.product_code && variant.weight_label === item.weight_label);
      if (found) variantId = variantMap.get(found.variant_code) ?? null;
    }

    return {
      combo_id: comboMap.get(item.combo_code) ?? null,
      product_variant_id: variantId,
      qty: item.qty,
      display_order: item.display_order
    };
  });

  const comboIds = Array.from(new Set(comboItemsPayload.map((item) => item.combo_id).filter(Boolean)));
  if (comboIds.length > 0) {
    await client.from('combo_items').delete().in('combo_id', comboIds);
  }

  await client.from('combo_items').insert(comboItemsPayload);
  await client.from('customers').upsert(customers, { onConflict: 'customer_code', count: 'exact' });
  await client.from('employees').upsert(employees, { onConflict: 'employee_code', count: 'exact' });

  console.log(JSON.stringify({
    ok: true,
    sheets: Object.keys(workbookRows).length,
    rows: {
      categories: categories.length,
      products: products.length,
      variants: variants.length,
      combos: combos.length,
      comboItems: comboItems.length,
      customers: customers.length,
      employees: employees.length
    }
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import {
  categorySchema,
  comboItemSchema,
  comboSchema,
  customerSchema,
  employeeSchema,
  productSchema,
  variantSchema
} from '@/lib/schema/master-data';
import { makeVariantCode, makeWeightLabel, normalizeBoolean, normalizeMoney, normalizeWeightUnit, trimCell } from '@/lib/import/normalizers';
import type { ImportIssue } from '@/lib/import/types';

type WorkbookRows = Record<string, Array<Record<string, unknown>>>;

function categoryFromRow(row: Record<string, unknown>) {
  return {
    category_code: trimCell(row.category_code || row.code),
    name: trimCell(row.name || row.category_name),
    sort_order: Number(row.sort_order || 0),
    is_active: normalizeBoolean(row.is_active || 'true')
  };
}

function productFromRow(row: Record<string, unknown>) {
  return {
    product_code: trimCell(row.product_code || row.code),
    product_name: trimCell(row.product_name || row.name),
    category_code: trimCell(row.category_code),
    description: trimCell(row.description),
    is_active: normalizeBoolean(row.is_active || 'true')
  };
}

function variantFromRow(row: Record<string, unknown>) {
  const productCode = trimCell(row.product_code);
  const weightValue = Number(row.weight_value || row.weight || 0);
  const weightUnit = normalizeWeightUnit(row.weight_unit);
  const variantCode = trimCell(row.variant_code) || makeVariantCode(productCode, weightValue, weightUnit);
  const weightLabel = trimCell(row.weight_label) || makeWeightLabel(weightValue, weightUnit);

  return {
    variant_code: variantCode,
    product_code: productCode,
    weight_value: weightValue,
    weight_unit: weightUnit,
    weight_label: weightLabel,
    cost_price: normalizeMoney(row.cost_price || row.gia_von),
    sale_price: normalizeMoney(row.sale_price || row.gia_ban),
    is_active: normalizeBoolean(row.is_active || 'true')
  };
}

function comboFromRow(row: Record<string, unknown>) {
  return {
    combo_code: trimCell(row.combo_code || row.code),
    combo_name: trimCell(row.combo_name || row.name),
    sale_price: normalizeMoney(row.sale_price || row.gia_ban),
    note: trimCell(row.note),
    is_active: normalizeBoolean(row.is_active || 'true')
  };
}

function comboItemFromRow(row: Record<string, unknown>) {
  return {
    combo_code: trimCell(row.combo_code),
    variant_code: trimCell(row.variant_code),
    product_code: trimCell(row.product_code),
    weight_label: trimCell(row.weight_label),
    qty: Number(row.qty || row.quantity || 0),
    display_order: Number(row.display_order || 0)
  };
}

function customerFromRow(row: Record<string, unknown>, index: number) {
  return {
    customer_code: trimCell(row.customer_code || row.code) || `CUS-AUTO-${String(index + 1).padStart(4, '0')}`,
    name: trimCell(row.name || row.customer_name),
    phone: trimCell(row.phone),
    address: trimCell(row.address),
    note: trimCell(row.note),
    is_active: normalizeBoolean(row.is_active || 'true')
  };
}

function employeeFromRow(row: Record<string, unknown>, index: number) {
  return {
    employee_code: trimCell(row.employee_code || row.code) || `EMP-AUTO-${String(index + 1).padStart(4, '0')}`,
    name: trimCell(row.name || row.employee_name),
    phone: trimCell(row.phone),
    note: trimCell(row.note),
    is_active: normalizeBoolean(row.is_active || 'true')
  };
}

export function validateWorkbookRows(workbookRows: WorkbookRows) {
  const issues: ImportIssue[] = [];

  const categories = (workbookRows.product_categories || []).map(categoryFromRow);
  const products = (workbookRows.products || []).map(productFromRow);
  const variants = (workbookRows.product_variants || []).map(variantFromRow);
  const combos = (workbookRows.combos || []).map(comboFromRow);
  const comboItems = (workbookRows.combo_items || []).map(comboItemFromRow);
  const customers = (workbookRows.customers || []).map(customerFromRow);
  const employees = (workbookRows.employees || []).map(employeeFromRow);

  categories.forEach((item, index) => {
    const parsed = categorySchema.safeParse(item);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        issues.push({ sheet: 'product_categories', row: index + 2, message: issue.message });
      });
    }
  });

  products.forEach((item, index) => {
    const parsed = productSchema.safeParse(item);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        issues.push({ sheet: 'products', row: index + 2, message: issue.message });
      });
    }
  });

  variants.forEach((item, index) => {
    const parsed = variantSchema.safeParse(item);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        issues.push({ sheet: 'product_variants', row: index + 2, message: issue.message });
      });
    }
  });

  combos.forEach((item, index) => {
    const parsed = comboSchema.safeParse(item);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        issues.push({ sheet: 'combos', row: index + 2, message: issue.message });
      });
    }
  });

  comboItems.forEach((item, index) => {
    const parsed = comboItemSchema.safeParse(item);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        issues.push({ sheet: 'combo_items', row: index + 2, message: issue.message });
      });
    }
  });

  customers.forEach((item, index) => {
    const parsed = customerSchema.safeParse(item);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        issues.push({ sheet: 'customers', row: index + 2, message: issue.message });
      });
    }
  });

  employees.forEach((item, index) => {
    const parsed = employeeSchema.safeParse(item);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        issues.push({ sheet: 'employees', row: index + 2, message: issue.message });
      });
    }
  });

  const variantCodes = new Set(variants.map((item) => item.variant_code));
  comboItems.forEach((item, index) => {
    if (!item.variant_code && !(item.product_code && item.weight_label)) {
      issues.push({
        sheet: 'combo_items',
        row: index + 2,
        message: 'Need variant_code or product_code + weight_label'
      });
    }

    if (item.variant_code && !variantCodes.has(item.variant_code)) {
      issues.push({
        sheet: 'combo_items',
        row: index + 2,
        message: `variant_code not found: ${item.variant_code}`
      });
    }
  });

  return {
    issues,
    normalized: {
      categories,
      products,
      variants,
      combos,
      comboItems,
      customers,
      employees
    }
  };
}

import { safeBoolean, slugify, toNumber } from '@/lib/utils';

export function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function trimCell(value: unknown) {
  return String(value ?? '').trim();
}

export function normalizeBoolean(value: unknown) {
  return safeBoolean(value);
}

export function normalizeMoney(value: unknown) {
  return toNumber(value);
}

export function normalizeWeightUnit(value: unknown) {
  const raw = trimCell(value).toLowerCase();
  return raw || 'g';
}

export function makeVariantCode(productCode: string, weightValue: number, weightUnit: string) {
  return `VAR-${slugify(productCode).toUpperCase()}-${String(weightValue)}${weightUnit.toUpperCase()}`;
}

export function makeWeightLabel(weightValue: number, weightUnit: string) {
  return `${weightValue}${weightUnit}`;
}

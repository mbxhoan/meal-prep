import { z } from 'zod';

export const categorySchema = z.object({
  category_code: z.string().min(1),
  name: z.string().min(1),
  sort_order: z.coerce.number().default(0),
  is_active: z.coerce.boolean().default(true)
});

export const productSchema = z.object({
  product_code: z.string().min(1),
  product_name: z.string().min(1),
  category_code: z.string().min(1),
  description: z.string().optional().default(''),
  is_active: z.coerce.boolean().default(true)
});

export const variantSchema = z.object({
  variant_code: z.string().min(1),
  product_code: z.string().min(1),
  weight_value: z.coerce.number().positive(),
  weight_unit: z.string().min(1).default('g'),
  weight_label: z.string().min(1),
  cost_price: z.coerce.number().min(0),
  sale_price: z.coerce.number().min(0),
  is_active: z.coerce.boolean().default(true)
});

export const comboSchema = z.object({
  combo_code: z.string().min(1),
  combo_name: z.string().min(1),
  sale_price: z.coerce.number().min(0),
  note: z.string().optional().default(''),
  is_active: z.coerce.boolean().default(true)
});

export const comboItemSchema = z.object({
  combo_code: z.string().min(1),
  variant_code: z.string().optional().default(''),
  product_code: z.string().optional().default(''),
  weight_label: z.string().optional().default(''),
  qty: z.coerce.number().positive(),
  display_order: z.coerce.number().default(0)
});

export const customerSchema = z.object({
  customer_code: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  note: z.string().optional().default(''),
  is_active: z.coerce.boolean().default(true)
});

export const employeeSchema = z.object({
  employee_code: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional().default(''),
  note: z.string().optional().default(''),
  is_active: z.coerce.boolean().default(true)
});

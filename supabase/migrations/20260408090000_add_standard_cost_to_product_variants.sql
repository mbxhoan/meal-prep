-- Add direct standard cost per product variant for spreadsheet-style simple pricing.

alter table public.product_variants
  add column if not exists standard_cost numeric(12,2) not null default 0;

comment on column public.product_variants.standard_cost is
  'Direct standard cost per variant used by the simplified menu workflow.';

# AGENTS.md

## Project overview
- Repo: `meal-prep`
- Stack: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4
- Public storefront routes:
  - `/`
  - `/menu`
  - `/product/[slug]`
  - `/about`
- Admin routes:
  - `/admin`
  - `/admin/menu`
  - `/admin/menu/[productId]`
  - `/admin/inventory`
  - `/admin/orders`
  - `/admin/orders/new`
  - `/admin/analytics`
  - `/admin/login`

## Current architecture
- Public menu and product detail pages now read from the same admin data layer as `/admin`.
- Data access lives in:
  - `src/lib/admin/service.ts`
  - `src/lib/admin/actions.ts`
  - `src/lib/admin/demo-data.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/client.ts`
- Admin supports two modes:
  - `live`: Supabase env is present and authenticated admin/editor session exists
  - `demo`: fallback mode using local mock data when Supabase is not configured

## Supabase rules
- Base schema docs are in `docs/init/01_schema_supabase.sql` and `docs/init/02_seed_mealprep.sql`.
- Inventory/profit extension migration is in:
  - `supabase/migrations/20260316231500_inventory_profit_admin.sql`
- Do not expose recipe cost or internal inventory cost data to public storefront queries.
- Public storefront should only read product/category/content data needed for display.
- Admin-only data:
  - `inventory_items`
  - `inventory_movements`
  - `recipe_components`
  - `orders`
  - `order_items`
- If you need new inventory/profit logic, prefer SQL functions/triggers in Supabase over duplicating calculation logic in the client.

## UI and editing guidance
- Preserve the existing public landing page style unless the task explicitly targets it.
- The admin UI uses a warm light background with dark olive panels. Keep that visual language consistent.
- For menu editing:
  - `main_image_url` is the representative menu image
  - variants carry pricing + cost profile
  - BOM/recipe lines come from `recipe_components`
- For order creation:
  - frontend may preview totals
  - source of truth for persisted totals should remain Supabase triggers

## Safe implementation patterns
- Prefer extending `src/lib/admin/service.ts` for new reads instead of querying Supabase ad hoc inside pages.
- Prefer extending `src/lib/admin/actions.ts` for writes instead of wiring direct client mutations.
- Reuse these components before creating new ones:
  - `AdminShell`
  - `PageHeader`
  - `MetricCard`
  - `StatusPill`
  - `InventoryAdjustmentForm`
  - `OrderBuilder`
  - `ProductEditorForm`
- When adding new admin pages, place them under `src/app/admin/(panel)/...`.
- Keep `/admin/login` outside the protected `(panel)` layout.

## Public storefront cautions
- `/menu` and `/product/[slug]` must continue to work without a live Supabase connection by falling back to demo data.
- If you change product slugs in data, also verify links from the home page carousel in `src/app/page.tsx`.
- Remote product images may come from Supabase Storage. If image hosts change, update `next.config.js`.

## Validation
- Use:
  - `./node_modules/.bin/tsc --noEmit`
  - `yarn build`
- If TypeScript errors mention missing `.next/types`, run a fresh build once before assuming app code is broken.

## Files worth reading first
- `src/lib/admin/service.ts`
- `src/lib/admin/actions.ts`
- `src/features/admin/components/ProductEditorForm.tsx`
- `src/features/admin/components/OrderBuilder.tsx`
- `src/app/menu/page.tsx`
- `src/app/product/[slug]/page.tsx`
- `docs/init/04_supabase_mcp_mapping.md`

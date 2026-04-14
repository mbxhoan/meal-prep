import { MenuCatalog } from "@/features/admin/components/MenuCatalog";
import { getCategories } from "@/lib/admin/service";
import { getSalesOrderBuilderData } from "@/lib/sales/service";

export default async function AdminMenuPage() {
  const [{ products, combos }, categories] = await Promise.all([
    getSalesOrderBuilderData(),
    getCategories(),
  ]);

  return <MenuCatalog products={products} combos={combos} categories={categories} />;
}

import { MenuCatalog } from "@/features/admin/components/MenuCatalog";
import { getSalesOrderBuilderData } from "@/lib/sales/service";

export default async function AdminMenuPage() {
  const { products, combos } = await getSalesOrderBuilderData();

  return <MenuCatalog products={products} combos={combos} />;
}

import { MenuCatalog } from "@/features/admin/components/MenuCatalog";
import { getCategories } from "@/lib/admin/service";
import { getSalesOrderBuilderData } from "@/lib/sales/service";
import { getMasterDataPageData } from "@/lib/master-data/service";

export default async function AdminMenuPage() {
  const [
    { products },
    categories,
    comboPageData,
    comboItemPageData,
  ] = await Promise.all([
    getSalesOrderBuilderData(),
    getCategories(),
    getMasterDataPageData("combos"),
    getMasterDataPageData("combo_items"),
  ]);

  return (
    <MenuCatalog
      products={products}
      combos={comboPageData?.rows ?? []}
      categories={categories}
      comboItems={comboItemPageData?.rows ?? []}
    />
  );
}

import { MenuCatalog } from "@/features/admin/components/MenuCatalog";
import { getMenuProducts } from "@/lib/admin/service";

export default async function AdminMenuPage() {
  const products = await getMenuProducts();

  return <MenuCatalog products={products} />;
}

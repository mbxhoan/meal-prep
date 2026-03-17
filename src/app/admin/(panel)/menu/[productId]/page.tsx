import { notFound } from "next/navigation";
import { ProductEditorForm } from "@/features/admin/components";
import { getCategories, getInventoryItems, getMenuProductById } from "@/lib/admin/service";

export default async function AdminMenuProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const [product, categories, inventoryItems] = await Promise.all([
    getMenuProductById(productId),
    getCategories(),
    getInventoryItems(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-5 pb-8">
      <ProductEditorForm
        product={product}
        categories={categories}
        inventoryItems={inventoryItems}
      />
    </div>
  );
}

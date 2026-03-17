import { notFound } from "next/navigation";
import { PageHeader, ProductEditorForm } from "@/features/admin/components";
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
      <PageHeader
        eyebrow="Menu editor"
        title={product.name}
        description="Chỉnh ảnh đại diện, nội dung hiển thị trên thực đơn, giá bán từng variant và BOM nguyên liệu dùng để tính COGS tự động."
      />

      <ProductEditorForm
        product={product}
        categories={categories}
        inventoryItems={inventoryItems}
      />
    </div>
  );
}

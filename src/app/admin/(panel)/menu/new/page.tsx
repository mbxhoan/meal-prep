import { ProductEditorForm } from "@/features/admin/components";
import { getCategories } from "@/lib/admin/service";
import { createId } from "@/lib/id";
import type { MenuProduct, MenuVariant } from "@/lib/admin/types";

function makeBlankVariant(productId: string): MenuVariant {
  return {
    id: createId("variant"),
    productId,
    label: "",
    weightInGrams: null,
    price: 0,
    compareAtPrice: null,
    standardCost: 0,
    packagingCost: 0,
    laborCost: 0,
    overheadCost: 0,
    recipeCost: 0,
    totalCost: 0,
    grossProfit: 0,
    grossMargin: 0,
    isDefault: true,
    isActive: true,
    sortOrder: 0,
    recipeComponents: [],
  };
}

function makeBlankProduct(): MenuProduct {
  const id = createId("product");

  return {
    id,
    categoryId: null,
    categoryName: "Chưa phân loại",
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    mainImageUrl: "",
    isFeatured: false,
    isPublished: true,
    sortOrder: 0,
    updatedAt: new Date().toISOString(),
    variants: [makeBlankVariant(id)],
  };
}

export default async function AdminNewMenuProductPage() {
  const categories = await getCategories();
  const product = makeBlankProduct();

  return (
    <div className="space-y-5 pb-8">
      <ProductEditorForm
        product={product}
        categories={categories}
        inventoryItems={[]}
      />
    </div>
  );
}

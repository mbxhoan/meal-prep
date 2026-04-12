import { ProductEditorForm } from "@/features/admin/components";
import { getCategories } from "@/lib/admin/service";
import type { MenuProduct, MenuVariant } from "@/lib/admin/types";

function makeBlankVariant(productId: string, weightInGrams: number, index: number): MenuVariant {
  return {
    id: crypto.randomUUID(),
    productId,
    label: `${weightInGrams}g`,
    weightInGrams,
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
    isDefault: index === 0,
    isActive: true,
    sortOrder: index,
    recipeComponents: [],
  };
}

function makeBlankProduct(): MenuProduct {
  const id = crypto.randomUUID();

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
    variants: [
      makeBlankVariant(id, 100, 0),
      makeBlankVariant(id, 150, 1),
      makeBlankVariant(id, 200, 2),
    ],
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

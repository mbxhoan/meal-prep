import type { MenuProductPayload } from "@/lib/admin/types";

type MenuVariantPayload = MenuProductPayload["variants"][number];

export function isValidMenuVariant(variant: MenuVariantPayload) {
  return (
    variant.label.trim().length > 0 &&
    variant.weightInGrams != null &&
    variant.weightInGrams > 0 &&
    variant.price > 0 &&
    variant.standardCost > 0
  );
}

export function validateMenuProductPayload(
  payload: Pick<MenuProductPayload, "name" | "categoryId" | "variants">,
) {
  if (payload.name.trim().length === 0) {
    return "Tên món là bắt buộc.";
  }

  if (!payload.categoryId) {
    return "Chọn nhóm cho món.";
  }

  if (!payload.variants.some(isValidMenuVariant)) {
    return "Nhập ít nhất 1 loại có tên, khối lượng, giá vốn và giá bán.";
  }

  return null;
}

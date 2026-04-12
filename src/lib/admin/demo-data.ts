import type {
  AdminCategory,
  AnalyticsPoint,
  BestSeller,
  DashboardSnapshot,
  InventoryItem,
  MenuProduct,
  MenuVariant,
  OrderItem,
  OrderRecord,
  RecipeComponent,
} from "@/lib/admin/types";
import { roundCurrency } from "@/lib/admin/format";

const today = new Date("2026-03-16T10:00:00+07:00");

export const demoCategories: AdminCategory[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    name: "Gà",
    slug: "ga",
    description: "Các món gà meal prep bán chạy nhất.",
    isActive: true,
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    name: "Bò",
    slug: "bo",
    description: "Các món bò premium.",
    isActive: true,
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    name: "Heo",
    slug: "heo",
    description: "Các món heo và sườn.",
    isActive: true,
  },
  {
    id: "c1000000-0000-0000-0000-000000000004",
    name: "Hải sản",
    slug: "hai-san",
    description: "Các món cá hồi, tôm và hải sản theo mùa.",
    isActive: true,
  },
];

export const demoCustomers = [
  {
    id: "cust-1000-0000-0000-000000000001",
    code: "KH-001",
    name: "Nguyen Thi Linh",
    phone: "0900000111",
    address: "Quận 1, TP. Hồ Chí Minh",
    note: "Khách mua đều mỗi tuần.",
  },
  {
    id: "cust-1000-0000-0000-000000000002",
    code: "KH-002",
    name: "Tran Quoc Bao",
    phone: "0900000222",
    address: "Quận 3, TP. Hồ Chí Minh",
    note: "Ưu tiên giao trước 12h.",
  },
  {
    id: "cust-1000-0000-0000-000000000003",
    code: "KH-003",
    name: "Le Minh Chau",
    phone: "0900000333",
    address: "Thủ Đức, TP. Hồ Chí Minh",
    note: null,
  },
  {
    id: "cust-1000-0000-0000-000000000004",
    code: "KH-004",
    name: "Pham Thao Nhi",
    phone: "0900000444",
    address: "Quận 7, TP. Hồ Chí Minh",
    note: "Giao buổi chiều.",
  },
];

export const demoEmployees = [
  {
    id: "emp-1000-0000-0000-000000000001",
    employeeCode: "NV-001",
    fullName: "Nguyen Van An",
    phone: "0911000001",
    jobTitle: "Kinh doanh",
  },
  {
    id: "emp-1000-0000-0000-000000000002",
    employeeCode: "NV-002",
    fullName: "Tran Thi Bich",
    phone: "0911000002",
    jobTitle: "Chăm sóc khách",
  },
  {
    id: "emp-1000-0000-0000-000000000003",
    employeeCode: "NV-003",
    fullName: "Le Minh Chau",
    phone: "0911000003",
    jobTitle: "Bán hàng",
  },
];

export const demoInventoryItems: InventoryItem[] = [
  {
    id: "i1000000-0000-0000-0000-000000000001",
    name: "Ức gà tươi",
    sku: "INV-CHICKEN-BREAST",
    unit: "g",
    onHand: 12800,
    reorderPoint: 5000,
    averageUnitCost: 92,
    lastPurchaseCost: 95,
    supplierName: "Fresh Poultry Co.",
    notes: "Nguyên liệu chính cho 3 menu gà.",
    updatedAt: "2026-03-16T08:30:00+07:00",
    isLowStock: false,
  },
  {
    id: "i1000000-0000-0000-0000-000000000002",
    name: "Thăn bò",
    sku: "INV-BEEF-SIRLOIN",
    unit: "g",
    onHand: 4600,
    reorderPoint: 4500,
    averageUnitCost: 210,
    lastPurchaseCost: 218,
    supplierName: "Prime Cuts VN",
    notes: "Sát ngưỡng đặt lại hàng.",
    updatedAt: "2026-03-15T18:00:00+07:00",
    isLowStock: false,
  },
  {
    id: "i1000000-0000-0000-0000-000000000003",
    name: "Sườn heo",
    sku: "INV-PORK-RIBS",
    unit: "g",
    onHand: 3400,
    reorderPoint: 3500,
    averageUnitCost: 128,
    lastPurchaseCost: 132,
    supplierName: "Bếp Heo Việt",
    notes: "Cần nhập thêm trong 24h tới.",
    updatedAt: "2026-03-16T07:45:00+07:00",
    isLowStock: true,
  },
  {
    id: "i1000000-0000-0000-0000-000000000004",
    name: "Phi lê cá hồi",
    sku: "INV-SALMON-FILLET",
    unit: "g",
    onHand: 6200,
    reorderPoint: 2500,
    averageUnitCost: 245,
    lastPurchaseCost: 252,
    supplierName: "Nordic Seafood",
    notes: "Dùng cho menu premium.",
    updatedAt: "2026-03-15T12:20:00+07:00",
    isLowStock: false,
  },
  {
    id: "i1000000-0000-0000-0000-000000000005",
    name: "Tôm bóc vỏ",
    sku: "INV-SHRIMP-PEELED",
    unit: "g",
    onHand: 5800,
    reorderPoint: 2200,
    averageUnitCost: 180,
    lastPurchaseCost: 185,
    supplierName: "Seafood Hub",
    notes: "Ổn định.",
    updatedAt: "2026-03-14T20:30:00+07:00",
    isLowStock: false,
  },
  {
    id: "i1000000-0000-0000-0000-000000000006",
    name: "Sốt ướp signature",
    sku: "INV-SIGNATURE-MARINADE",
    unit: "g",
    onHand: 1900,
    reorderPoint: 1000,
    averageUnitCost: 38,
    lastPurchaseCost: 39,
    supplierName: "MealFit Internal Kitchen",
    notes: "Tự phối trộn.",
    updatedAt: "2026-03-16T09:10:00+07:00",
    isLowStock: false,
  },
  {
    id: "i1000000-0000-0000-0000-000000000007",
    name: "Rau garnish",
    sku: "INV-GARNISH-GREENS",
    unit: "g",
    onHand: 780,
    reorderPoint: 1200,
    averageUnitCost: 24,
    lastPurchaseCost: 25,
    supplierName: "Green Farm",
    notes: "Low stock do batch rau cuối tuần.",
    updatedAt: "2026-03-16T06:30:00+07:00",
    isLowStock: true,
  },
  {
    id: "i1000000-0000-0000-0000-000000000008",
    name: "Túi hút chân không",
    sku: "INV-VACUUM-PACK",
    unit: "pcs",
    onHand: 164,
    reorderPoint: 60,
    averageUnitCost: 2200,
    lastPurchaseCost: 2200,
    supplierName: "PackPro",
    notes: "Chi phí đóng gói được map vào packaging cost.",
    updatedAt: "2026-03-14T17:30:00+07:00",
    isLowStock: false,
  },
];

const inventoryIndex = Object.fromEntries(
  demoInventoryItems.map((item) => [item.id, item]),
);

function makeRecipeComponent(
  id: string,
  variantId: string,
  inventoryItemId: string,
  quantityPerUnit: number,
  wastagePercent = 0,
): RecipeComponent {
  const inventoryItem = inventoryIndex[inventoryItemId];
  const lineCost = roundCurrency(
    quantityPerUnit *
      inventoryItem.averageUnitCost *
      (1 + wastagePercent / 100),
  );

  return {
    id,
    variantId,
    inventoryItemId,
    ingredientName: inventoryItem.name,
    unit: inventoryItem.unit,
    quantityPerUnit,
    unitCost: inventoryItem.averageUnitCost,
    wastagePercent,
    lineCost,
  };
}

function makeVariant(params: {
  id: string;
  productId: string;
  label: string;
  weightInGrams: number | null;
  price: number;
  compareAtPrice?: number | null;
  packagingCost: number;
  laborCost: number;
  overheadCost: number;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder: number;
  recipeBlueprint: Array<{
    id: string;
    inventoryItemId: string;
    quantityPerUnit: number;
    wastagePercent?: number;
  }>;
}): MenuVariant {
  const recipeComponents = params.recipeBlueprint.map((item) =>
    makeRecipeComponent(
      item.id,
      params.id,
      item.inventoryItemId,
      item.quantityPerUnit,
      item.wastagePercent ?? 0,
    ),
  );
  const recipeCost = recipeComponents.reduce(
    (sum, component) => sum + component.lineCost,
    0,
  );
  const totalCost = roundCurrency(
    recipeCost + params.packagingCost + params.laborCost + params.overheadCost,
  );
  const grossProfit = roundCurrency(params.price - totalCost);
  const grossMargin = params.price > 0 ? grossProfit / params.price : 0;

  return {
    id: params.id,
    productId: params.productId,
    label: params.label,
    weightInGrams: params.weightInGrams,
    price: params.price,
    compareAtPrice: params.compareAtPrice ?? null,
    standardCost: totalCost,
    packagingCost: params.packagingCost,
    laborCost: params.laborCost,
    overheadCost: params.overheadCost,
    recipeCost,
    totalCost,
    grossProfit,
    grossMargin,
    isDefault: params.isDefault ?? false,
    isActive: params.isActive ?? true,
    sortOrder: params.sortOrder,
    recipeComponents,
  };
}

export const demoMenuProducts: MenuProduct[] = [
  {
    id: "p1000000-0000-0000-0000-000000000001",
    categoryId: demoCategories[0]?.id ?? null,
    categoryName: demoCategories[0]?.name ?? "Gà",
    name: "Ức Gà Ướp Signature",
    slug: "marinated-chicken",
    shortDescription: "Món bán chạy giàu protein, lợi nhuận tốt và vòng quay kho nhanh.",
    description:
      "Ức gà tươi được ướp sốt đặc trưng và đóng gói hút chân không. Đây là mã hàng chủ lực dùng cho bảng điều khiển lợi nhuận.",
    mainImageUrl: "/assets/products/chicken_nobg.png",
    isFeatured: true,
    isPublished: true,
    sortOrder: 1,
    updatedAt: "2026-03-16T09:30:00+07:00",
    variants: [
      makeVariant({
        id: "v1000000-0000-0000-0000-000000000001",
        productId: "p1000000-0000-0000-0000-000000000001",
        label: "200 G",
        weightInGrams: 200,
        price: 79000,
        packagingCost: 2500,
        laborCost: 6000,
        overheadCost: 3500,
        sortOrder: 1,
        recipeBlueprint: [
          {
            id: "rc1000000-0000-0000-0000-000000000001",
            inventoryItemId: "i1000000-0000-0000-0000-000000000001",
            quantityPerUnit: 200,
            wastagePercent: 4,
          },
          {
            id: "rc1000000-0000-0000-0000-000000000002",
            inventoryItemId: "i1000000-0000-0000-0000-000000000006",
            quantityPerUnit: 18,
            wastagePercent: 2,
          },
          {
            id: "rc1000000-0000-0000-0000-000000000003",
            inventoryItemId: "i1000000-0000-0000-0000-000000000007",
            quantityPerUnit: 12,
          },
        ],
      }),
      makeVariant({
        id: "v1000000-0000-0000-0000-000000000002",
        productId: "p1000000-0000-0000-0000-000000000001",
        label: "500 G",
        weightInGrams: 500,
        price: 159000,
        packagingCost: 2800,
        laborCost: 8500,
        overheadCost: 4500,
        isDefault: true,
        sortOrder: 2,
        recipeBlueprint: [
          {
            id: "rc1000000-0000-0000-0000-000000000004",
            inventoryItemId: "i1000000-0000-0000-0000-000000000001",
            quantityPerUnit: 500,
            wastagePercent: 4,
          },
          {
            id: "rc1000000-0000-0000-0000-000000000005",
            inventoryItemId: "i1000000-0000-0000-0000-000000000006",
            quantityPerUnit: 35,
            wastagePercent: 2,
          },
          {
            id: "rc1000000-0000-0000-0000-000000000006",
            inventoryItemId: "i1000000-0000-0000-0000-000000000007",
            quantityPerUnit: 25,
          },
        ],
      }),
    ],
  },
  {
    id: "p1000000-0000-0000-0000-000000000002",
    categoryId: demoCategories[1]?.id ?? null,
    categoryName: demoCategories[1]?.name ?? "Bò",
    name: "Bò Thăn Áp Chảo",
    slug: "prime-beef",
    shortDescription: "Mã hàng cao cấp, giá trị đơn cao nhưng sát mức tồn kho tối thiểu.",
    description:
      "Thăn bò cắt chuẩn phần ăn, có thể theo dõi lợi nhuận ngay khi nhập giá bò mới vào kho.",
    mainImageUrl: "/assets/products/beef_nobg.png",
    isFeatured: false,
    isPublished: true,
    sortOrder: 2,
    updatedAt: "2026-03-15T21:00:00+07:00",
    variants: [
      makeVariant({
        id: "v1000000-0000-0000-0000-000000000003",
        productId: "p1000000-0000-0000-0000-000000000002",
        label: "300 G",
        weightInGrams: 300,
        price: 169000,
        packagingCost: 2500,
        laborCost: 9000,
        overheadCost: 5000,
        isDefault: true,
        sortOrder: 1,
        recipeBlueprint: [
          {
            id: "rc1000000-0000-0000-0000-000000000007",
            inventoryItemId: "i1000000-0000-0000-0000-000000000002",
            quantityPerUnit: 300,
            wastagePercent: 6,
          },
          {
            id: "rc1000000-0000-0000-0000-000000000008",
            inventoryItemId: "i1000000-0000-0000-0000-000000000006",
            quantityPerUnit: 22,
            wastagePercent: 2,
          },
        ],
      }),
    ],
  },
  {
    id: "p1000000-0000-0000-0000-000000000003",
    categoryId: demoCategories[2]?.id ?? null,
    categoryName: demoCategories[2]?.name ?? "Heo",
    name: "Sườn Heo BBQ",
    slug: "bbq-ribs",
    shortDescription: "Món phổ biến trên Facebook, lợi nhuận ổn định.",
    description:
      "Sườn heo nướng BBQ, đang ở ngưỡng cần nhập thêm do tốc độ bán tăng cuối tuần.",
    mainImageUrl: "/assets/products/ribs_nobg.png",
    isFeatured: false,
    isPublished: true,
    sortOrder: 3,
    updatedAt: "2026-03-16T08:00:00+07:00",
    variants: [
      makeVariant({
        id: "v1000000-0000-0000-0000-000000000004",
        productId: "p1000000-0000-0000-0000-000000000003",
        label: "450 G",
        weightInGrams: 450,
        price: 149000,
        packagingCost: 2600,
        laborCost: 7800,
        overheadCost: 4200,
        isDefault: true,
        sortOrder: 1,
        recipeBlueprint: [
          {
            id: "rc1000000-0000-0000-0000-000000000009",
            inventoryItemId: "i1000000-0000-0000-0000-000000000003",
            quantityPerUnit: 450,
            wastagePercent: 5,
          },
          {
            id: "rc1000000-0000-0000-0000-000000000010",
            inventoryItemId: "i1000000-0000-0000-0000-000000000006",
            quantityPerUnit: 28,
            wastagePercent: 2,
          },
        ],
      }),
    ],
  },
  {
    id: "p1000000-0000-0000-0000-000000000004",
    categoryId: demoCategories[3]?.id ?? null,
    categoryName: demoCategories[3]?.name ?? "Hải sản",
    name: "Cá Hồi Cam",
    slug: "orange-salmon",
    shortDescription: "Menu premium có hình ảnh đại diện mạnh cho trang thực đơn.",
    description:
      "Cá hồi phi lê ướp sốt cam nhẹ, phù hợp làm món hero cho danh mục hải sản.",
    mainImageUrl: "/assets/products/salmon_nobg.png",
    isFeatured: true,
    isPublished: true,
    sortOrder: 4,
    updatedAt: "2026-03-14T16:30:00+07:00",
    variants: [
      makeVariant({
        id: "v1000000-0000-0000-0000-000000000005",
        productId: "p1000000-0000-0000-0000-000000000004",
        label: "250 G",
        weightInGrams: 250,
        price: 179000,
        packagingCost: 2700,
        laborCost: 8200,
        overheadCost: 4600,
        isDefault: true,
        sortOrder: 1,
        recipeBlueprint: [
          {
            id: "rc1000000-0000-0000-0000-000000000011",
            inventoryItemId: "i1000000-0000-0000-0000-000000000004",
            quantityPerUnit: 250,
            wastagePercent: 4,
          },
          {
            id: "rc1000000-0000-0000-0000-000000000012",
            inventoryItemId: "i1000000-0000-0000-0000-000000000006",
            quantityPerUnit: 20,
            wastagePercent: 2,
          },
        ],
      }),
    ],
  },
];

function makeOrderItem(
  id: string,
  orderId: string,
  variantId: string,
  quantity: number,
  unitPrice?: number,
): OrderItem {
  const product = demoMenuProducts.find((entry) =>
    entry.variants.some((variant) => variant.id === variantId),
  );
  const variant = product?.variants.find((entry) => entry.id === variantId);

  if (!product || !variant) {
    throw new Error(`Variant ${variantId} not found in demo data`);
  }

  const finalUnitPrice = unitPrice ?? variant.price;
  const lineRevenue = roundCurrency(quantity * finalUnitPrice);
  const lineCogs = roundCurrency(quantity * variant.totalCost);

  return {
    id,
    orderId,
    productId: product.id,
    productName: product.name,
    variantId: variant.id,
    variantLabel: variant.label,
    quantity,
    unitPrice: finalUnitPrice,
    unitCogs: variant.totalCost,
    lineRevenue,
    lineCogs,
    lineProfit: roundCurrency(lineRevenue - lineCogs),
  };
}

function makeOrder(params: {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string | null;
  employeeId?: string | null;
  salesChannel: OrderRecord["salesChannel"];
  orderType?: OrderRecord["orderType"];
  deliveryStatus?: OrderRecord["deliveryStatus"];
  shipperName?: string | null;
  status: OrderRecord["status"];
  orderedAt: string;
  note?: string;
  discountAmount?: number;
  shippingFee?: number;
  otherFee?: number;
  inventoryAppliedAt?: string | null;
  lineBlueprints: Array<{
    id: string;
    variantId: string;
    quantity: number;
    unitPrice?: number;
  }>;
}): OrderRecord {
  const items = params.lineBlueprints.map((line) =>
    makeOrderItem(line.id, params.id, line.variantId, line.quantity, line.unitPrice),
  );
  const subtotal = items.reduce((sum, item) => sum + item.lineRevenue, 0);
  const totalCogs = items.reduce((sum, item) => sum + item.lineCogs, 0);
  const discountAmount = params.discountAmount ?? 0;
  const shippingFee = params.shippingFee ?? 0;
  const otherFee = params.otherFee ?? 0;
  const totalRevenue = roundCurrency(
    subtotal - discountAmount + shippingFee + otherFee,
  );
  const grossProfit = roundCurrency(totalRevenue - totalCogs);
  const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

  return {
    id: params.id,
    orderNumber: params.orderNumber,
    customerId: params.customerId ?? null,
    customerName: params.customerName,
    customerPhone: params.customerPhone ?? null,
    employeeId: params.employeeId ?? null,
    salesChannel: params.salesChannel,
    orderType: params.orderType ?? "order",
    deliveryStatus:
      params.deliveryStatus ??
      (params.status === "completed" ? "delivered" : "pending"),
    shipperName: params.shipperName ?? null,
    status: params.status,
    note: params.note ?? null,
    subtotal,
    discountAmount,
    shippingFee,
    otherFee,
    totalRevenue,
    totalCogs,
    grossProfit,
    grossMargin,
    orderedAt: params.orderedAt,
    inventoryAppliedAt: params.inventoryAppliedAt ?? null,
    items,
  };
}

export const demoOrders: OrderRecord[] = [
  makeOrder({
    id: "o1000000-0000-0000-0000-000000000001",
    orderNumber: "MP-20260316-001",
    customerName: "Nguyen Thi Linh",
    customerPhone: "0900000111",
    salesChannel: "website",
    status: "completed",
    orderedAt: "2026-03-16T09:05:00+07:00",
    inventoryAppliedAt: "2026-03-16T09:10:00+07:00",
    shippingFee: 25000,
    lineBlueprints: [
      {
        id: "oi1000000-0000-0000-0000-000000000001",
        variantId: "v1000000-0000-0000-0000-000000000002",
        quantity: 2,
      },
      {
        id: "oi1000000-0000-0000-0000-000000000002",
        variantId: "v1000000-0000-0000-0000-000000000005",
        quantity: 1,
      },
    ],
  }),
  makeOrder({
    id: "o1000000-0000-0000-0000-000000000002",
    orderNumber: "MP-20260315-009",
    customerName: "Tran Quoc Bao",
    customerPhone: "0900000222",
    salesChannel: "facebook",
    status: "confirmed",
    orderedAt: "2026-03-15T18:20:00+07:00",
    inventoryAppliedAt: "2026-03-15T18:22:00+07:00",
    discountAmount: 10000,
    lineBlueprints: [
      {
        id: "oi1000000-0000-0000-0000-000000000003",
        variantId: "v1000000-0000-0000-0000-000000000004",
        quantity: 3,
      },
    ],
  }),
  makeOrder({
    id: "o1000000-0000-0000-0000-000000000003",
    orderNumber: "MP-20260315-005",
    customerName: "Le Minh Chau",
    customerPhone: "0900000333",
    salesChannel: "zalo",
    status: "completed",
    orderedAt: "2026-03-15T11:05:00+07:00",
    inventoryAppliedAt: "2026-03-15T11:08:00+07:00",
    lineBlueprints: [
      {
        id: "oi1000000-0000-0000-0000-000000000004",
        variantId: "v1000000-0000-0000-0000-000000000003",
        quantity: 2,
      },
      {
        id: "oi1000000-0000-0000-0000-000000000005",
        variantId: "v1000000-0000-0000-0000-000000000001",
        quantity: 2,
      },
    ],
  }),
  makeOrder({
    id: "o1000000-0000-0000-0000-000000000004",
    orderNumber: "MP-20260314-014",
    customerName: "Pham Thao Nhi",
    customerPhone: "0900000444",
    salesChannel: "manual",
    status: "draft",
    orderedAt: "2026-03-14T16:45:00+07:00",
    note: "Khách hỏi thêm combo 5 ngày.",
    lineBlueprints: [
      {
        id: "oi1000000-0000-0000-0000-000000000006",
        variantId: "v1000000-0000-0000-0000-000000000002",
        quantity: 1,
      },
    ],
  }),
  makeOrder({
    id: "o1000000-0000-0000-0000-000000000005",
    orderNumber: "MP-20260313-011",
    customerName: "Do Hoang Anh",
    customerPhone: "0900000555",
    salesChannel: "store",
    status: "completed",
    orderedAt: "2026-03-13T13:40:00+07:00",
    shippingFee: 15000,
    otherFee: 5000,
    lineBlueprints: [
      {
        id: "oi1000000-0000-0000-0000-000000000007",
        variantId: "v1000000-0000-0000-0000-000000000002",
        quantity: 1,
      },
      {
        id: "oi1000000-0000-0000-0000-000000000008",
        variantId: "v1000000-0000-0000-0000-000000000003",
        quantity: 1,
      },
    ],
  }),
  makeOrder({
    id: "o1000000-0000-0000-0000-000000000006",
    orderNumber: "MP-20260312-007",
    customerName: "Bui Gia Khanh",
    customerPhone: "0900000666",
    salesChannel: "grab",
    status: "cancelled",
    orderedAt: "2026-03-12T19:20:00+07:00",
    discountAmount: 15000,
    lineBlueprints: [
      {
        id: "oi1000000-0000-0000-0000-000000000009",
        variantId: "v1000000-0000-0000-0000-000000000004",
        quantity: 1,
      },
    ],
  }),
];

export function getDemoDashboardSnapshot(): DashboardSnapshot {
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const effectiveOrders = demoOrders.filter((order) => {
    const orderedAt = new Date(order.orderedAt);

    return (
      orderedAt >= thirtyDaysAgo &&
      order.status !== "draft" &&
      order.status !== "cancelled"
    );
  });

  const revenue30d = effectiveOrders.reduce(
    (sum, order) => sum + order.totalRevenue,
    0,
  );
  const profit30d = effectiveOrders.reduce(
    (sum, order) => sum + order.grossProfit,
    0,
  );
  const avgOrderValue =
    effectiveOrders.length > 0 ? revenue30d / effectiveOrders.length : 0;
  const orderCount30d = effectiveOrders.length;
  const openOrders = demoOrders.filter(
    (order) => order.status === "draft" || order.status === "confirmed",
  ).length;
  const salesTrend = getDemoAnalytics();
  const todayPoint = salesTrend[salesTrend.length - 1] ?? {
    date: today.toISOString().slice(0, 10),
    revenue: 0,
    cogs: 0,
    profit: 0,
    orders: 0,
  };

  const bestSellerMap = new Map<string, BestSeller>();

  for (const order of effectiveOrders) {
    for (const item of order.items) {
      const current = bestSellerMap.get(item.productId);

      bestSellerMap.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        quantity: (current?.quantity ?? 0) + item.quantity,
        revenue: roundCurrency((current?.revenue ?? 0) + item.lineRevenue),
        profit: roundCurrency((current?.profit ?? 0) + item.lineProfit),
      });
    }
  }

  return {
    revenue30d,
    profit30d,
    grossMargin30d: revenue30d > 0 ? profit30d / revenue30d : 0,
    avgOrderValue,
    orderCount30d,
    todayRevenue: todayPoint.revenue,
    todayOrders: todayPoint.orders,
    menuCount: demoMenuProducts.length,
    lowStockCount: demoInventoryItems.filter((item) => item.isLowStock).length,
    openOrders,
    recentOrders: [...demoOrders]
      .sort(
        (left, right) =>
          new Date(right.orderedAt).getTime() - new Date(left.orderedAt).getTime(),
      )
      .slice(0, 5),
    salesTrend,
    lowStockItems: demoInventoryItems.filter((item) => item.isLowStock),
    bestSellers: [...bestSellerMap.values()]
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 4),
  };
}

export function getDemoAnalytics(): AnalyticsPoint[] {
  const buckets = new Map<string, AnalyticsPoint>();

  for (let index = 6; index >= 0; index -= 1) {
    const pointDate = new Date(today);
    pointDate.setDate(today.getDate() - index);
    const dateKey = pointDate.toISOString().slice(0, 10);

    buckets.set(dateKey, {
      date: dateKey,
      revenue: 0,
      cogs: 0,
      profit: 0,
      orders: 0,
    });
  }

  for (const order of demoOrders) {
    if (order.status === "draft" || order.status === "cancelled") {
      continue;
    }

    const key = order.orderedAt.slice(0, 10);
    const bucket = buckets.get(key);

    if (!bucket) {
      continue;
    }

    bucket.revenue += order.totalRevenue;
    bucket.cogs += order.totalCogs;
    bucket.profit += order.grossProfit;
    bucket.orders += 1;
  }

  return [...buckets.values()];
}

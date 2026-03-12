export type Language = "vi" | "en";

export const translations = {
  en: {
    // Navigation
    nav: {
      chicken: "Chicken",
      beef: "Beef",
      pork: "Pork",
      seafood: "Seafood",
      spices: "Spices",
    },
    // General
    orderNow: "Order Now",
    scroll: "Scroll",
    down: "Down",
    // Products
    products: {
      "Marinated Chicken": "Marinated Chicken",
      "Premium Beef": "Premium Beef",
      "BBQ Ribs": "BBQ Ribs",
      "Citrus Salmon": "Citrus Salmon",
    },
    descriptions: {
      "Marinated Chicken":
        "Enjoy our perfectly marinated meats, packed with protein and gourmet flavor. Designed for athletes, health enthusiasts, and busy professionals who demand maximum taste with zero prep time.",
      "Premium Beef":
        "Juicy cuts of marbled beef, aged to perfection and pre-seasoned. Experience restaurant-quality steak from the comfort of your home.",
      "BBQ Ribs":
        "Slow-cooked, fall-off-the-bone tender pork ribs glazed in our signature smoky, sweet, and tangy BBQ sauce.",
      "Citrus Salmon":
        "Fresh, sustainably sourced salmon fillets marinated in zesty citrus and dill. A light, nutritious option packed with Omega-3s.",
    },
  },
  vi: {
    // Navigation
    nav: {
      chicken: "Gà",
      beef: "Bò",
      pork: "Heo",
      seafood: "Hải sản",
      spices: "Gia vị",
    },
    // General
    orderNow: "Đặt Hàng Ngay",
    scroll: "Cuộn",
    down: "Xuống",
    // Products
    products: {
      "Marinated Chicken": "Ức Gà Ướp",
      "Premium Beef": "Bò Thượng Hạng",
      "BBQ Ribs": "Sườn Nướng BBQ",
      "Citrus Salmon": "Cá Hồi Cam",
    },
    descriptions: {
      "Marinated Chicken":
        "Thưởng thức phần thịt được tẩm ướp hoàn hảo, dồi dào protein và hương vị hảo hạng. Dành cho những người sành ăn muốn tối đa hoá hương vị mà không tốn công chuẩn bị.",
      "Premium Beef":
        "Những thớ thịt bò vân mỡ mọng nước, được ủ đến độ hoàn hảo và tẩm ướp sẵn. Trải nghiệm món bít tết chuẩn nhà hàng ngay tại nhà.",
      "BBQ Ribs":
        "Sườn heo nướng chậm, mềm tơi róc xương, phủ lớp nước xốt BBQ đặc trưng mang hương vị đậm đà, chua ngọt.",
      "Citrus Salmon":
        "Cá hồi tươi, khai thác bền vững được tẩm ướp với cam chanh và thì là. Lựa chọn thanh đạm, bổ dưỡng dồi dào Omega-3.",
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

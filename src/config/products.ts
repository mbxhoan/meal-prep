export interface NutritionInfo {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
}

export interface Product {
  id: number;
  slug: string;
  nameKey: string; // translation key
  image: string;
  category: "chicken" | "beef" | "pork" | "seafood" | "spices";
  nutrition: NutritionInfo;
  benefits: string[]; // translation keys
}

export const products: Product[] = [
  {
    id: 1,
    slug: "marinated-chicken",
    nameKey: "Marinated Chicken",
    image: "/assets/products/chicken_nobg.png",
    category: "chicken",
    nutrition: { calories: 165, protein: "31g", carbs: "0g", fat: "3.6g", fiber: "0g" },
    benefits: ["benefit_highProtein", "benefit_lowFat", "benefit_muscleRecovery", "benefit_quickMeal"],
  },
  {
    id: 2,
    slug: "premium-beef",
    nameKey: "Premium Beef",
    image: "/assets/products/beef_nobg.png",
    category: "beef",
    nutrition: { calories: 250, protein: "26g", carbs: "0g", fat: "17g", fiber: "0g" },
    benefits: ["benefit_ironRich", "benefit_highProtein", "benefit_energyBoost", "benefit_premiumCut"],
  },
  {
    id: 3,
    slug: "bbq-ribs",
    nameKey: "BBQ Ribs",
    image: "/assets/products/ribs_nobg.png",
    category: "pork",
    nutrition: { calories: 290, protein: "24g", carbs: "8g", fat: "18g", fiber: "0.5g" },
    benefits: ["benefit_slowMarinated", "benefit_boneIn", "benefit_richFlavor", "benefit_partyReady"],
  },
  {
    id: 4,
    slug: "citrus-salmon",
    nameKey: "Citrus Salmon",
    image: "/assets/products/salmon_nobg.png",
    category: "seafood",
    nutrition: { calories: 208, protein: "20g", carbs: "2g", fat: "13g", fiber: "0.5g" },
    benefits: ["benefit_omega3", "benefit_heartHealthy", "benefit_brainFood", "benefit_lightMeal"],
  },
  {
    id: 5,
    slug: "garlic-herb-chicken",
    nameKey: "Garlic Herb Chicken",
    image: "/assets/products/chicken_nobg.png",
    category: "chicken",
    nutrition: { calories: 180, protein: "29g", carbs: "2g", fat: "5g", fiber: "0.3g" },
    benefits: ["benefit_highProtein", "benefit_herbInfused", "benefit_lowCarb", "benefit_quickMeal"],
  },
  {
    id: 6,
    slug: "wagyu-steak",
    nameKey: "Wagyu Steak",
    image: "/assets/products/beef_nobg.png",
    category: "beef",
    nutrition: { calories: 330, protein: "22g", carbs: "0g", fat: "28g", fiber: "0g" },
    benefits: ["benefit_premiumCut", "benefit_marbled", "benefit_meltInMouth", "benefit_luxuryDining"],
  },
  {
    id: 7,
    slug: "honey-glazed-pork",
    nameKey: "Honey Glazed Pork",
    image: "/assets/products/ribs_nobg.png",
    category: "pork",
    nutrition: { calories: 260, protein: "22g", carbs: "12g", fat: "14g", fiber: "0.2g" },
    benefits: ["benefit_sweetSavory", "benefit_slowMarinated", "benefit_familyFavorite", "benefit_easyPrep"],
  },
  {
    id: 8,
    slug: "teriyaki-shrimp",
    nameKey: "Teriyaki Shrimp",
    image: "/assets/products/salmon_nobg.png",
    category: "seafood",
    nutrition: { calories: 145, protein: "24g", carbs: "6g", fat: "2g", fiber: "0g" },
    benefits: ["benefit_lowCalorie", "benefit_highProtein", "benefit_quickCook", "benefit_asianFusion"],
  },
  {
    id: 9,
    slug: "signature-spice-blend",
    nameKey: "Signature Spice Blend",
    image: "/assets/products/spices_nobg.png",
    category: "spices",
    nutrition: { calories: 15, protein: "0.5g", carbs: "3g", fat: "0.3g", fiber: "1g" },
    benefits: ["benefit_allNatural", "benefit_noPreservatives", "benefit_versatile", "benefit_antioxidants"],
  },
  {
    id: 10,
    slug: "smoky-paprika-rub",
    nameKey: "Smoky Paprika Rub",
    image: "/assets/products/spices_nobg.png",
    category: "spices",
    nutrition: { calories: 20, protein: "1g", carbs: "4g", fat: "0.5g", fiber: "2g" },
    benefits: ["benefit_smokyFlavor", "benefit_allNatural", "benefit_versatile", "benefit_antioxidants"],
  },
];

export const categories = ["all", "chicken", "beef", "pork", "seafood", "spices"] as const;
export type Category = (typeof categories)[number];

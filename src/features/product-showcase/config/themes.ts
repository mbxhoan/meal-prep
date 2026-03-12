// Theme configuration for different meal prep products
export type ProductName = "Marinated Chicken" | "Premium Beef" | "BBQ Ribs" | "Citrus Salmon";

export interface ThemeConfig {
    mainBgColor: string;
    blurColor: string;
    textColor: string;
    accentColor: string;
    buttonBgColor: string;
    buttonTextColor: string;
}

export interface ProductInfo {
    title: string;
    description: string;
}

// Product color and text color map
export const canThemeMap: Record<ProductName, ThemeConfig> = {
    "Marinated Chicken": {
        mainBgColor: "#D37B40", // Warm roasted chicken color
        blurColor: "#FFC299",
        textColor: "white",
        accentColor: "rgba(255, 255, 255, 0.9)",
        buttonBgColor: "white",
        buttonTextColor: "#D37B40",
    },
    "Premium Beef": {
        mainBgColor: "#8C2A2A", // Deep red meat color
        blurColor: "#E57575",
        textColor: "white",
        accentColor: "rgba(255, 255, 255, 0.9)",
        buttonBgColor: "white",
        buttonTextColor: "#8C2A2A",
    },
    "BBQ Ribs": {
        mainBgColor: "#592E25", // Dark BBQ brown
        blurColor: "#A66A58",
        textColor: "white",
        accentColor: "rgba(255, 255, 255, 0.9)",
        buttonBgColor: "white",
        buttonTextColor: "#592E25",
    },
    "Citrus Salmon": {
        mainBgColor: "#F47B62", // Salmon pink
        blurColor: "#FFC3B5",
        textColor: "white",
        accentColor: "rgba(255, 255, 255, 0.9)",
        buttonBgColor: "white",
        buttonTextColor: "#F47B62",
    },
};

// Meal product data with unique descriptions
export const juiceData: Record<ProductName, ProductInfo> = {
    "Marinated Chicken": {
        title: "Marinated Chicken",
        description:
            "Lean, premium chicken breast marinated in our signature blend of herbs and spices. Perfect for a quick, protein-packed meal.",
    },
    "Premium Beef": {
        title: "Premium Beef",
        description:
            "Juicy cuts of marbled beef, aged to perfection and pre-seasoned. Experience restaurant-quality steak from the comfort of your home.",
    },
    "BBQ Ribs": {
        title: "BBQ Ribs",
        description:
            "Fall-off-the-bone pork ribs coated in a rich, smoky barbecue rub. Slow-marinated so all you need to do is cook and enjoy.",
    },
    "Citrus Salmon": {
        title: "Citrus Salmon",
        description:
            "Fresh, sustainably sourced salmon fillets infused with zesty citrus and dill. A light, nutritious option bursting with Omega-3s.",
    },
};

// Size options for the product
export interface SizeOption {
    size: string;
    unit: string;
    selected?: boolean;
}

export const defaultSizes: SizeOption[] = [
    { size: "500", unit: "G", selected: true },
    { size: "200", unit: "G", selected: false },
    { size: "1", unit: "KG", selected: false },
];

// Helper function to get theme by product name
export function getTheme(productName: string): ThemeConfig {
    return canThemeMap[productName as ProductName] || canThemeMap["Marinated Chicken"];
}

// Helper function to get product info
export function getProductInfo(productName: string): ProductInfo {
    return juiceData[productName as ProductName] || juiceData["Marinated Chicken"];
}

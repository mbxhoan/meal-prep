// Theme configuration for different juice flavors
export type JuiceName = "Lemon Ginger" | "Blueberry Açai" | "Mango Burst" | "Raspberry Rosé";

export interface ThemeConfig {
    mainBgColor: string;
    blurColor: string;
    textColor: string;
    accentColor: string;
    buttonBgColor: string;
    buttonTextColor: string;
}

export interface JuiceInfo {
    title: string;
    description: string;
}

// Can color and text color map
export const canThemeMap: Record<JuiceName, ThemeConfig> = {
    "Lemon Ginger": {
        mainBgColor: "#82AF38",
        blurColor: "#E5F985",
        textColor: "white",
        accentColor: "rgba(255, 255, 255, 0.9)",
        buttonBgColor: "white",
        buttonTextColor: "#82AF38",
    },
    "Blueberry Açai": {
        mainBgColor: "#385dd2",
        blurColor: "#B6B6F9",
        textColor: "white",
        accentColor: "rgba(255, 255, 255, 0.9)",
        buttonBgColor: "white",
        buttonTextColor: "#385dd2",
    },
    "Mango Burst": {
        mainBgColor: "#FFA500",
        blurColor: "#FFF3B6",
        textColor: "#222",
        accentColor: "rgba(0,0,0,0.7)",
        buttonBgColor: "white",
        buttonTextColor: "#FFA500",
    },
    "Raspberry Rosé": {
        mainBgColor: "#FF6B81",
        blurColor: "#FFD6DE",
        textColor: "white",
        accentColor: "rgba(255,255,255,0.9)",
        buttonBgColor: "white",
        buttonTextColor: "#FF6B81",
    },
};

// Juice product data with unique descriptions for each flavor
export const juiceData: Record<JuiceName, JuiceInfo> = {
    "Lemon Ginger": {
        title: "Lemon Ginger",
        description:
            "A zesty and refreshing blend with a spicy kick. Our Lemon Ginger juice combines the citrusy brightness of fresh lemons with the warming properties of ginger.",
    },
    "Blueberry Açai": {
        title: "Blueberry Açai",
        description:
            "A nutrient-packed superfood blend. Our Blueberry Açai juice brings together antioxidant-rich berries with the exotic taste of açai for a delicious health boost.",
    },
    "Mango Burst": {
        title: "Mango Burst",
        description:
            "A tropical explosion of sweetness. Our Mango Burst juice captures the sun-ripened goodness of premium mangoes for a taste of paradise in every sip.",
    },
    "Raspberry Rosé": {
        title: "Raspberry Rosé",
        description:
            "An elegant and sophisticated blend. Our Raspberry Rosé juice combines the delicate sweetness of raspberries with subtle floral notes for a refined exp.",
    },
};

// Size options for the product
export interface SizeOption {
    size: string;
    unit: string;
    selected?: boolean;
}

export const defaultSizes: SizeOption[] = [
    { size: "355", unit: "ML", selected: true },
    { size: "500", unit: "ML", selected: false },
    { size: "1", unit: "L", selected: false },
];

// Helper function to get theme by juice name
export function getTheme(juiceName: string): ThemeConfig {
    return canThemeMap[juiceName as JuiceName] || canThemeMap["Lemon Ginger"];
}

// Helper function to get juice info
export function getJuiceInfo(juiceName: string): JuiceInfo {
    return juiceData[juiceName as JuiceName] || juiceData["Lemon Ginger"];
}

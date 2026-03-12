import { NavItem } from "@/features/navigation";
import { SizeOption } from "@/features/product-showcase";

export interface PageContent {
    nav: {
        logo: string;
        items: NavItem[];
        cartCount: number;
    };
    logo: {
        text: string;
    };
    sizes: SizeOption[];
    product: {
        title: string;
        description: string;
        buttonText: string;
    };
    scroll: {
        firstLine: string;
        secondLine: string;
    };
}

export const pageContent: PageContent = {
    nav: {
        logo: "MEAL PREP",
        items: [
            { label: "Chicken", href: "/#" },
            { label: "Beef", href: "/#" },
            { label: "Pork", href: "/#" },
            { label: "Seafood", href: "/#" },
            { label: "Spices", href: "/#" },
            { label: "Menu", href: "/menu" },
            { label: "About", href: "/about" },
        ],
        cartCount: 2,
    },
    logo: {
        text: "MEAL PREP",
    },
    sizes: [
        { size: "500", unit: "G", selected: true },
        { size: "200", unit: "G" },
        { size: "1", unit: "KG" },
    ],
    product: {
        title: "Marinated Chicken",
        description:
            "Enjoy our perfectly marinated meats, packed with protein and gourmet flavor. Designed for athletes, health enthusiasts, and busy professionals who demand maximum taste with zero prep time.",
        buttonText: "Order Now",
    },
    scroll: {
        firstLine: "Scroll",
        secondLine: "Down",
    },
};

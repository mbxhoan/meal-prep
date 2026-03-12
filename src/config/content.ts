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
        logo: "Juicy",
        items: [
            { label: "Flavour" },
            { label: "Drinks" },
            { label: "Fruit" },
            { label: "About" },
            { label: "Contact" },
        ],
        cartCount: 2,
    },
    logo: {
        text: "JUICY",
    },
    sizes: [
        { size: "355", unit: "ML", selected: true },
        { size: "100", unit: "ML" },
        { size: "125", unit: "ML" },
    ],
    product: {
        title: "Cheeky lime",
        description:
            "Discover a world of vibrant flavors with our premium juice selection. At Fresh & Juicy, we believe in the power of nature's finest ingredients to bring you",
        buttonText: "See More",
    },
    scroll: {
        firstLine: "Get",
        secondLine: "This",
    },
};

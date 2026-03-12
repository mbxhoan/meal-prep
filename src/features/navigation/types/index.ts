export interface NavItem {
    label: string;
    href?: string;
}

export interface NavBarProps {
    logo: string;
    navItems: NavItem[];
    cartItemCount: number;
    bgColor?: string;
    textColor?: string;
    themeColor?: string;
    buttonTextColor?: string;
}

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export interface AccountDropdownProps {
    themeColor: string;
    isDesktop?: boolean;
    onClose?: () => void;
}

export interface CartDropdownProps {
    cartItems: CartItem[];
    themeColor: string;
    isDesktop?: boolean;
    onClose?: () => void;
}

export interface MobileMenuProps {
    navItems: NavItem[];
    cartItemCount: number;
    themeColor: string;
    activeDropdown: "cart" | "account" | "menu" | null;
    textColor: string;
    toggleDropdown: (dropdown: "cart" | "account" | "menu") => void;
}

export interface NavLinksProps {
    navItems: NavItem[];
    textColor: string;
}

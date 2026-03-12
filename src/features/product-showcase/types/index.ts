export interface ProductInfoProps {
    title: string;
    juiceData: Record<
        string,
        {
            title: string;
            description: string;
        }
    >;
    buttonText: string;
    titleColor?: string;
    descColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
}

export interface JuicyLogoProps {
    text: string;
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    className?: string;
    isMobile?: boolean;
}

export interface SizeOption {
    size: string;
    unit: string;
    selected?: boolean;
}

export interface SizeSelectorProps {
    sizes: SizeOption[];
    selectedColor?: string;
    unselectedColor?: string;
    textColor?: string;
    selectedTextColor?: string;
    onSelect?: (size: string) => void;
}

export interface ScrollDownButtonProps {
    firstLine: string;
    secondLine: string;
    size?: number;
    textColor?: string;
    hoverBgColor?: string;
    themeColor?: string;
    isMobile?: boolean;
}

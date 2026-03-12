export type IceCubesProps = {
    theme?: {
        mainBgColor: string;
        blurColor: string;
        textColor: string;
    };
    containerWidth?: number;
    cubeCount?: number; // Number of ice cubes per side
    leafCount?: number; // Number of leaves per side
};

export type ElementConfig = {
    size: number;
    rotation: string;
    flipX: number; // Flip on X axis
    flipY: number; // Flip on Y axis
    zIndex: number;
    opacity: number;
    elementType: "cube" | "leaf"; // Element type
    variant?: 1 | 2; // Variant number for leaves
    offsetY: string;
    animationDelay: number;
    blurLevel?: number; // Blur level for elements
};

export type ElementProps = {
    element: ElementConfig;
    side: 'left' | 'right';
    mounted: boolean;
    index: number;
};

export type ColumnProps = {
    side: 'left' | 'right';
    elements: ElementConfig[];
    containerWidth: number;
    mounted: boolean;
    columnRef: React.RefObject<HTMLDivElement>;
};
